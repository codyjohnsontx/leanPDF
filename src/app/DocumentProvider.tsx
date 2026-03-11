import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentContext, type DocumentContextValue } from './documentContext';
import { documentReducer, initialDocumentState, type ActiveDocument } from './documentState';
import { createId } from '../lib/utils/ids';
import { listRecentDocuments, sessionStore } from '../lib/storage/sessionStore';
import { listSignatures, removeSignature, saveSignature } from '../lib/storage/signatureStore';
import { downloadBytes } from '../lib/utils/download';
import type {
  AnnotationRecord,
  DocumentProtectionStatus,
  DraftSessionRecord,
  ExportOptions,
  FormFieldSchema,
  OpenDocumentResult,
  StoredSignatureAsset,
  ViewerRotation,
  ViewerTool,
} from '../lib/pdf/types';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function createDraftDocument(options: {
  id: string;
  name: string;
  bytes: Uint8Array;
  pageCount?: number;
  annotations?: AnnotationRecord[];
  formValues?: Record<string, string | string[] | boolean>;
  selectedTool?: ViewerTool;
  selectedSignatureAssetId?: string | null;
  zoom?: number;
  rotation?: ViewerRotation;
  currentPage?: number;
  lastOpenedAt?: string;
  formSchema?: FormFieldSchema[];
  protectionStatus?: DocumentProtectionStatus;
  accessPassword?: string | null;
}) {
  return {
    id: options.id,
    documentId: options.id,
    name: options.name,
    bytes: options.bytes,
    pageCount: options.pageCount ?? 0,
    currentPage: options.currentPage ?? 1,
    zoom: options.zoom ?? 1.15,
    rotation: options.rotation ?? 0,
    hasUnsavedChanges: false,
    annotations: options.annotations ?? [],
    formValues: options.formValues ?? {},
    selectedTool: options.selectedTool ?? 'move',
    selectedSignatureAssetId: options.selectedSignatureAssetId ?? null,
    protectionStatus: options.protectionStatus ?? { kind: 'unencrypted' },
    lastOpenedAt: options.lastOpenedAt ?? new Date().toISOString(),
    formSchema: options.formSchema ?? [],
    selectedAnnotationId: null,
    accessPassword: options.accessPassword ?? null,
  } satisfies ActiveDocument;
}

