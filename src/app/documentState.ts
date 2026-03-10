import type {
  AnnotationRecord,
  DraftSessionRecord,
  FormFieldSchema,
  RecentDocumentRecord,
  StoredSignatureAsset,
  ViewerTool,
} from '../lib/pdf/types';

export type ActiveDocument = DraftSessionRecord & {
  formSchema: FormFieldSchema[];
  selectedAnnotationId: string | null;
  accessPassword: string | null;
};

export type DocumentState = {
  activeDocument: ActiveDocument | null;
  recentDocuments: RecentDocumentRecord[];
  signatures: StoredSignatureAsset[];
  hydrated: boolean;
};

export const initialDocumentState: DocumentState = {
  activeDocument: null,
  recentDocuments: [],
  signatures: [],
  hydrated: false,
};

export type DocumentAction =
  | { type: 'hydrate'; recentDocuments: RecentDocumentRecord[]; signatures: StoredSignatureAsset[] }
  | { type: 'set-active-document'; document: ActiveDocument }
  | { type: 'set-page-count'; pageCount: number }
  | { type: 'set-current-page'; currentPage: number }
  | { type: 'set-zoom'; zoom: number }
  | { type: 'set-rotation'; rotation: 0 | 90 | 180 | 270 }
  | { type: 'set-form-schema'; formSchema: FormFieldSchema[] }
  | { type: 'set-form-value'; name: string; value: string | string[] | boolean }
  | { type: 'upsert-annotation'; annotation: AnnotationRecord }
  | { type: 'remove-annotation'; annotationId: string }
  | { type: 'select-annotation'; annotationId: string | null }
  | { type: 'set-tool'; tool: ViewerTool }
  | { type: 'set-selected-signature'; signatureId: string | null }
  | { type: 'add-signature'; signature: StoredSignatureAsset }
  | { type: 'remove-signature'; signatureId: string };

export function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        hydrated: true,
        recentDocuments: action.recentDocuments,
        signatures: action.signatures,
      };

    case 'set-active-document':
      return {
        ...state,
        activeDocument: action.document,
        recentDocuments: [
          {
            id: action.document.id,
            name: action.document.name,
            lastOpenedAt: action.document.lastOpenedAt,
            pageCount: action.document.pageCount,
          },
          ...state.recentDocuments.filter((document) => document.id !== action.document.id),
        ].slice(0, 8),
      };

    case 'set-page-count':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          pageCount: action.pageCount,
        },
      };

    case 'set-current-page':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          currentPage: action.currentPage,
        },
      };

    case 'set-zoom':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          zoom: action.zoom,
        },
      };

    case 'set-rotation':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          rotation: action.rotation,
          hasUnsavedChanges: true,
        },
      };

    case 'set-form-schema':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          formSchema: action.formSchema,
        },
      };

    case 'set-form-value':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          formValues: {
            ...state.activeDocument.formValues,
            [action.name]: action.value,
          },
          hasUnsavedChanges: true,
        },
      };

    case 'upsert-annotation':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          annotations: [
            ...state.activeDocument.annotations.filter((annotation) => annotation.id !== action.annotation.id),
            action.annotation,
          ].sort(
            (left, right) =>
              left.pageIndex - right.pageIndex || left.createdAt.localeCompare(right.createdAt),
          ),
          selectedAnnotationId: action.annotation.id,
          hasUnsavedChanges: true,
        },
      };

    case 'remove-annotation':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          annotations: state.activeDocument.annotations.filter(
            (annotation) => annotation.id !== action.annotationId,
          ),
          selectedAnnotationId:
            state.activeDocument.selectedAnnotationId === action.annotationId
              ? null
              : state.activeDocument.selectedAnnotationId,
          hasUnsavedChanges: true,
        },
      };

    case 'select-annotation':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          selectedAnnotationId: action.annotationId,
        },
      };

    case 'set-tool':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          selectedTool: action.tool,
        },
      };

    case 'set-selected-signature':
      if (!state.activeDocument) {
        return state;
      }

      return {
        ...state,
        activeDocument: {
          ...state.activeDocument,
          selectedSignatureAssetId: action.signatureId,
        },
      };

    case 'add-signature':
      return {
        ...state,
        signatures: [action.signature, ...state.signatures.filter((item) => item.id !== action.signature.id)],
      };

    case 'remove-signature':
      return {
        ...state,
        signatures: state.signatures.filter((signature) => signature.id !== action.signatureId),
        activeDocument: state.activeDocument
          ? {
              ...state.activeDocument,
              selectedSignatureAssetId:
                state.activeDocument.selectedSignatureAssetId === action.signatureId
                  ? null
                  : state.activeDocument.selectedSignatureAssetId,
            }
          : null,
      };

    default:
      return state;
  }
}
