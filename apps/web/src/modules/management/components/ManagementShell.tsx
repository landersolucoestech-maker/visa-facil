import type { ReactNode } from 'react';

const navItems = [
  { href: '/app', label: 'Visão geral' },
  { href: '/app/clientes', label: 'Clientes' },
  { href: '/app/processos', label: 'Processos' },
  { href: '/app/documentos', label: 'Documentos' },
  { href: '/app/atendimentos', label: 'Atendimentos' },
];

export function ManagementShell({ children }: { children: ReactNode }) {
  const path = window.location.pathname.replace(/\/+$/, '') || '/app';

  return (
    <div className="management-shell">
      <aside className="management-sidebar" aria-label="Navegação do sistema">
        <a className="management-brand" href="/app" aria-label="Visa Fácil Gestão">
          <span className="management-brand__mark">VF</span>
          <span><strong>VISA FÁCIL</strong><small>Gestão</small></span>
        </a>

        <nav className="management-nav">
          <span className="management-nav__label">Operação</span>
          {navItems.map((item) => {
            const active = item.href === '/app' ? path === '/app' : path.startsWith(item.href);
            return <a key={item.href} className={active ? 'is-active' : ''} href={item.href}>{item.label}</a>;
          })}
        </nav>

        <div className="management-sidebar__footer">
          <a href="/">← Voltar ao site</a>
          <span>Ambiente interno · dev</span>
        </div>
      </aside>

      <div className="management-workspace">
        <header className="management-topbar">
          <div><span className="management-topbar__label">Sistema de gestão</span><strong>Operação Visa Fácil</strong></div>
          <div className="management-user" aria-label="Usuário do sistema"><span>VF</span><div><strong>Administrador</strong><small>Autenticação pendente</small></div></div>
        </header>
        <main className="management-content">{children}</main>
      </div>
    </div>
  );
}