export function DocumentProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(documentReducer, initialDocumentState);
  const [isBusy, setIsBusy] = useState(false);
  const navigate = useNavigate();

  // M-5: module-level promise caches moved into refs so HMR invalidates them correctly
  const securityModuleRef = useRef<Promise<typeof import('../lib/pdf/security')> | null>(null);
  const editorModuleRef = useRef<Promise<typeof import('../lib/pdf/editor')> | null>(null);

  function loadSecurityModule() {
    if (!securityModuleRef.current) {
      securityModuleRef.current = import('../lib/pdf/security');
    }
    return securityModuleRef.current;
  }

  function loadEditorModule() {
    if (!editorModuleRef.current) {
      editorModuleRef.current = import('../lib/pdf/editor');
    }
    return editorModuleRef.current;
  }

  useEffect(() => {
    let isMounted = true;

    void Promise.all([listRecentDocuments(), listSignatures()]).then(([recentDocuments, signatures]) => {
      if (!isMounted) {
        return;
      }

      dispatch({ type: 'hydrate', recentDocuments, signatures });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated || !state.activeDocument) {
      return;
    }

    const activeDocument = state.activeDocument;
    const timeout = window.setTimeout(() => {
      const draft: DraftSessionRecord = {
        id: activeDocument.id,
        documentId: activeDocument.documentId,
        name: activeDocument.name,
        bytes: activeDocument.bytes,
        pageCount: activeDocument.pageCount,
        currentPage: activeDocument.currentPage,
        zoom: activeDocument.zoom,
        rotation: activeDocument.rotation,
        hasUnsavedChanges: activeDocument.hasUnsavedChanges,
        annotations: activeDocument.annotations,
        formValues: activeDocument.formValues,
        selectedTool: activeDocument.selectedTool,
        selectedSignatureAssetId: activeDocument.selectedSignatureAssetId,
        protectionStatus: activeDocument.protectionStatus,
        lastOpenedAt: new Date().toISOString(),
      };

      void sessionStore.save(activeDocument.id, draft);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.activeDocument, state.hydrated]);

  // H-2: Handlers that only call dispatch() get stable useCallback identities.
  // dispatch from useReducer is guaranteed stable, so these never change.
  const setPageCount = useCallback((pageCount: number) => {
    dispatch({ type: 'set-page-count', pageCount });
  }, []);

  const setCurrentPage = useCallback((currentPage: number) => {
    dispatch({ type: 'set-current-page', currentPage });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'set-zoom', zoom: Math.max(0.55, Math.min(2.4, zoom)) });
  }, []);

  const setRotation = useCallback((rotation: ViewerRotation) => {
    dispatch({ type: 'set-rotation', rotation });
  }, []);

  const setFormSchema = useCallback((formSchema: FormFieldSchema[]) => {
    dispatch({ type: 'set-form-schema', formSchema });
  }, []);

  const setFormValue = useCallback((name: string, value: string | string[] | boolean) => {
    dispatch({ type: 'set-form-value', name, value });
  }, []);

  const upsertAnnotation = useCallback((annotation: AnnotationRecord) => {
    dispatch({ type: 'upsert-annotation', annotation });
  }, []);

  const removeAnnotation = useCallback((annotationId: string) => {
    dispatch({ type: 'remove-annotation', annotationId });
  }, []);

  const selectAnnotation = useCallback((annotationId: string | null) => {
    dispatch({ type: 'select-annotation', annotationId });
  }, []);

  const setTool = useCallback((tool: ViewerTool) => {
    dispatch({ type: 'set-tool', tool });
  }, []);

  const setSelectedSignature = useCallback((signatureId: string | null) => {
    dispatch({ type: 'set-selected-signature', signatureId });
  }, []);

  const addSignatureAsset = useCallback(async (signature: StoredSignatureAsset) => {
    await saveSignature(signature);
    dispatch({ type: 'add-signature', signature });
  }, []);

  const deleteSignatureAsset = useCallback(async (signatureId: string) => {
    await removeSignature(signatureId);
    dispatch({ type: 'remove-signature', signatureId });
  }, []);

  // Handlers that read state.activeDocument or state.signatures are kept in useMemo
  // so they only rebuild when those specific slices change.
  const value = useMemo<DocumentContextValue>(
    () => ({
      activeDocument: state.activeDocument,
      recentDocuments: state.recentDocuments,
      signatures: state.signatures,
      hydrated: state.hydrated,
      isBusy,
      // H-3: file size guard added before arrayBuffer()
      async openFile(file, options) {
        if (file.size > MAX_FILE_SIZE) {
          console.error(`File "${file.name}" exceeds the 100 MB limit and cannot be opened.`);
          return {
            kind: 'error',
            message: `"${file.name}" exceeds the 100 MB size limit.`,
          } satisfies OpenDocumentResult;
        }

        setIsBusy(true);
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const { authenticatePdfAccess } = await loadSecurityModule();
          const access = await authenticatePdfAccess({
            bytes,
            password: options?.password,
          });

          if (access.kind !== 'loaded') {
            return access;
          }

          const id = createId('doc');
          const document = createDraftDocument({
            id,
            name: file.name,
            bytes,
            protectionStatus: access.protectionStatus,
            accessPassword: access.protectionStatus.kind === 'encrypted' ? options?.password ?? null : null,
          });

          dispatch({ type: 'set-active-document', document });
          startTransition(() => {
            navigate('/viewer');
          });
          return { kind: 'opened' } satisfies OpenDocumentResult;
        } catch (error) {
          return {
            kind: 'error',
            message: error instanceof Error ? error.message : 'The PDF could not be opened.',
          } satisfies OpenDocumentResult;
        } finally {
          setIsBusy(false);
        }
      },
      async resumeDocument(documentId, options) {
        setIsBusy(true);
        try {
          const record = await sessionStore.load(documentId);
          if (!record) {
            return {
              kind: 'error',
              message: 'The saved draft could not be found.',
            } satisfies OpenDocumentResult;
          }

          const protectionStatus = record.protectionStatus ?? { kind: 'unencrypted' as const };

          const { authenticatePdfAccess } = await loadSecurityModule();
          const access = await authenticatePdfAccess({
            bytes: record.bytes,
            password: protectionStatus.kind === 'encrypted' ? options?.password : undefined,
          });

          if (access.kind !== 'loaded') {
            return access;
          }

          const document = createDraftDocument({
            id: record.id,
            name: record.name,
            bytes: record.bytes,
            pageCount: record.pageCount,
            currentPage: record.currentPage,
            zoom: record.zoom,
            rotation: record.rotation,
            annotations: record.annotations,
            formValues: record.formValues,
            selectedTool: record.selectedTool,
            selectedSignatureAssetId: record.selectedSignatureAssetId,
            lastOpenedAt: record.lastOpenedAt,
            protectionStatus,
            accessPassword: protectionStatus.kind === 'encrypted' ? options?.password ?? null : null,
          });
          dispatch({ type: 'set-active-document', document });
          startTransition(() => {
            navigate('/viewer');
          });
          return { kind: 'opened' } satisfies OpenDocumentResult;
        } catch (error) {
          return {
            kind: 'error',
            message: error instanceof Error ? error.message : 'The saved draft could not be reopened.',
          } satisfies OpenDocumentResult;
        } finally {
          setIsBusy(false);
        }
      },
      setPageCount,
      setCurrentPage,
      setZoom,
      setRotation,
      setFormSchema,
      setFormValue,
      upsertAnnotation,
      removeAnnotation,
      selectAnnotation,
      setTool,
      addSignatureAsset,
      deleteSignatureAsset,
      setSelectedSignature,
      async exportDocument(options: ExportOptions) {
        if (!state.activeDocument) {
          return;
        }

        const { exportEditedPdf } = await loadEditorModule();
        const standardBytes = await exportEditedPdf({
          bytes: state.activeDocument.bytes,
          annotations: state.activeDocument.annotations,
          formValues: state.activeDocument.formValues,
          signatures: state.signatures,
          password: state.activeDocument.accessPassword,
          protectionStatus: state.activeDocument.protectionStatus,
        });
        const bytes =
          options.mode === 'protected'
            ? await (await loadSecurityModule()).exportProtectedPdf({
                bytes: standardBytes,
                password: options.password ?? '',
              })
            : standardBytes;
        const exportedName = state.activeDocument.name.replace(/\.pdf$/i, '') || 'document';
        downloadBytes(`${exportedName}-leanpdf.pdf`, bytes, 'application/pdf');
      },
    }),
    // Stable callbacks are not listed here because they never change.
    // Only the values that actually require the memo to rebuild are listed.
    [
      isBusy,
      navigate,
      state.activeDocument,
      state.hydrated,
      state.recentDocuments,
      state.signatures,
      setPageCount,
      setCurrentPage,
      setZoom,
      setRotation,
      setFormSchema,
      setFormValue,
      upsertAnnotation,
      removeAnnotation,
      selectAnnotation,
      setTool,
      addSignatureAsset,
      deleteSignatureAsset,
      setSelectedSignature,
    ],
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}
