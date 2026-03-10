import { useRef, useState } from 'react';
import { Dialog } from '../../app/Dialog';

type DocumentPasswordDialogProps = {
  documentName: string;
  errorMessage?: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
};

export function DocumentPasswordDialog({
  documentName,
  errorMessage,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: DocumentPasswordDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Dialog
      description={`Enter the password to open ${documentName}.`}
      initialFocusRef={inputRef}
      isOpen={isOpen}
      onClose={onClose}
      title="This PDF is password protected."
      actions={
        <>
          <button className="ghost-button" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="pill-button"
            disabled={isSubmitting || password.trim().length === 0}
            onClick={() => void onSubmit(password)}
            type="button"
          >
            {isSubmitting ? 'Opening...' : 'Open document'}
          </button>
        </>
      }
    >
      <div className="stack">
        <label>
          <span className="field-label">Password required to open this PDF</span>
          <input
            ref={inputRef}
            autoComplete="current-password"
            className="field-input"
            onChange={(event) => setPassword(event.target.value)}
            type={showPassword ? 'text' : 'password'}
            value={password}
          />
        </label>
        <label className="toggle-row">
          <input checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" />
          <span>Show password</span>
        </label>
        {errorMessage ? (
          <p className="field-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
