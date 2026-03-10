import { useEffect, useId, useRef, type PropsWithChildren, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

function getTabbableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

type DialogProps = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  description?: string;
  actions?: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}>;

export function Dialog({
  actions,
  children,
  description,
  initialFocusRef,
  isOpen,
  onClose,
  title,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;

    const focusTarget =
      initialFocusRef?.current ??
      (panel ? getTabbableElements(panel)[0] : null) ??
      panel;

    window.setTimeout(() => {
      focusTarget?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panel) {
        return;
      }

      const tabbable = getTabbableElements(panel);
      if (tabbable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [initialFocusRef, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="dialog-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="dialog-panel"
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="dialog-header">
          <div className="stack" style={{ gap: '0.35rem' }}>
            <h2 className="dialog-title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="dialog-copy" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button aria-label="Close dialog" className="dialog-close" onClick={onClose} type="button">
            Close
          </button>
        </header>

        <div className="dialog-body">{children}</div>

        {actions ? <footer className="dialog-actions">{actions}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
