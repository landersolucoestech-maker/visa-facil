import type { MouseEvent, ReactNode } from 'react';

const navItems = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/clientes', label: 'Clientes' },
  { href: '/app/processos', label: 'Processos' },
  { href: '/app/documentos', label: 'Documentos' },
  { href: '/app/atendimentos', label: 'Atendimentos' },
  { href: '/app/tarefas', label: 'Tarefas' },
  { href: '/app/financeiro', label: 'Financeiro' },
  { href: '/app/relatorios', label: 'Relatórios' },
  { href: '/app/configuracoes', label: 'Configurações' },
];

type ManagementShellProps = {
  children: ReactNode;
  path: string;
  onNavigate: (path: string) => void;
};

function VisaFacilLogo() {
  return (
    <svg className="management-brand__logo" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M7 8h17l8 39L20 56 7 8Z" fill="#FFFFFF" />
      <path d="M29 19c7-6 15-9 26-10-1 6-4 11-9 15-6 4-11 6-17 8v-13Z" fill="#B22234" />
      <path d="M31 31c7-5 14-7 24-8-2 6-5 10-10 13-5 3-10 5-14 7V31Z" fill="#E31B23" />
      <path d="M32 43c6-4 13-6 21-7-2 6-6 10-10 13-4 3-8 5-11 6V43Z" fill="#B22234" />
      <path d="m18 19 1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L18 19Z" fill="#FFFFFF" />
    </svg>
  );
}

export function ManagementShell({ children, path, onNavigate }: ManagementShellProps) {
  function handleInternalNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(href);
  }

  return (
    <div className="management-shell">
      <aside className="management-sidebar" aria-label="Navegação do sistema">
        <a className="management-brand" href="/app" aria-label="Visa Fácil Gestão" onClick={(event) => handleInternalNavigation(event, '/app')}>
          <span className="management-brand__mark"><VisaFacilLogo /></span>
          <span><strong>VISA FÁCIL</strong><small>seu visto, sem complicação</small></span>
        </a>
        <div className="management-brand-stripes" aria-hidden="true"><i /><i /><i /></div>
        <nav className="management-nav">
          <span className="management-nav__label">Operação</span>
          {navItems.map((item) => {
            const active = item.href === '/app' ? path === '/app' : path.startsWith(item.href);
            return <a key={item.href} className={active ? 'is-active' : ''} href={item.href} onClick={(event) => handleInternalNavigation(event, item.href)}>{item.label}</a>;
          })}
        </nav>
        <div className="management-sidebar__footer"><a href="/">← Voltar ao site</a><span>Ambiente interno · dev</span></div>
      </aside>
      <div className="management-workspace">
        <header className="management-topbar">
          <div><span className="management-topbar__label">VISA FÁCIL · ASSESSORIA INTERNACIONAL</span><strong>Central de Operações</strong></div>
          <div className="management-user" aria-label="Usuário do sistema"><span>VF</span><div><strong>Administrador</strong><small>Autenticação pendente</small></div></div>
        </header>
        <main className="management-content">{children}</main>
      </div>
    </div>
  );
}
