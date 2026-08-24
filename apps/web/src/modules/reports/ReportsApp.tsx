import { useRef, useState } from 'react';
import './reports.css';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/crm', icon: '⌂' },
  { label: 'CRM', href: '/crm/relacionamento', icon: '◎' },
  { label: 'Atendimentos', href: '/crm/atendimentos', icon: '◌' },
  { label: 'Tarefas', href: '/crm/tarefas', icon: '✓' },
  { label: 'Agenda', href: '/crm/agenda', icon: '□' },
  { label: 'Financeiro', href: '/crm/financeiro', icon: '$' },
  { label: 'Relatórios', href: '/crm/relatorios', icon: '▥' },
  { label: 'Configurações', href: '/crm/configuracoes', icon: '⚙' },
];

type ReportEntity = {
  id: string;
  label: string;
  description: string;
  columns: string[];
  supportsImport: boolean;
  supportsExport: boolean;
};

const ENTITIES: ReportEntity[] = [
  { id: 'contacts', label: 'Contatos', description: 'Cadastros e dados de relacionamento do CRM.', columns: ['Nome', 'E-mail', 'Telefone', 'CPF', 'RG', 'Passaporte', 'Serviço', 'Destino'], supportsImport: true, supportsExport: true },
  { id: 'leads', label: 'Leads', description: 'Leads, origem, interesse, status e informações comerciais.', columns: ['Nome', 'E-mail', 'Telefone', 'Origem', 'Status', 'Serviço', 'Tipo de visto', 'Destino'], supportsImport: true, supportsExport: true },
  { id: 'attendance', label: 'Atendimentos', description: 'Conversas, canais, protocolos, filas e responsáveis.', columns: ['Cliente', 'Canal', 'Protocolo', 'Status', 'Fila', 'Responsável', 'Última mensagem'], supportsImport: false, supportsExport: true },
  { id: 'tasks', label: 'Tarefas', description: 'Pendências, prioridades, responsáveis, prazos e status.', columns: ['Tarefa', 'Vínculo', 'Responsável', 'Prioridade', 'Prazo', 'Status'], supportsImport: true, supportsExport: true },
  { id: 'agenda', label: 'Agenda', description: 'Compromissos, eventos, entrevistas e prazos.', columns: ['Evento', 'Tipo', 'Data', 'Horário', 'Status', 'Responsável', 'Vínculo'], supportsImport: true, supportsExport: true },
  { id: 'finance', label: 'Lançamentos financeiros', description: 'Receitas, despesas, contas a pagar e a receber.', columns: ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Data', 'Vencimento', 'Status'], supportsImport: true, supportsExport: true },
];

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }
function BrandMark() { return <span className="crm-brand-mark" aria-hidden="true"><i /><b /></span>; }
function FlagCard() { return <div className="crm-flag" aria-hidden="true"><span className="crm-flag__blue">✦ ✦ ✦<br /> ✦ ✦</span><span className="crm-flag__stripes" /></div>; }
function BellIcon() { return <span className="reports-bell" aria-hidden="true" />; }

