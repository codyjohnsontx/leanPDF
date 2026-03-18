import { useRef, useState } from 'react';
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>This PDF is password protected.</DialogTitle>
          <DialogDescription>Enter the password to open {documentName}.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="stack">
            <div>
              <Label htmlFor="doc-password">Password required to open this PDF</Label>
              <Input
                id="doc-password"
                ref={inputRef}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                value={password}
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
          <Button
            disabled={isSubmitting || password.trim().length === 0}
            onClick={() => void onSubmit(password)}
            type="button"
          >
            {isSubmitting ? 'Opening...' : 'Open document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
