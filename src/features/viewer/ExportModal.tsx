import { useRef, useState } from 'react';
import { Dialog } from '../../app/Dialog';
import type { ExportOptions } from '../../lib/pdf/types';

type ExportModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
};

export function ExportModal({ isOpen, isSubmitting, onClose, onExport }: ExportModalProps) {
  const protectedModeRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<ExportOptions['mode']>('standard');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleExport() {
    if (mode === 'protected') {
      if (password.trim().length === 0) {
        setErrorMessage('Enter a password to protect this PDF.');
        return;
      }

      if (password !== confirmation) {
        setErrorMessage('Enter the same password again.');
        return;
      }
    }

    setErrorMessage('');
    try {
      await onExport(mode === 'protected' ? { mode, password } : { mode });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The PDF could not be exported.');
    }
  }

  return (
    <Dialog
      description="Choose a standard export or add a password required to open the saved PDF."
      initialFocusRef={protectedModeRef}
      isOpen={isOpen}
      onClose={onClose}
      title="Export PDF"
      actions={
        <>
          <button className="ghost-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="pill-button" disabled={isSubmitting} onClick={() => void handleExport()} type="button">
            {isSubmitting ? 'Exporting...' : mode === 'protected' ? 'Export protected PDF' : 'Export PDF'}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="dialog-option-grid" role="radiogroup" aria-label="Export mode">
          <label className={`dialog-option-card ${mode === 'standard' ? 'is-selected' : ''}`}>
            <input
              checked={mode === 'standard'}
              name="export-mode"
              onChange={() => setMode('standard')}
              type="radio"
            />
            <span className="dialog-option-title">Standard export</span>
            <span className="dialog-option-copy">Save the edited PDF without adding document protection.</span>
          </label>

          <label className={`dialog-option-card ${mode === 'protected' ? 'is-selected' : ''}`}>
            <input
              ref={protectedModeRef}
              checked={mode === 'protected'}
              name="export-mode"
              onChange={() => setMode('protected')}
              type="radio"
            />
            <span className="dialog-option-title">Protected export</span>
            <span className="dialog-option-copy">Add a password required to open the exported PDF.</span>
          </label>
        </div>

        <div className="dialog-support">
          <strong>Processing happens on this device.</strong>
          <span>Protected export adds a password required to open the file.</span>
        </div>

        {mode === 'protected' ? (
          <div className="stack">
            <label>
              <span className="field-label">Document password</span>
              <input
                autoComplete="new-password"
                className="field-input"
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
            </label>
            <label>
              <span className="field-label">Confirm password</span>
              <input
                autoComplete="new-password"
                className="field-input"
                onChange={(event) => setConfirmation(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
              />
            </label>
            <label className="toggle-row">
              <input checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" />
              <span>Show password</span>
            </label>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="field-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
