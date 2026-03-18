import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { ExportOptions } from '../../lib/pdf/types';

type ExportModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
};

export function ExportModal({ isOpen, isSubmitting, onClose, onExport }: ExportModalProps) {
  const protectedItemRef = useRef<HTMLButtonElement | null>(null);
  const [mode, setMode] = useState<ExportOptions['mode']>('standard');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setConfirmation('');
      setShowPassword(false);
      setErrorMessage('');
    }
  }, [isOpen]);

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          protectedItemRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>Export PDF</DialogTitle>
          <DialogDescription>
            Choose a standard export or add a password required to open the saved PDF.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="stack">
            <RadioGroup
              value={mode}
              onValueChange={(v) => { setMode(v as ExportOptions['mode']); setErrorMessage(''); }}
              aria-label="Export mode"
            >
              <label className={cn('dialog-option-card', mode === 'standard' && 'is-selected')}>
                <RadioGroupItem value="standard" id="export-standard" />
                <span className="dialog-option-title">Standard export</span>
                <span className="dialog-option-copy">
                  Save the edited PDF without adding document protection.
                </span>
              </label>

              <label className={cn('dialog-option-card', mode === 'protected' && 'is-selected')}>
                <RadioGroupItem
                  ref={protectedItemRef}
                  value="protected"
                  id="export-protected"
                />
                <span className="dialog-option-title">Protected export</span>
                <span className="dialog-option-copy">
                  Add a password required to open the exported PDF.
                </span>
              </label>
            </RadioGroup>

            <div className="dialog-support">
              <strong>Processing happens on this device.</strong>
              <span>Protected export adds a password required to open the file.</span>
            </div>

            {mode === 'protected' ? (
              <div className="stack">
                <div>
                  <Label htmlFor="export-password">Document password</Label>
                  <Input
                    id="export-password"
                    autoComplete="new-password"
                    onChange={(event) => { setPassword(event.target.value); setErrorMessage(''); }}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                </div>
                <div>
                  <Label htmlFor="export-confirm">Confirm password</Label>
                  <Input
                    id="export-confirm"
                    autoComplete="new-password"
                    onChange={(event) => { setConfirmation(event.target.value); setErrorMessage(''); }}
                    type={showPassword ? 'text' : 'password'}
                    value={confirmation}
                  />
                </div>
                <label className="toggle-row">
                  <input
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                    type="checkbox"
                  />
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
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={() => void handleExport()} type="button">
            {isSubmitting
              ? 'Exporting...'
              : mode === 'protected'
                ? 'Export protected PDF'
                : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
