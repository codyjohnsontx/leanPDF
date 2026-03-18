import { useRef, useState, type ReactNode } from 'react';
import { UploadCloud, X, Download, RotateCcw } from 'lucide-react';
import { downloadBytes } from '../../lib/utils/download';
import { downloadBlob } from '../../lib/utils/download';
import { Button } from '@/components/ui/button';

interface Props {
  multiple?: boolean;
  children: (files: File[]) => ReactNode;
  actionLabel: string;
  onAction: (files: File[]) => Promise<{ filename: string; data: Uint8Array | Blob }>;
  onFilesChange?: (files: File[]) => void;
  accept?: string;
}

export function PdfToolShell({ multiple = false, children, actionLabel, onAction, onFilesChange, accept = 'application/pdf,.pdf' }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ filename: string; data: Uint8Array | Blob } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const dropZoneInputRef = useRef<HTMLInputElement | null>(null);
  const addMoreInputRef = useRef<HTMLInputElement | null>(null);

  function addFiles(incoming: FileList | null, inputEl: HTMLInputElement | null) {
    if (!incoming) return;
    const pdfs = Array.from(incoming).filter((f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');
    const next = multiple ? [...files, ...pdfs] : pdfs.slice(0, 1);
    setFiles(next);
    onFilesChange?.(next);
    setResult(null);
    setError(null);
    if (inputEl) inputEl.value = '';
  }

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange?.(newFiles);
  }

  async function handleAction() {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setProgress('Processing…');
    try {
      const res = await onAction(files);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }

  function handleDownload() {
    if (!result) return;
    if (result.data instanceof Uint8Array) {
      downloadBytes(result.filename, result.data, 'application/pdf');
    } else {
      downloadBlob(result.filename, result.data);
    }
  }

  function handleReset() {
    setFiles([]);
    onFilesChange?.([]);
    setResult(null);
    setError(null);
    setProgress(null);
  }

  if (result) {
    return (
      <div className="pdf-result">
        <div className="viewer-notice" style={{ fontSize: '1rem', padding: '0.7rem 1rem' }}>✓ Done — your file is ready</div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Button type="button" onClick={handleDownload} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Download size={15} /> Download {result.filename}
          </Button>
          <Button variant="ghost" type="button" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={14} /> Start over
          </Button>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        className={`pdf-drop-zone ${dragActive ? 'is-active' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files, null); }}
        role="presentation"
      >
        <UploadCloud size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Drag {multiple ? 'PDFs' : 'a PDF'} here</p>
        <p className="helper-copy" style={{ margin: '0 0 18px' }}>or choose from your device</p>
        <Button type="button" onClick={() => dropZoneInputRef.current?.click()}>
          Choose {multiple ? 'files' : 'file'}
        </Button>
        <input
          ref={dropZoneInputRef}
          hidden
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => addFiles(e.target.files, e.currentTarget)}
        />
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: '16px' }}>
      <div className="pdf-file-list">
        {files.map((file, i) => (
          <div key={i} className="pdf-file-row">
            <span style={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', flexShrink: 0 }}>
              {file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`}
            </span>
            <Button variant="tool" type="button" onClick={() => removeFile(i)} aria-label="Remove file" style={{ padding: '4px', flexShrink: 0 }}>
              <X size={14} />
            </Button>
          </div>
        ))}
        <Button
          variant="ghost"
          type="button"
          onClick={() => addMoreInputRef.current?.click()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', marginTop: '4px' }}
        >
          + Add {multiple ? 'more files' : 'different file'}
        </Button>
        <input
          ref={addMoreInputRef}
          hidden
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => addFiles(e.target.files, e.currentTarget)}
        />
      </div>

      {children(files)}

      {error ? <p className="field-error" role="alert">{error}</p> : null}

      <Button
        type="button"
        onClick={() => void handleAction()}
        disabled={isProcessing || files.length === 0}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
      >
        {isProcessing ? (progress ?? 'Processing…') : actionLabel}
      </Button>
    </div>
  );
}
