import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './global-notification-fallback.css';

const PANEL_MAX_WIDTH = 280;
const PANEL_GUTTER = 12;
const PANEL_GAP = 8;

type PanelPosition = { top: number; left: number; width: number };

function isNotificationButton(button: HTMLButtonElement) {
  const label = `${button.getAttribute('aria-label') ?? ''} ${button.title ?? ''}`.toLocaleLowerCase('pt-BR');
  return label.includes('notifica') || label.includes('alerta');
}

export function GlobalNotificationFallback() {
  const [target, setTarget] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>();
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
        return Boolean(functionalButton);
      }

      setTarget(disabledButton);
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
    if (!target) return;

    const original = {
      disabled: target.disabled,
      title: target.getAttribute('title'),
      ariaLabel: target.getAttribute('aria-label'),
      ariaHaspopup: target.getAttribute('aria-haspopup'),
      ariaExpanded: target.getAttribute('aria-expanded'),
      ariaControls: target.getAttribute('aria-controls'),
    };

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const width = Math.min(PANEL_MAX_WIDTH, Math.max(0, window.innerWidth - PANEL_GUTTER * 2));
      const preferredLeft = rect.right - width;
      const maxLeft = Math.max(PANEL_GUTTER, window.innerWidth - width - PANEL_GUTTER);
      const left = Math.max(PANEL_GUTTER, Math.min(preferredLeft, maxLeft));
      setPanelPosition({ top: Math.round(rect.bottom + PANEL_GAP), left: Math.round(left), width: Math.round(width) });
    };

    target.disabled = false;
    target.setAttribute('aria-label', 'Notificações');
    target.setAttribute('aria-haspopup', 'true');
    target.setAttribute('aria-controls', 'global-notification-panel');
    target.removeAttribute('title');

    const toggle = (event: MouseEvent) => {
      event.stopPropagation();
      setOpen((current) => {
        const next = !current;
        if (next) updatePosition();
        return next;
      });
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
    };
  }, [target]);

  useEffect(() => {
    if (target) target.setAttribute('aria-expanded', String(open));
  }, [target, open]);

  useEffect(() => {
    if (!open || !target) return;

    const updatePosition = () => {
      const rect = target.getBoundingClientRect();
      const width = Math.min(PANEL_MAX_WIDTH, Math.max(0, window.innerWidth - PANEL_GUTTER * 2));
      const preferredLeft = rect.right - width;
      const maxLeft = Math.max(PANEL_GUTTER, window.innerWidth - width - PANEL_GUTTER);
      const left = Math.max(PANEL_GUTTER, Math.min(preferredLeft, maxLeft));
      setPanelPosition({ top: Math.round(rect.bottom + PANEL_GAP), left: Math.round(left), width: Math.round(width) });
    };

    const closeOutside = (event: PointerEvent) => {
      const node = event.target;
      if (!(node instanceof Node)) return;
      if (!target.contains(node) && panelRef.current && !panelRef.current.contains(node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, target]);

  if (!target || !open || !panelPosition) return null;

  return createPortal(<div
    className="global-notification-menu__panel"
    id="global-notification-panel"
    ref={panelRef}
    role="region"
    aria-label="Notificações"
    style={{ top: panelPosition.top, left: panelPosition.left, width: panelPosition.width }}
  >
    <strong>Notificações</strong>
    <p>Nenhuma notificação no momento.</p>
  </div>, document.body);
}

export default GlobalNotificationFallback;
