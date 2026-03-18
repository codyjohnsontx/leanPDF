import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  Hand,
  Highlighter,
  Underline,
  Strikethrough,
  MessageSquare,
  Square,
  PenLine,
  PenTool,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Search,
  FileText,
  ImagePlus,
  ChevronLeft,
  AlignLeft,
} from 'lucide-react';
import { useDocument } from '../../app/useDocument';
import { createId } from '../../lib/utils/ids';
import { buildPdfSearchIndex, loadPdfDocument } from '../../lib/pdf/viewer';
import type {
  FormFieldSchema,
  NotePayload,
  StoredSignatureAsset,
  ViewerTool,
} from '../../lib/pdf/types';
import { buildSearchResults } from '../../lib/utils/search';
import { ExportModal } from './ExportModal';
import { PageThumbnail } from './PageThumbnail';
import { PdfPageView } from './PdfPageView';

let formsModulePromise: Promise<typeof import('../../lib/pdf/forms')> | null = null;

function loadFormsModule() {
  formsModulePromise ??= import('../../lib/pdf/forms');
  return formsModulePromise;
}

const TOOLBAR: Array<{ id: ViewerTool; label: string; icon: React.ReactNode }> = [
  { id: 'move', label: 'Move', icon: <Hand size={14} /> },
  { id: 'highlight', label: 'Highlight', icon: <Highlighter size={14} /> },
  { id: 'underline', label: 'Underline', icon: <Underline size={14} /> },
  { id: 'strikeout', label: 'Strikeout', icon: <Strikethrough size={14} /> },
  { id: 'note', label: 'Note', icon: <MessageSquare size={14} /> },
  { id: 'shape', label: 'Shape', icon: <Square size={14} /> },
  { id: 'ink', label: 'Ink', icon: <PenLine size={14} /> },
  { id: 'signature', label: 'Signature', icon: <PenTool size={14} /> },
];

type RightTab = 'search' | 'forms' | 'signatures' | 'annotations';

const RIGHT_TABS: Array<{ id: RightTab; label: string; icon: React.ReactNode }> = [
  { id: 'search', label: 'Search', icon: <Search size={13} /> },
  { id: 'forms', label: 'Forms', icon: <FileText size={13} /> },
  { id: 'signatures', label: 'Signatures', icon: <PenTool size={13} /> },
  { id: 'annotations', label: 'Notes', icon: <AlignLeft size={13} /> },
];