function downloadTemplate(entity: ReportEntity) {
  const csv = `${entity.columns.join(';')}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entity.id}-template.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportsApp() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [importEntity, setImportEntity] = useState<ReportEntity>();
  const [file, setFile] = useState<File>();
  const [importState, setImportState] = useState<'idle' | 'validated' | 'imported'>('idle');
  const [exporting, setExporting] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const closeImport = () => { setImportEntity(undefined); setFile(undefined); setImportState('idle'); };
  const runExport = (entity: ReportEntity) => {
    setExporting(entity.id);
    window.setTimeout(() => {
      const content = `Relatório: ${entity.label}\nColunas: ${entity.columns.join(', ')}\n\nProtótipo frontend: exportação XLSX será conectada à API do backend.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity.id}-exportacao-prototipo.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExporting(undefined);
    }, 350);
  };

  return <div className="crm-shell reports-shell" onClick={() => { if (notificationsOpen) setNotificationsOpen(false); if (userOpen) setUserOpen(false); }}>
    <aside className="crm-sidebar">
      <a className="crm-brand" href={browserHref('/crm')}><BrandMark /><span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span></a>
      <div className="crm-sidebar-accent"><i /><i /><i /></div><span className="crm-sidebar-label">OPERAÇÃO</span>
      <nav>{NAV_ITEMS.map(item => <a key={item.href} className={item.href === '/crm/relatorios' ? 'is-active' : ''} href={browserHref(item.href)}><span>{item.icon}</span>{item.label}</a>)}</nav>
      <div className="crm-sidebar-footer"><FlagCard /><a href={browserHref('/')}>← Voltar ao site</a><small>Protótipo · branch dev</small></div>
    </aside>

    <div className="crm-workspace">
      <header className="crm-topbar">
        <div><small>VISA FÁCIL · CRM</small><h1>Relatórios</h1><p>Importação e exportação de dados por módulo.</p></div>
        <div className="crm-topbar-actions" onClick={event => event.stopPropagation()}>
          <div className="reports-topbar-menu"><button className="reports-notification-button" aria-label="Alertas" onClick={() => { setNotificationsOpen(v => !v); setUserOpen(false); }}><BellIcon /></button>{notificationsOpen && <div className="reports-dropdown"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div>
          <div className="reports-topbar-menu"><button className="crm-user" onClick={() => { setUserOpen(v => !v); setNotificationsOpen(false); }}><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div><span className="crm-user-caret">⌄</span></button>{userOpen && <div className="reports-dropdown reports-user-dropdown"><button>Perfil</button><a href={browserHref('/crm/configuracoes')}>Configurações</a><button className="is-danger">Logout</button></div>}</div>
        </div>
      </header>

      <main className="reports-content">
        <section className="reports-card">
          <div className="reports-entity-list">
            {ENTITIES.map(entity => <article key={entity.id} className="reports-entity-row">
              <div className="reports-entity-icon">▥</div>
              <div className="reports-entity-copy"><strong>{entity.label}</strong><p>{entity.description}</p><small>{entity.columns.length} campos disponíveis</small></div>
              <div className="reports-entity-actions">
                <button className="reports-action-button" disabled={!entity.supportsImport} onClick={() => { setImportEntity(entity); setFile(undefined); setImportState('idle'); }}>↑ Importar</button>
                <button className="reports-action-button reports-action-button--primary" disabled={!entity.supportsExport || exporting === entity.id} onClick={() => runExport(entity)}>{exporting === entity.id ? 'Exportando...' : '↓ Exportar XLSX'}</button>
              </div>
            </article>)}
          </div>
        </section>
      </main>
    </div>

    {importEntity && <div className="reports-modal-backdrop" onMouseDown={event => { if (event.currentTarget === event.target) closeImport(); }}>
      <div className="reports-import-modal">
        <header><div><span>IMPORTAÇÃO</span><h2>Importar {importEntity.label}</h2><p>Envie um arquivo para validação antes de concluir a importação.</p></div><button onClick={closeImport}>×</button></header>
        <div className="reports-import-body">
          <div className="reports-import-toolbar"><button onClick={() => downloadTemplate(importEntity)}>↓ Baixar template</button></div>
          <button className="reports-dropzone" type="button" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".xlsx,.csv" hidden onChange={event => { const next = event.target.files?.[0]; setFile(next); setImportState('idle'); }} />
            <span>↑</span><strong>{file ? file.name : 'Selecionar arquivo'}</strong><small>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'XLSX ou CSV'}</small>
          </button>
          {importState === 'validated' && <div className="reports-validation reports-validation--ok"><strong>Arquivo validado</strong><p>Estrutura pronta para importação no protótipo.</p></div>}
          {importState === 'imported' && <div className="reports-validation reports-validation--ok"><strong>Importação concluída</strong><p>A listagem será sincronizada automaticamente quando o backend estiver conectado.</p></div>}
          <div className="reports-import-columns"><span>Campos esperados</span><div>{importEntity.columns.map(column => <b key={column}>{column}</b>)}</div></div>
        </div>
        <footer><button className="crm-btn-secondary" onClick={closeImport}>Cancelar</button>{importState === 'idle' && <button className="crm-btn-primary" disabled={!file} onClick={() => file && setImportState('validated')}>Validar arquivo</button>}{importState === 'validated' && <button className="crm-btn-primary" onClick={() => setImportState('imported')}>Importar</button>}{importState === 'imported' && <button className="crm-btn-primary" onClick={closeImport}>Concluir</button>}</footer>
      </div>
    </div>}
  </div>;
}
