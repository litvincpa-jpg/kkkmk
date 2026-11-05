import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function SiteDialog({ title, onClose, children, wide = false }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={`pk-dialog${wide ? ' pk-dialog--wide' : ''}`}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="pk-dialog-inner">
        <button className="pk-dialog-close" type="button" onClick={onClose} aria-label="Закрыть окно"><X size={23} /></button>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </dialog>
  );
}