export type DocumentId = string;

export type ViewerTool =
  | 'move'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'note'
  | 'shape'
  | 'ink'
  | 'signature';

export type ViewerRotation = 0 | 90 | 180 | 270;

export type ExportMode = 'standard' | 'protected';

export type ExportOptions = {
  mode: ExportMode;
  password?: string;
};

export type DocumentProtectionStatus =
  | { kind: 'unencrypted' }
  | {
      kind: 'encrypted';
      requiresPassword: boolean;
      authenticated: boolean;
      algorithm?: 'RC4-40' | 'RC4-128' | 'AES-128' | 'AES-256';
    };

export type OpenDocumentResult =
  | { kind: 'opened' }
  | { kind: 'password-required' }
  | { kind: 'invalid-password' }
  | { kind: 'error'; message: string };

export type Point = {
  x: number;
  y: number;
};

export type RectPayload = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity?: number;
};

export type LinePayload = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  thickness: number;
};

export type NotePayload = {
  x: number;
  y: number;
  color: string;
  comment: string;
};

export type InkPayload = {
  color: string;
  thickness: number;
  strokes: Point[][];
};

export type ShapePayload = RectPayload & {
  strokeWidth: number;
  fill?: string;
};

export type SignaturePlacementPayload = {
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
};

export type AnnotationKind =
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'note'
  | 'ink'
  | 'shape'
  | 'signature';

export type AnnotationPayload =
  | RectPayload
  | LinePayload
  | NotePayload
  | InkPayload
  | ShapePayload
  | SignaturePlacementPayload;

export type AnnotationRecord = {
  id: string;
  kind: AnnotationKind;
  pageIndex: number;
  authorLabel: string;
  createdAt: string;
  updatedAt: string;
  payload: AnnotationPayload;
};

export type SignatureAsset =
  | {
      kind: 'typed';
      text: string;
      fontFamily: string;
      color?: string;
    }
  | {
      kind: 'drawn';
      strokes: Point[][];
      dataUrl: string;
    }
  | {
      kind: 'image';
      blobId: string;
      dataUrl: string;
      mimeType: string;
    };

export type StoredSignatureAsset = SignatureAsset & {
  id: string;
  label: string;
  createdAt: string;
};

export type RecentDocumentRecord = {
  id: string;
  name: string;
  lastOpenedAt: string;
  pageCount?: number;
};

export type FormFieldKind = 'text' | 'checkbox' | 'dropdown' | 'radio' | 'option-list' | 'unknown';

export type FormFieldSchema = {
  name: string;
  kind: FormFieldKind;
  value: string | string[] | boolean;
  options?: string[];
};

export type DraftSessionRecord = {
  id: string;
  documentId: string;
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  currentPage: number;
  zoom: number;
  rotation: ViewerRotation;
  hasUnsavedChanges: boolean;
  annotations: AnnotationRecord[];
  formValues: Record<string, string | string[] | boolean>;
  selectedTool: ViewerTool;
  selectedSignatureAssetId: string | null;
  protectionStatus: DocumentProtectionStatus;
  lastOpenedAt: string;
};

export type ProtectedExportOptions = {
  password: string;
};

export interface DraftStore {
  save(sessionId: string, data: DraftSessionRecord): Promise<void>;
  load(sessionId: string): Promise<DraftSessionRecord | null>;
  remove(sessionId: string): Promise<void>;
}
