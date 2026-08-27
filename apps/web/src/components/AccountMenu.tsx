import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AUTHENTICATION_ENABLED, getAuthSession, signOut } from '../modules/auth/auth';
import './account-menu.css';

export type AccountMenuSurface = 'crm' | 'workspace' | 'cms';

function basePath() {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

function href(path: string) {
  return `${basePath()}${path}` || path;
}

function go(path: string) {
  window.location.href = href(path);
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8 10 4 4 4-4" /></svg>;
}

function ProfileIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.7 3.1-5.5 7-5.5s6.2 1.8 7 5.5" /></svg>;
}

function SettingsIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .64 1.7 1.7 0 0 0-.36 1.06V21h-4v-.08A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.24 15a1.7 1.7 0 0 0-.64-1 1.7 1.7 0 0 0-1.06-.36H2.5v-4h.08A1.7 1.7 0 0 0 4.1 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 4.24a1.7 1.7 0 0 0 1-.64 1.7 1.7 0 0 0 .36-1.06V2.5h4v.08A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.36 8.5a1.7 1.7 0 0 0 .64 1 1.7 1.7 0 0 0 1.06.36h.04v4h-.08A1.7 1.7 0 0 0 19.4 15Z" /></svg>;
}

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5H5v14h5" /><path d="M13 8l4 4-4 4M17 12H9" /></svg>;
}

export function AccountMenu({ surface }: { surface: AccountMenuSurface }) {
  const [open, setOpen] = useState(false);
  const [crmHost, setCrmHost] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const session = AUTHENTICATION_ENABLED ? getAuthSession() : null;
  const name = session?.name || 'Administrador';
  const detail = AUTHENTICATION_ENABLED ? (session?.email || 'Conta interna') : 'Autenticação desativada';

  useEffect(() => {
    if (surface !== 'crm') {
      setCrmHost(null);
      return;
    }

    const findHost = () => document.querySelector<HTMLElement>('.crm-global-page .crm-topbar .crm-topbar-actions');
    const syncHost = () => {
      const host = findHost();
      setCrmHost((current) => current === host ? current : host);
    };

    syncHost();
    const root = document.getElementById('root') ?? document.body;
    const observer = new MutationObserver(syncHost);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [surface]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
  }, [open]);

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Home') items[0].focus();
    else if (event.key === 'End') items[items.length - 1].focus();
    else if (event.key === 'ArrowDown') items[(currentIndex + 1 + items.length) % items.length].focus();
    else items[(currentIndex - 1 + items.length) % items.length].focus();
  };

  const logout = () => {
    signOut();
    setOpen(false);
    go(AUTHENTICATION_ENABLED ? '/login' : '/workspaces');
  };

  const menu = <div className={`account-menu account-menu--${surface}`} ref={rootRef}>
    <button
      ref={triggerRef}
      className="account-menu__trigger"
      type="button"
      aria-label="Abrir menu da conta"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls="global-account-menu"
      onClick={() => setOpen((current) => !current)}
    >
      <span className="account-menu__avatar" aria-hidden="true">VF</span>
      <span className="account-menu__identity"><strong>{name}</strong><small>{detail}</small></span>
      <span className="account-menu__caret" aria-hidden="true"><ChevronIcon /></span>
    </button>
    {open && <div className="account-menu__panel" id="global-account-menu" role="menu" aria-label="Menu da conta" onKeyDown={handleMenuKeyDown}>
      <a role="menuitem" href={href('/crm/perfil')} onClick={() => setOpen(false)}><ProfileIcon /><span>Perfil</span></a>
      <a role="menuitem" href={href('/crm/configuracoes')} onClick={() => setOpen(false)}><SettingsIcon /><span>Configurações</span></a>
      <div className="account-menu__separator" />
      <button role="menuitem" type="button" onClick={logout}><LogoutIcon /><span>Logout</span></button>
    </div>}
  </div>;

  if (surface === 'crm') return crmHost ? createPortal(menu, crmHost) : null;
  return menu;
}

export default AccountMenu;