function SignatureComposer(props: {
  onCreate: (signature: StoredSignatureAsset) => Promise<void>;
  isActive: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [typedName, setTypedName] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [strokes, setStrokes] = useState<number[][][]>([]);

  function createSignatureFromCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const dataUrl = canvas.toDataURL('image/png');
    return {
      id: createId('signature'),
      kind: 'drawn' as const,
      label: 'Drawn signature',
      createdAt: new Date().toISOString(),
      strokes: strokes.map((stroke) => stroke.map(([x, y]) => ({ x, y }))),
      dataUrl,
    };
  }

  return (
    <section
      style={{
        borderRadius: '20px',
        padding: '14px',
        border: '1px solid var(--border-alpha)',
        background: props.isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
      }}
    >
      <p className="section-title">Signature studio</p>
      <div className="stack" style={{ marginTop: '12px' }}>
        <label>
          <span className="field-label">Typed signature</span>
          <input
            className="field-input"
            value={typedName}
            onChange={(event) => setTypedName(event.target.value)}
            placeholder="Your name"
          />
        </label>
        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            void props.onCreate({
              id: createId('signature'),
              kind: 'typed',
              label: typedName || 'Typed signature',
              createdAt: new Date().toISOString(),
              text: typedName || 'Signature',
              fontFamily: '"Times New Roman", serif',
              color: '#14213d',
            });
          }}
        >
          Save typed signature
        </button>

        <div>
          <span className="field-label">Draw signature</span>
          <canvas
            ref={canvasRef}
            width={320}
            height={120}
            onPointerDown={(event) => {
              const canvas = canvasRef.current;
              if (!canvas) {
                return;
              }
              const context = canvas.getContext('2d');
              if (!context) {
                return;
              }
              const bounds = canvas.getBoundingClientRect();
              const x = (event.clientX - bounds.left) / bounds.width;
              const y = (event.clientY - bounds.top) / bounds.height;
              setDrawing(true);
              setStrokes((current) => [...current, [[x, y]]]);
              context.lineCap = 'round';
              context.lineJoin = 'round';
              context.lineWidth = 3;
              context.strokeStyle = '#14213d';
              context.beginPath();
              context.moveTo(x * canvas.width, y * canvas.height);
            }}
            onPointerMove={(event) => {
              if (!drawing) {
                return;
              }
              const canvas = canvasRef.current;
              if (!canvas) {
                return;
              }
              const context = canvas.getContext('2d');
              if (!context) {
                return;
              }
              const bounds = canvas.getBoundingClientRect();
              const x = (event.clientX - bounds.left) / bounds.width;
              const y = (event.clientY - bounds.top) / bounds.height;
              setStrokes((current) => {
                if (current.length === 0) {
                  return current;
                }
                const next = [...current];
                next[next.length - 1] = [...next[next.length - 1], [x, y]];
                return next;
              });
              context.lineTo(x * canvas.width, y * canvas.height);
              context.stroke();
            }}
            onPointerUp={() => setDrawing(false)}
            onPointerLeave={() => setDrawing(false)}
            style={{
              width: '100%',
              height: '120px',
              borderRadius: '16px',
              border: '1px solid var(--border-alpha)',
              background: 'rgba(255,255,255,0.92)',
              touchAction: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) {
                  return;
                }
                const context = canvas.getContext('2d');
                context?.clearRect(0, 0, canvas.width, canvas.height);
                setStrokes([]);
              }}
            >
              Clear
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                const signature = createSignatureFromCanvas();
                if (signature) {
                  void props.onCreate(signature);
                }
              }}
            >
              Save drawn signature
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderFormInput(
  field: FormFieldSchema,
  value: string | string[] | boolean,
  onChange: (value: string | string[] | boolean) => void,
) {
  if (field.kind === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span style={{ color: 'var(--text-muted)' }}>Checked</span>
      </label>
    );
  }

  if (field.kind === 'dropdown' || field.kind === 'radio') {
    return (
      <select
        className="field-select"
        value={Array.isArray(value) ? value[0] ?? '' : String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.kind === 'option-list') {
    return (
      <select
        multiple
        className="field-select"
        value={Array.isArray(value) ? value : []}
        onChange={(event) =>
          onChange(Array.from(event.target.selectedOptions).map((option) => option.value))
        }
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      className="field-input"
      value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Value"
    />
  );
}

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ViewerShell() {
  const {
    activeDocument,
    exportDocument,
    isBusy,
    removeAnnotation,
    selectAnnotation,
    setCurrentPage,
    setFormSchema,
    setFormValue,
    setPageCount,
    setRotation,
    setSelectedSignature,
    setTool,
    setZoom,
    signatures,
    addSignatureAsset,
    deleteSignatureAsset,
    upsertAnnotation,
  } = useDocument();
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [searchIndex, setSearchIndex] = useState<{ pageNumber: number; text: string }[]>([]);
  const [query, setQuery] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>('search');
  const [pageInput, setPageInput] = useState('');
  const [showAllAnnotations, setShowAllAnnotations] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const pageRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    if (!activeDocument) {
      return;
    }

    let cancelled = false;
    let currentPdf: PDFDocumentProxy | null = null;

    void (async () => {
      const [document, schema] = await Promise.all([
        loadPdfDocument(activeDocument.bytes, activeDocument.accessPassword ?? undefined),
        loadFormsModule().then(({ extractFormSchema }) =>
          extractFormSchema(activeDocument.bytes, activeDocument.accessPassword ?? undefined),
        ),
      ]);

      if (cancelled) {
        await document.destroy();
        return;
      }

      currentPdf = document;
      setPdfDocument(document);
      setPageCount(document.numPages);
      setFormSchema(schema);

      const entries = await buildPdfSearchIndex(document, () => cancelled);
      if (cancelled) {
        return;
      }

      setSearchIndex(entries);
    })();

    return () => {
      cancelled = true;
      void currentPdf?.destroy();
    };
  }, [activeDocument, setFormSchema, setPageCount]);

  useEffect(() => {
    if (!exportNotice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setExportNotice(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [exportNotice]);

  useEffect(() => {
    if (!pdfDocument || !activeDocument) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visible) {
          const pageNumber = Number((visible.target as HTMLElement).dataset.pageNumber ?? '1');
          setCurrentPage(pageNumber);
        }
      },
      {
        threshold: [0.45, 0.7, 0.9],
        rootMargin: '-20% 0px -40% 0px',
      },
    );

    const refs = pageRefs.current;
    refs.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [activeDocument, pdfDocument, setCurrentPage]);

  const selectedSignature = useMemo(
    () => signatures.find((signature) => signature.id === activeDocument?.selectedSignatureAssetId) ?? null,
    [activeDocument?.selectedSignatureAssetId, signatures],
  );

  const searchResults = useMemo(() => buildSearchResults(searchIndex, deferredQuery), [deferredQuery, searchIndex]);
  const selectedAnnotation =
    activeDocument?.annotations.find((annotation) => annotation.id === activeDocument.selectedAnnotationId) ?? null;

  if (!activeDocument) {
    return null;
  }

  function jumpToPage(pageNumber: number) {
    const node = pageRefs.current.get(pageNumber);
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setCurrentPage(pageNumber);
  }

  function handlePageInputSubmit(event: React.FormEvent) {
    event.preventDefault();
    const num = parseInt(pageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= activeDocument!.pageCount) {
      jumpToPage(num);
    }
    setPageInput('');
  }

  function handleNoteCommentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (!selectedAnnotation || selectedAnnotation.kind !== 'note') {
      return;
    }

    upsertAnnotation({
      ...selectedAnnotation,
      updatedAt: new Date().toISOString(),
      payload: {
        ...(selectedAnnotation.payload as NotePayload),
        comment: event.target.value,
      },
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const dataUrl = await readImageFile(file);
    await addSignatureAsset({
      id: createId('signature'),
      kind: 'image',
      label: file.name.replace(/\.[^.]+$/, ''),
      createdAt: new Date().toISOString(),
      blobId: createId('blob'),
      dataUrl,
      mimeType: file.type || 'image/png',
    });

    event.currentTarget.value = '';
  }

  async function handleExport(options: { mode: 'standard' | 'protected'; password?: string }) {
    setIsExporting(true);
    try {
      await exportDocument(options);
      setIsExportOpen(false);
      setExportNotice({
        tone: 'success',
        text: options.mode === 'protected' ? 'Protected PDF exported.' : 'PDF exported.',
      });
    } catch (error) {
      setExportNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'The PDF could not be exported.',
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }

  const visibleAnnotations = showAllAnnotations
    ? activeDocument.annotations.slice().reverse()
    : activeDocument.annotations.slice().reverse().slice(0, 8);

  return (
    <>
      <main className="page-shell" style={{ width: 'min(1540px, calc(100vw - 18px))' }}>
        <section
          className="panel"
          style={{
            padding: '18px',
            display: 'grid',
            gap: '16px',
          }}
        >
          <header className="viewer-header">
            <div className="viewer-header-start">
              <Link className="ghost-button viewer-back-btn" to="/open" aria-label="Back to documents">
                <ChevronLeft size={15} />
                <span>Documents</span>
              </Link>
              <div>
                <p className="section-title" style={{ marginBottom: '4px' }}>Active document</p>
                <strong>{activeDocument.name}</strong>
              </div>
            </div>

            <div className="viewer-toolbar">
              {TOOLBAR.map((tool) => (
                <button
                  key={tool.id}
                  className={`tool-button viewer-tool-btn ${activeDocument.selectedTool === tool.id ? 'is-active' : ''}`}
                  onClick={() => setTool(tool.id)}
                  type="button"
                  aria-pressed={activeDocument.selectedTool === tool.id}
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="tool-label">{tool.label}</span>
                </button>
              ))}
            </div>

            <div className="viewer-header-end">
              {exportNotice ? (
                <span className={`viewer-notice ${exportNotice.tone === 'error' ? 'is-error' : ''}`}>
                  {exportNotice.text}
                </span>
              ) : null}

              <form className="viewer-page-jump" onSubmit={handlePageInputSubmit} aria-label="Go to page">
                <input
                  className="viewer-page-input"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  placeholder={`${activeDocument.currentPage}`}
                  aria-label="Page number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <span className="viewer-page-sep">/ {activeDocument.pageCount || '…'}</span>
              </form>

              <div className="viewer-zoom-row">
                <button
                  className="ghost-button viewer-icon-btn"
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setZoom(activeDocument.zoom - 0.1)}
                >
                  <ZoomOut size={15} />
                </button>
                <span className="viewer-zoom-value">{(activeDocument.zoom * 100).toFixed(0)}%</span>
                <button
                  className="ghost-button viewer-icon-btn"
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setZoom(activeDocument.zoom + 0.1)}
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              <button
                className="ghost-button viewer-icon-btn"
                type="button"
                aria-label="Rotate 90°"
                title="Rotate"
                onClick={() => setRotation(((activeDocument.rotation + 90) % 360) as 0 | 90 | 180 | 270)}
              >
                <RotateCw size={15} />
              </button>

              <button
                className="pill-button viewer-export-btn"
                type="button"
                onClick={() => setIsExportOpen(true)}
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </header>

          <div className="viewer-body">
            {/* Left sidebar */}
            <aside className="viewer-left-aside">
              <section className="viewer-panel-section">
                <p className="section-title">Session</p>
                <div className="stack" style={{ marginTop: '10px' }}>
                  <div className="status-pill">
                    <span>{isBusy ? 'Working…' : 'Local session'}</span>
                    <span className="mono">
                      {activeDocument.currentPage}/{activeDocument.pageCount || '…'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    Rotation {activeDocument.rotation}°
                  </div>
                  {activeDocument.protectionStatus.kind === 'encrypted' ? (
                    <div className="helper-copy">Password-protected source PDF</div>
                  ) : null}
                </div>
              </section>

              <section className="viewer-panel-section viewer-thumbnails-section">
                <p className="section-title" style={{ padding: '4px 4px 10px' }}>Thumbnails</p>
                <div className="stack">
                  {pdfDocument
                    ? Array.from({ length: activeDocument.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                        <PageThumbnail
                          key={pageNumber}
                          pdfDocument={pdfDocument}
                          pageNumber={pageNumber}
                          isActive={activeDocument.currentPage === pageNumber}
                          onClick={() => jumpToPage(pageNumber)}
                        />
                      ))
                    : null}
                </div>
              </section>
            </aside>

            {/* Main PDF canvas */}
            <section className="viewer-canvas-section">
              {pdfDocument ? (
                Array.from({ length: activeDocument.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <div
                    key={pageNumber}
                    ref={(node) => {
                      if (node) {
                        pageRefs.current.set(pageNumber, node);
                      } else {
                        pageRefs.current.delete(pageNumber);
                      }
                    }}
                    data-page-number={pageNumber}
                  >
                    <PdfPageView
                      pdfDocument={pdfDocument}
                      pageNumber={pageNumber}
                      zoom={activeDocument.zoom}
                      rotation={activeDocument.rotation}
                      tool={activeDocument.selectedTool}
                      selectedSignature={selectedSignature}
                      selectedAnnotationId={activeDocument.selectedAnnotationId}
                      annotations={activeDocument.annotations.filter((annotation) => annotation.pageIndex === pageNumber - 1)}
                      onCommitAnnotation={upsertAnnotation}
                      onSelectAnnotation={selectAnnotation}
                    />
                  </div>
                ))
              ) : (
                <div className="status-pill">Loading PDF engine…</div>
              )}
            </section>

            {/* Right sidebar with tabs */}
            <aside className="viewer-right-aside">
              <div className="tab-bar">
                {RIGHT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab-button ${rightTab === tab.id ? 'is-active' : ''}`}
                    type="button"
                    aria-pressed={rightTab === tab.id}
                    onClick={() => setRightTab(tab.id)}
                    title={tab.label}
                  >
                    {tab.icon}
                    <span className="tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>

              {rightTab === 'search' && (
                <section className="viewer-panel-section">
                  <p className="section-title">Search</p>
                  <div className="stack" style={{ marginTop: '10px' }}>
                    <input
                      className="field-input"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search document text"
                    />
                    <div className="stack" style={{ maxHeight: '360px', overflow: 'auto' }}>
                      {searchResults.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                          {query ? 'No text matches found.' : 'Text search results appear here.'}
                        </p>
                      ) : (
                        searchResults.map((result) => (
                          <button
                            key={`${result.pageNumber}-${result.snippet}`}
                            className="ghost-button"
                            type="button"
                            style={{ textAlign: 'left', borderRadius: '16px' }}
                            onClick={() => jumpToPage(result.pageNumber)}
                          >
                            <strong>Page {result.pageNumber}</strong>
                            <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                              {result.matchCount} match{result.matchCount === 1 ? '' : 'es'} • {result.snippet}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </section>
              )}

              {rightTab === 'forms' && (
                <section className="viewer-panel-section">
                  <p className="section-title">Forms</p>
                  <div className="stack" style={{ marginTop: '10px' }}>
                    {activeDocument.formSchema.length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        No supported AcroForm fields were detected in this file.
                      </p>
                    ) : (
                      activeDocument.formSchema.map((field) => (
                        <label key={field.name}>
                          <span className="field-label">
                            {field.name} <span style={{ color: 'var(--text-muted)' }}>({field.kind})</span>
                          </span>
                          {renderFormInput(field, activeDocument.formValues[field.name] ?? field.value, (value) =>
                            setFormValue(field.name, value),
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </section>
              )}

              {rightTab === 'signatures' && (
                <div className="stack">
                  <SignatureComposer
                    isActive={activeDocument.selectedTool === 'signature'}
                    onCreate={async (signature) => {
                      await addSignatureAsset(signature);
                      setSelectedSignature(signature.id);
                      setTool('signature');
                    }}
                  />

                  <section className="viewer-panel-section">
                    <div className="viewer-section-header">
                      <p className="section-title">Saved signatures</p>
                      <label className="ghost-button viewer-upload-btn">
                        <ImagePlus size={13} />
                        <span>Upload</span>
                        <input hidden accept="image/*" type="file" onChange={(event) => void handleImageUpload(event)} />
                      </label>
                    </div>
                    <div className="stack" style={{ marginTop: '10px' }}>
                      {signatures.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>No signatures saved yet.</p>
                      ) : (
                        signatures.map((signature) => (
                          <div key={signature.id} className="signature-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <strong>{signature.label}</strong>
                              <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                {signature.kind}
                              </span>
                            </div>
                            <div className="signature-preview">
                              {signature.kind === 'typed' ? (
                                <span style={{ fontSize: '1.35rem' }}>{signature.text}</span>
                              ) : (
                                <img alt={signature.label} src={signature.dataUrl} style={{ maxHeight: '42px' }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                className={`chip-button ${
                                  activeDocument.selectedSignatureAssetId === signature.id ? 'is-active' : ''
                                }`}
                                type="button"
                                onClick={() => {
                                  setSelectedSignature(signature.id);
                                  setTool('signature');
                                }}
                              >
                                Use
                              </button>
                              <button
                                className="chip-button"
                                type="button"
                                onClick={() => void deleteSignatureAsset(signature.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}

              {rightTab === 'annotations' && (
                <section className="viewer-panel-section">
                  <p className="section-title">Annotations</p>
                  <div className="stack" style={{ marginTop: '10px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                      {activeDocument.annotations.length} annotation
                      {activeDocument.annotations.length === 1 ? '' : 's'} placed
                    </div>

                    {selectedAnnotation ? (
                      <div className="annotation-detail-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <strong>{selectedAnnotation.kind}</strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                            Page {selectedAnnotation.pageIndex + 1}
                          </span>
                        </div>
                        {selectedAnnotation.kind === 'note' ? (
                          <label>
                            <span className="field-label">Comment</span>
                            <textarea
                              className="field-textarea"
                              value={(selectedAnnotation.payload as NotePayload).comment}
                              onChange={handleNoteCommentChange}
                              placeholder="Add note text"
                            />
                          </label>
                        ) : null}
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => removeAnnotation(selectedAnnotation.id)}
                        >
                          Delete annotation
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        Select a placed annotation to inspect or edit it.
                      </p>
                    )}

                    <div className="stack">
                      {visibleAnnotations.map((annotation) => (
                        <button
                          key={annotation.id}
                          className={`ghost-button ${
                            activeDocument.selectedAnnotationId === annotation.id ? 'is-active' : ''
                          }`}
                          style={{ textAlign: 'left', borderRadius: '16px' }}
                          type="button"
                          onClick={() => {
                            selectAnnotation(annotation.id);
                            jumpToPage(annotation.pageIndex + 1);
                          }}
                        >
                          <strong>{annotation.kind}</strong>
                          <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
                            Page {annotation.pageIndex + 1} • {new Date(annotation.updatedAt).toLocaleTimeString()}
                          </div>
                        </button>
                      ))}
                    </div>

                    {activeDocument.annotations.length > 8 && !showAllAnnotations && (
                      <button
                        className="ghost-button"
                        type="button"
                        style={{ borderRadius: '16px', fontSize: '0.9rem' }}
                        onClick={() => setShowAllAnnotations(true)}
                      >
                        Show all {activeDocument.annotations.length} annotations
                      </button>
                    )}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </section>
      </main>

      {isExportOpen ? (
        <ExportModal
          key="export-modal"
          isOpen
          isSubmitting={isExporting}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
        />
      ) : null}
    </>
  );
}
