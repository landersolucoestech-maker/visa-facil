import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './global-notification-fallback.css';

function isNotificationButton(button: HTMLButtonElement) {
  const label = `${button.getAttribute('aria-label') ?? ''} ${button.title ?? ''}`.toLocaleLowerCase('pt-BR');
  return label.includes('notifica') || label.includes('alerta');
}

export function GlobalNotificationFallback() {
  const [target, setTarget] = useState<HTMLButtonElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resolveTarget = () => {
      const page = document.querySelector<HTMLElement>('.crm-global-page');
      if (!page) return false;
      const buttons = Array.from(page.querySelectorAll<HTMLButtonElement>('button')).filter(isNotificationButton);
      const functionalButton = buttons.find((button) => !button.disabled && !button.hidden);
      const disabledButton = buttons.find((button) => button.disabled && !button.hidden);

      if (functionalButton || !disabledButton) {
        setTarget(null);
        setHost(null);
        return Boolean(functionalButton);
      }

      setTarget(disabledButton);
      setHost(disabledButton.parentElement);
      return true;
    };

    if (resolveTarget()) return;

    const root = document.getElementById('root') ?? document.body;
    const observer = new MutationObserver(() => {
      if (resolveTarget()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!target || !host) return;

    const original = {
      disabled: target.disabled,
      title: target.getAttribute('title'),
      ariaLabel: target.getAttribute('aria-label'),
      ariaHaspopup: target.getAttribute('aria-haspopup'),
      ariaExpanded: target.getAttribute('aria-expanded'),
      ariaControls: target.getAttribute('aria-controls'),
    };

    target.disabled = false;
    target.setAttribute('aria-label', 'Notificações');
    target.setAttribute('aria-haspopup', 'true');
    target.setAttribute('aria-controls', 'global-notification-panel');
    target.removeAttribute('title');
    host.classList.add('global-notification-panel-host');

    const toggle = (event: MouseEvent) => {
      event.stopPropagation();
      setOpen((current) => !current);
    };
    target.addEventListener('click', toggle);

    return () => {
      target.removeEventListener('click', toggle);
      target.disabled = original.disabled;
      if (original.title === null) target.removeAttribute('title'); else target.setAttribute('title', original.title);
      if (original.ariaLabel === null) target.removeAttribute('aria-label'); else target.setAttribute('aria-label', original.ariaLabel);
      if (original.ariaHaspopup === null) target.removeAttribute('aria-haspopup'); else target.setAttribute('aria-haspopup', original.ariaHaspopup);
      if (original.ariaExpanded === null) target.removeAttribute('aria-expanded'); else target.setAttribute('aria-expanded', original.ariaExpanded);
      if (original.ariaControls === null) target.removeAttribute('aria-controls'); else target.setAttribute('aria-controls', original.ariaControls);
      host.classList.remove('global-notification-panel-host');
    };
  }, [target, host]);

  useEffect(() => {
    if (target) target.setAttribute('aria-expanded', String(open));
  }, [target, open]);

  useEffect(() => {
    if (!open || !target) return;
    const closeOutside = (event: PointerEvent) => {
      const node = event.target;
      if (!(node instanceof Node)) return;
      if (!target.contains(node) && panelRef.current && !panelRef.current.contains(node)) setOpen(false);
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
  }, [open, target]);

  if (!host || !target || !open) return null;

  return createPortal(<div className="global-notification-menu__panel" id="global-notification-panel" ref={panelRef} role="region" aria-label="Notificações">
    <strong>Notificações</strong>
    <p>Nenhuma notificação no momento.</p>
  </div>, host);
}

export default GlobalNotificationFallback;
