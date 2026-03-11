import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentPasswordDialog } from '../features/viewer/DocumentPasswordDialog';
import { useDocument } from '../app/useDocument';
import type { OpenDocumentResult } from '../lib/pdf/types';

function formatLastOpened(value: string) {
  const date = new Date(value);
  const elapsedMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (elapsedMinutes < 1) {
    return 'Just now';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  return date.toLocaleDateString();
}

type PendingProtectedDocument =
  | { kind: 'file'; file: File; name: string }
  | { kind: 'draft'; documentId: string; name: string };

export function HomeRoute() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingProtectedDocument, setPendingProtectedDocument] = useState<PendingProtectedDocument | null>(null);
  const [passwordError, setPasswordError] = useState('');
  const [openError, setOpenError] = useState('');
  const [isPromptSubmitting, setIsPromptSubmitting] = useState(false);
  const { activeDocument, hydrated, isBusy, openFile, recentDocuments, resumeDocument } = useDocument();

  const recentList = useMemo(() => recentDocuments.slice(0, 6), [recentDocuments]);

  async function handleOpenResult(result: OpenDocumentResult, pending: PendingProtectedDocument | null) {
    if (result.kind === 'password-required') {
      setPendingProtectedDocument(pending);
      setPasswordError('');
      setOpenError('');
      return;
    }

    if (result.kind === 'invalid-password') {
      setPendingProtectedDocument(pending);
      setPasswordError('Wrong password. Try again.');
      setOpenError('');
      return;
    }

    if (result.kind === 'error') {
      setPendingProtectedDocument(null);
      setPasswordError('');
      setOpenError(result.message);
      return;
    }

    setPendingProtectedDocument(null);
    setPasswordError('');
    setOpenError('');
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      return;
    }

    const pending = { kind: 'file', file, name: file.name } satisfies PendingProtectedDocument;
    const result = await openFile(file);
    await handleOpenResult(result, pending);
  }

  async function handleProtectedOpen(password: string) {
    if (!pendingProtectedDocument) {
      return;
    }

    setIsPromptSubmitting(true);
    try {
      if (pendingProtectedDocument.kind === 'file') {
        const result = await openFile(pendingProtectedDocument.file, { password });
        await handleOpenResult(result, pendingProtectedDocument);
        return;
      }

      const result = await resumeDocument(pendingProtectedDocument.documentId, { password });
      await handleOpenResult(result, pendingProtectedDocument);
    } finally {
      setIsPromptSubmitting(false);
    }
  }

  return (
    <>
      <main className="page-shell">
        <section
          className="panel"
          style={{
            padding: '20px',
            display: 'grid',
            gap: '20px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 420px)',
              gap: '20px',
            }}
          >
            <section>
              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  void handleFiles(event.dataTransfer.files);
                }}
                role="presentation"
                style={{
                  borderRadius: '28px',
                  border: `1px solid ${dragActive ? 'rgba(245, 171, 53, 0.42)' : 'var(--border)'}`,
                  background: dragActive
                    ? 'linear-gradient(180deg, rgba(245, 171, 53, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)'
                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  padding: '34px',
                  minHeight: '620px',
                  display: 'grid',
                  alignContent: 'center',
                  justifyItems: 'center',
                  textAlign: 'center',
                  gap: '18px',
                  transition: 'all 180ms ease',
                }}
              >
                <div
                  style={{
                    width: '92px',
                    height: '92px',
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: '28px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '52px',
                      borderRadius: '12px',
                      background: 'linear-gradient(180deg, #f3f4f6 0%, #d4dae3 100%)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: '10px 8px auto',
                        height: '4px',
                        borderRadius: '999px',
                        background: 'rgba(16, 22, 31, 0.45)',
                        boxShadow: '0 10px 0 rgba(16, 22, 31, 0.45), 0 20px 0 rgba(16, 22, 31, 0.45)',
                      }}
                    />
                  </div>
                </div>
                <div className="stack" style={{ gap: '8px', justifyItems: 'center' }}>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: 'clamp(2.5rem, 4vw, 4rem)',
                      lineHeight: 0.98,
                      letterSpacing: '-0.05em',
                      maxWidth: '10ch',
                    }}
                  >
                    Open a PDF.
                  </h1>
                  <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '44ch', fontSize: '1rem' }}>
                    Drag a file here or choose one from your device to enter the workspace.
                  </p>
                  <p className="helper-copy" style={{ margin: 0 }}>
                    Files are processed locally in your browser.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button className="pill-button" type="button" onClick={() => inputRef.current?.click()}>
                    Choose PDF
                  </button>
                  {activeDocument ? (
                    <Link className="ghost-button" to="/viewer">
                      Resume draft
                    </Link>
                  ) : null}
                </div>
                {openError ? (
                  <p className="field-error" role="alert">
                    {openError}
                  </p>
                ) : null}
                {isBusy ? <span className="status-pill">Opening document...</span> : null}
                <input
                  ref={inputRef}
                  hidden
                  accept="application/pdf,.pdf"
                  type="file"
                  onChange={(event) => {
                    void handleFiles(event.target.files);
                    event.currentTarget.value = '';
                  }}
                />
              </div>
            </section>

            <aside className="stack">
              <section
                style={{
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  display: 'grid',
                  gap: '12px',
                }}
              >
                <p className="section-title">Current session</p>
                {activeDocument ? (
                  <Link
                    to="/viewer"
                    className="ghost-button"
                    style={{
                      display: 'grid',
                      gap: '6px',
                      borderRadius: '20px',
                      textAlign: 'left',
                      padding: '16px',
                    }}
                  >
                    <strong>{activeDocument.name}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                      Page {activeDocument.currentPage}
                      {activeDocument.pageCount ? ` of ${activeDocument.pageCount}` : ''} •{' '}
                      {(activeDocument.zoom * 100).toFixed(0)}% zoom
                    </span>
                    {activeDocument.protectionStatus.kind === 'encrypted' ? (
                      <span className="helper-copy">Password-protected source PDF</span>
                    ) : null}
                    <span style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 600 }}>
                      Continue editing
                    </span>
                  </Link>
                ) : (
                  <div
                    style={{
                      borderRadius: '20px',
                      padding: '16px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.02)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    No active document
                  </div>
                )}
              </section>

              <section
                style={{
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  minHeight: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <p className="section-title">Recent drafts</p>
                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {hydrated ? `${recentList.length} cached` : 'loading'}
                  </span>
                </div>
                <div className="stack" style={{ marginTop: '12px' }}>
                  {recentList.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                      Open a PDF once and it will appear here for quick reopening.
                    </p>
                  ) : (
                    recentList.map((record) => (
                      <button
                        key={record.id}
                        className="ghost-button"
                        type="button"
                        style={{
                          textAlign: 'left',
                          display: 'grid',
                          gap: '6px',
                          borderRadius: '18px',
                          padding: '14px',
                        }}
                        onClick={async () => {
                          const pending = {
                            kind: 'draft',
                            documentId: record.id,
                            name: record.name,
                          } satisfies PendingProtectedDocument;
                          const result = await resumeDocument(record.id);
                          await handleOpenResult(result, pending);
                        }}
                      >
                        <strong>{record.name}</strong>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>{record.pageCount ? `${record.pageCount} pages` : 'Page count pending'}</span>
                          <span>{formatLastOpened(record.lastOpenedAt)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>

      {pendingProtectedDocument ? (
        <DocumentPasswordDialog
          key={`${pendingProtectedDocument.kind}-${pendingProtectedDocument.name}`}
          documentName={pendingProtectedDocument.name}
          errorMessage={passwordError}
          isOpen
          isSubmitting={isPromptSubmitting}
          onClose={() => {
            setPendingProtectedDocument(null);
            setPasswordError('');
          }}
          onSubmit={handleProtectedOpen}
        />
      ) : null}
    </>
  );
}
