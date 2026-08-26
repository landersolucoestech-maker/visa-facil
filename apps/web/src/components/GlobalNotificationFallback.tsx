import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './global-notification-fallback.css';

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
}

function isNotificationButton(button: HTMLButtonElement) {
  const label = `${button.getAttribute('aria-label') ?? ''} ${button.title ?? ''}`.toLocaleLowerCase('pt-BR');
  return label.includes('notifica') || label.includes('alerta');
}

export function GlobalNotificationFallback() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [fallbackRequired, setFallbackRequired] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let createdHost: HTMLElement | null = null;
    const resolveHost = () => {
      const page = document.querySelector<HTMLElement>('.crm-global-page');
      if (!page) return null;
      const existing = page.querySelector<HTMLElement>('.crm-topbar .crm-topbar-actions');
      if (existing) return existing;
      const topbar = page.querySelector<HTMLElement>('.crm-topbar');
      if (!topbar) return null;
      const actions = document.createElement('div');
      actions.className = 'crm-topbar-actions global-notification-host';
      topbar.append(actions);
      createdHost = actions;
      return actions;
    };

    const existingHost = resolveHost();
    if (existingHost) {
      setHost(existingHost);
      return () => createdHost?.remove();
    }

    const root = document.getElementById('root') ?? document.body;
    const observer = new MutationObserver(() => {
      const nextHost = resolveHost();
      if (!nextHost) return;
      setHost(nextHost);
      observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      createdHost?.remove();
    };
  }, []);

  useEffect(() => {
    if (!host) return;
    const existingButtons = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).filter(isNotificationButton);
    const functionalButton = existingButtons.find((button) => !button.disabled && !button.hidden);
    const disabledButtons = existingButtons.filter((button) => button.disabled);
    disabledButtons.forEach((button) => { button.hidden = true; });
    setFallbackRequired(!functionalButton);
    return () => disabledButtons.forEach((button) => { button.hidden = false; });
  }, [host]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  if (!host || !fallbackRequired) return null;

  return createPortal(<div className="global-notification-menu" ref={rootRef}>
    <button
      className="crm-notification-button global-notification-menu__trigger"
      type="button"
      aria-label="Notificações"
      aria-haspopup="true"
      aria-expanded={open}
      aria-controls="global-notification-panel"
      onClick={() => setOpen((current) => !current)}
    >
      <BellIcon />
    </button>
    {open && <div className="global-notification-menu__panel" id="global-notification-panel" role="region" aria-label="Notificações">
      <strong>Notificações</strong>
      <p>Nenhuma notificação no momento.</p>
    </div>}
  </div>, host);
}

export default GlobalNotificationFallback;
