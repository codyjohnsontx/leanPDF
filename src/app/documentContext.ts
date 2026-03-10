import { createContext } from 'react';
import type { ActiveDocument } from './documentState';
import type {
  AnnotationRecord,
  ExportOptions,
  FormFieldSchema,
  OpenDocumentResult,
  RecentDocumentRecord,
  StoredSignatureAsset,
  ViewerRotation,
  ViewerTool,
} from '../lib/pdf/types';

export type DocumentContextValue = {
  activeDocument: ActiveDocument | null;
  recentDocuments: RecentDocumentRecord[];
  signatures: StoredSignatureAsset[];
  hydrated: boolean;
  isBusy: boolean;
  openFile: (file: File, options?: { password?: string }) => Promise<OpenDocumentResult>;
  resumeDocument: (documentId: string, options?: { password?: string }) => Promise<OpenDocumentResult>;
  setPageCount: (pageCount: number) => void;
  setCurrentPage: (pageNumber: number) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: ViewerRotation) => void;
  setFormSchema: (schema: FormFieldSchema[]) => void;
  setFormValue: (name: string, value: string | string[] | boolean) => void;
  upsertAnnotation: (annotation: AnnotationRecord) => void;
  removeAnnotation: (annotationId: string) => void;
  selectAnnotation: (annotationId: string | null) => void;
  setTool: (tool: ViewerTool) => void;
  addSignatureAsset: (signature: StoredSignatureAsset) => Promise<void>;
  deleteSignatureAsset: (signatureId: string) => Promise<void>;
  setSelectedSignature: (signatureId: string | null) => void;
  exportDocument: (options: ExportOptions) => Promise<void>;
};

export const DocumentContext = createContext<DocumentContextValue | null>(null);
