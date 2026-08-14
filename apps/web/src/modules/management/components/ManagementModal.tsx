import { useEffect, type ReactNode } from 'react';

type ManagementModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose: () => void;
  children: ReactNode;
};

export function ManagementModal({ open, title, subtitle, eyebrow, size = 'lg', onClose, children }: ManagementModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return <div className="management-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`management-modal management-modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="management-modal-title">
      <header className="management-modal__header">
        <div>{eyebrow && <span className="management-eyebrow">{eyebrow}</span>}<h2 id="management-modal-title">{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        <button className="management-modal__close" type="button" aria-label="Fechar modal" onClick={onClose}>×</button>
      </header>
      <div className="management-modal__body">{children}</div>
    </section>
  </div>;
}
