import {
  startTransition,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type PropsWithChildren,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentContext, type DocumentContextValue } from './documentContext';
import { documentReducer, initialDocumentState, type ActiveDocument } from './documentState';
import { createId } from '../lib/utils/ids';
import { listRecentDocuments, sessionStore } from '../lib/storage/sessionStore';
import { listSignatures, removeSignature, saveSignature } from '../lib/storage/signatureStore';
import { exportEditedPdf } from '../lib/pdf/pdf';
import { authenticatePdfAccess, exportProtectedPdf } from '../lib/pdf/security';
import { downloadBytes } from '../lib/utils/download';
import type {
  AnnotationRecord,
  DocumentProtectionStatus,
  DraftSessionRecord,
  ExportOptions,
  FormFieldSchema,
  OpenDocumentResult,
  ViewerRotation,
  ViewerTool,
} from '../lib/pdf/types';

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

  const value = useMemo<DocumentContextValue>(
    () => ({
      activeDocument: state.activeDocument,
      recentDocuments: state.recentDocuments,
      signatures: state.signatures,
      hydrated: state.hydrated,
      isBusy,
      async openFile(file, options) {
        setIsBusy(true);
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
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
      setPageCount(pageCount) {
        dispatch({ type: 'set-page-count', pageCount });
      },
      setCurrentPage(currentPage) {
        dispatch({ type: 'set-current-page', currentPage });
      },
      setZoom(zoom) {
        dispatch({ type: 'set-zoom', zoom: Math.max(0.55, Math.min(2.4, zoom)) });
      },
      setRotation(rotation) {
        dispatch({ type: 'set-rotation', rotation });
      },
      setFormSchema(formSchema) {
        dispatch({ type: 'set-form-schema', formSchema });
      },
      setFormValue(name, value) {
        dispatch({ type: 'set-form-value', name, value });
      },
      upsertAnnotation(annotation) {
        dispatch({ type: 'upsert-annotation', annotation });
      },
      removeAnnotation(annotationId) {
        dispatch({ type: 'remove-annotation', annotationId });
      },
      selectAnnotation(annotationId) {
        dispatch({ type: 'select-annotation', annotationId });
      },
      setTool(tool) {
        dispatch({ type: 'set-tool', tool });
      },
      async addSignatureAsset(signature) {
        await saveSignature(signature);
        dispatch({ type: 'add-signature', signature });
      },
      async deleteSignatureAsset(signatureId) {
        await removeSignature(signatureId);
        dispatch({ type: 'remove-signature', signatureId });
      },
      setSelectedSignature(signatureId) {
        dispatch({ type: 'set-selected-signature', signatureId });
      },
      async exportDocument(options: ExportOptions) {
        if (!state.activeDocument) {
          return;
        }

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
            ? await exportProtectedPdf({
                bytes: standardBytes,
                password: options.password ?? '',
              })
            : standardBytes;
        const exportedName = state.activeDocument.name.replace(/\.pdf$/i, '') || 'document';
        downloadBytes(`${exportedName}-leanpdf.pdf`, bytes, 'application/pdf');
      },
    }),
    [isBusy, navigate, state.activeDocument, state.hydrated, state.recentDocuments, state.signatures],
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}
