import { useMemo, useState } from 'react';
import './crm-relationship-layout.css';
import './crm-record-modals.css';
import { getCrmInitialRecords } from './mocks/mockDataProvider';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/crm', icon: '⌂' },
  { label: 'CRM', href: '/crm/relacionamento', icon: '◎' },
  { label: 'Oportunidades', href: '/crm/oportunidades', icon: '◇' },
  { label: 'Atendimentos', href: '/crm/atendimentos', icon: '◌' },
  { label: 'Tarefas', href: '/crm/tarefas', icon: '✓' },
  { label: 'Agenda', href: '/crm/agenda', icon: '□' },
  { label: 'Financeiro', href: '/crm/financeiro', icon: '$' },
  { label: 'Relatórios', href: '/crm/relatorios', icon: '▥' },
  { label: 'Configurações', href: '/crm/configuracoes', icon: '⚙' },
];

const KPI_ITEMS = [
  { label: 'Contatos', value: '0', detail: 'cadastrados', tone: 'blue' },
  { label: 'Leads', value: '0', detail: 'em acompanhamento', tone: 'red' },
  { label: 'Clientes', value: '0', detail: 'ativos', tone: 'navy' },
  { label: 'Oportunidades', value: '0', detail: 'em aberto', tone: 'red' },
  { label: 'Conversas', value: '0', detail: 'não lidas', tone: 'navy' },
  { label: 'Tarefas', value: '0', detail: 'pendentes', tone: 'blue' },
];

type CrmTab = 'contacts' | 'leads';
type RecordKind = 'contact' | 'lead';
type ModalMode = 'create' | 'view' | 'edit';
type PersonType = 'Pessoa Física' | 'Pessoa Jurídica';

export type CrmRecord = {
  id: string;
  kind: RecordKind;
  personType: PersonType;
  fullName: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  contactPerson: string;
  role: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  relationship?: string;
  contactStatus?: string;
  source?: string;
  owner?: string;
  interest?: string;
  destination?: string;
  visaType?: string;
  leadStatus?: string;
  temperature?: string;
  nextAction?: string;
  nextActionDate?: string;
};

type RecordDraft = Omit<CrmRecord, 'id' | 'kind' | 'createdAt' | 'updatedAt'>;

const EMPTY_DRAFT: RecordDraft = {
  personType: 'Pessoa Física', fullName: '', legalName: '', tradeName: '', cnpj: '', contactPerson: '', role: '',
  email: '', phone: '', whatsapp: '', city: '', state: '', country: 'Brasil', notes: '', relationship: 'Cliente',
  contactStatus: 'Ativo', source: 'Website', owner: '', interest: '', destination: '', visaType: '', leadStatus: 'Novo',
  temperature: 'Morno', nextAction: '', nextActionDate: '',
};

function getBasePath() { const base = import.meta.env.BASE_URL.replace(/\/$/, ''); return base || ''; }
function normalizePath(pathname: string) { const base = getBasePath(); const rawPath = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname; const path = rawPath.replace(/\/+$/, '') || '/crm'; if (path === '/crm/contatos' || path === '/crm/leads') return '/crm/relacionamento'; return path; }
function browserHref(path: string) { return `${getBasePath()}${path}` || path; }
function BrandMark() { return <span className="crm-brand-mark" aria-hidden="true"><i /><b /></span>; }
function FlagCard() { return <div className="crm-flag" aria-hidden="true"><span className="crm-flag__blue">✦ ✦ ✦<br /> ✦ ✦</span><span className="crm-flag__stripes" /></div>; }
function displayName(record: Pick<CrmRecord, 'personType' | 'fullName' | 'tradeName' | 'legalName'>) { return record.personType === 'Pessoa Jurídica' ? record.tradeName || record.legalName || 'Empresa sem nome' : record.fullName || 'Contato sem nome'; }

function Dashboard() {
  return <>
    <section className="crm-kpi-grid" aria-label="Indicadores do CRM">{KPI_ITEMS.map((item) => <article key={item.label} className="crm-kpi-card"><span className={`crm-kpi-card__icon crm-kpi-card__icon--${item.tone}`}>●</span><div><small>{item.label}</small><strong>{item.value}</strong><p>{item.detail}</p></div></article>)}</section>
    <section className="crm-dashboard-grid crm-dashboard-grid--top">
      <article className="crm-panel"><div className="crm-panel__heading"><h2>Leads por status</h2></div><div className="crm-donut-wrap"><div className="crm-donut">0</div><ul><li><span className="dot dot--blue" />Novo <b>0</b></li><li><span className="dot dot--red" />Em contato <b>0</b></li><li><span className="dot dot--navy" />Qualificado <b>0</b></li><li><span className="dot dot--soft" />Convertido <b>0</b></li></ul></div></article>
      <article className="crm-panel"><div className="crm-panel__heading"><h2>Origem dos leads</h2></div><div className="crm-bars"><div><span>Website</span><i /><b>0</b></div><div><span>WhatsApp</span><i /><b>0</b></div><div><span>Instagram</span><i /><b>0</b></div><div><span>Facebook</span><i /><b>0</b></div></div></article>
      <article className="crm-panel"><div className="crm-panel__heading"><h2>Financeiro (Resumo)</h2><button type="button">Ver módulo</button></div><div className="crm-finance-summary"><div><small>Receitas</small><strong>R$ 0,00</strong></div><div><small>Despesas</small><strong>R$ 0,00</strong></div></div><div className="crm-result"><small>Resultado</small><strong>R$ 0,00</strong><p>Valores demonstrativos do protótipo</p></div></article>
    </section>
    <section className="crm-dashboard-grid crm-dashboard-grid--bottom"><article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Atendimentos recentes</h2><button type="button">Ver todos</button></div><p>Nenhum atendimento registrado.</p></article><article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Tarefas pendentes</h2><button type="button">Ver todas</button></div><p>Nenhuma tarefa pendente.</p></article><article className="crm-panel crm-empty-panel"><div className="crm-panel__heading"><h2>Conversas</h2><button type="button">Abrir central</button></div><p>Nenhuma conversa iniciada.</p></article></section>
  </>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? 'crm-form-field crm-form-field--wide' : 'crm-form-field'}><span>{label}</span>{children}</label>; }

function RecordForm({ kind, initial, onCancel, onSubmit }: { kind: RecordKind; initial: RecordDraft; onCancel: () => void; onSubmit: (draft: RecordDraft) => void }) {
  const [draft, setDraft] = useState<RecordDraft>(initial);
  const set = (key: keyof RecordDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const isCompany = draft.personType === 'Pessoa Jurídica';
  const setPersonType = (value: PersonType) => setDraft((current) => value === 'Pessoa Física'
    ? { ...current, personType: value, legalName: '', tradeName: '', cnpj: '', contactPerson: '', role: '' }
    : { ...current, personType: value, fullName: '' });
  const hasIdentity = isCompany ? draft.legalName.trim() && draft.tradeName.trim() : draft.fullName.trim();

  return <form className="crm-record-form" onSubmit={(event) => { event.preventDefault(); if (!hasIdentity || !draft.email.trim()) return; onSubmit(draft); }}>
    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>Tipo de pessoa</strong><small>Os campos abaixo mudam conforme a natureza do cadastro.</small></div><div className="crm-form-grid"><Field label="Pessoa"><select value={draft.personType} onChange={(e) => setPersonType(e.target.value as PersonType)}><option>Pessoa Física</option><option>Pessoa Jurídica</option></select></Field></div></div>

    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>{isCompany ? 'Dados da empresa' : 'Identificação pessoal'}</strong><small>{isCompany ? 'Informações exclusivas de pessoa jurídica.' : 'Informações exclusivas de pessoa física.'}</small></div><div className="crm-form-grid">
      {isCompany ? <>
        <Field label="Razão social" wide><input required value={draft.legalName} onChange={(e) => set('legalName', e.target.value)} placeholder="Razão social" /></Field>
        <Field label="Nome fantasia"><input required value={draft.tradeName} onChange={(e) => set('tradeName', e.target.value)} placeholder="Nome fantasia" /></Field>
        <Field label="CNPJ"><input value={draft.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></Field>
        <Field label="Pessoa de contato"><input value={draft.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="Nome do contato principal" /></Field>
        <Field label="Cargo / Função"><input value={draft.role} onChange={(e) => set('role', e.target.value)} /></Field>
      </> : <Field label="Nome completo" wide><input required value={draft.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Nome completo" /></Field>}

      {kind === 'contact' ? <Field label="Relacionamento"><select value={draft.relationship} onChange={(e) => set('relationship', e.target.value)}><option>Cliente</option><option>Parceiro</option><option>Fornecedor</option><option>Prestador</option><option>Outro</option></select></Field> : <>
        <Field label="Origem"><select value={draft.source} onChange={(e) => set('source', e.target.value)}><option>Website</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option><option>Indicação</option><option>Google</option><option>Outro</option></select></Field>
        <Field label="Interesse / Serviço"><input value={draft.interest} onChange={(e) => set('interest', e.target.value)} /></Field><Field label="Destino de interesse"><input value={draft.destination} onChange={(e) => set('destination', e.target.value)} /></Field><Field label="Tipo de visto / Interesse"><input value={draft.visaType} onChange={(e) => set('visaType', e.target.value)} /></Field>
      </>}
    </div></div>

    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>{isCompany ? 'Contato da empresa' : 'Contato'}</strong><small>Canais e localização.</small></div><div className="crm-form-grid"><Field label="E-mail"><input required type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} /></Field><Field label="Telefone"><input value={draft.phone} onChange={(e) => set('phone', e.target.value)} /></Field><Field label="WhatsApp"><input value={draft.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field><Field label="Cidade"><input value={draft.city} onChange={(e) => set('city', e.target.value)} /></Field><Field label="Estado"><input value={draft.state} onChange={(e) => set('state', e.target.value)} /></Field><Field label="País"><input value={draft.country} onChange={(e) => set('country', e.target.value)} /></Field></div></div>

    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>{kind === 'contact' ? 'Relacionamento' : 'Qualificação comercial'}</strong><small>Contexto operacional.</small></div><div className="crm-form-grid">
      {kind === 'contact' ? <><Field label="Status"><select value={draft.contactStatus} onChange={(e) => set('contactStatus', e.target.value)}><option>Ativo</option><option>Inativo</option></select></Field><Field label="Origem do contato"><select value={draft.source} onChange={(e) => set('source', e.target.value)}><option>Website</option><option>WhatsApp</option><option>Instagram</option><option>Facebook</option><option>Indicação</option><option>Outro</option></select></Field><Field label="Responsável" wide><input value={draft.owner} onChange={(e) => set('owner', e.target.value)} /></Field></> : <><Field label="Status do lead"><select value={draft.leadStatus} onChange={(e) => set('leadStatus', e.target.value)}><option>Novo</option><option>Em contato</option><option>Qualificado</option><option>Não qualificado</option><option>Convertido</option><option>Perdido</option></select></Field><Field label="Temperatura"><select value={draft.temperature} onChange={(e) => set('temperature', e.target.value)}><option>Frio</option><option>Morno</option><option>Quente</option></select></Field><Field label="Responsável"><input value={draft.owner} onChange={(e) => set('owner', e.target.value)} /></Field><Field label="Próxima ação"><input value={draft.nextAction} onChange={(e) => set('nextAction', e.target.value)} /></Field><Field label="Data da próxima ação"><input type="date" value={draft.nextActionDate} onChange={(e) => set('nextActionDate', e.target.value)} /></Field></>}
      <Field label="Observações" wide><textarea rows={4} value={draft.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações importantes..." /></Field>
    </div></div>
    <div className="crm-form-actions"><button type="button" className="crm-btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="crm-btn-primary">Salvar {kind === 'contact' ? 'contato' : 'lead'}</button></div>
  </form>;
}

function DetailItem({ label, value }: { label: string; value?: string }) { return <div className="crm-view-item"><span>{label}</span><strong>{value || '—'}</strong></div>; }
function RecordView({ record, onClose, onEdit }: { record: CrmRecord; onClose: () => void; onEdit: () => void }) {
  const status = record.kind === 'contact' ? record.contactStatus : record.leadStatus;
  const isCompany = record.personType === 'Pessoa Jurídica';
  const name = displayName(record);
  return <div className="crm-view-record">
    <div className="crm-view-hero"><div className="crm-view-avatar">{name.slice(0, 2).toUpperCase()}</div><div className="crm-view-identity"><span>{record.kind === 'contact' ? 'CONTATO' : 'LEAD'} · {record.personType.toUpperCase()}</span><h2>{name}</h2><p>{record.email} · {record.whatsapp || record.phone || 'Sem telefone'}</p><div className="crm-view-badges"><b>{status}</b>{record.kind === 'lead' && <b className="is-warm">{record.temperature}</b>}{record.source && <b className="is-source">{record.source}</b>}</div></div><button className="crm-view-close" type="button" onClick={onClose} aria-label="Fechar">×</button></div>

    {record.kind === 'lead' && <div className="crm-view-commercial"><div><span>Status comercial</span><strong>{record.leadStatus}</strong></div><div><span>Interesse</span><strong>{record.interest || 'Não informado'}</strong></div><div><span>Responsável</span><strong>{record.owner || 'Não definido'}</strong></div><div><span>Próxima ação</span><strong>{record.nextAction || 'Não definida'}</strong><small>{record.nextActionDate || ''}</small></div></div>}

    <section className="crm-view-section"><div className="crm-view-section__title"><span>01</span><div><strong>{isCompany ? 'Dados da empresa' : 'Identificação pessoal'}</strong><small>{isCompany ? 'Informações cadastrais da pessoa jurídica.' : 'Identificação da pessoa física.'}</small></div></div><div className="crm-view-grid">{isCompany ? <><DetailItem label="Razão social" value={record.legalName} /><DetailItem label="Nome fantasia" value={record.tradeName} /><DetailItem label="CNPJ" value={record.cnpj} /><DetailItem label="Pessoa de contato" value={record.contactPerson} /><DetailItem label="Cargo / Função" value={record.role} /></> : <DetailItem label="Nome completo" value={record.fullName} />}</div></section>

    <section className="crm-view-section"><div className="crm-view-section__title"><span>02</span><div><strong>Contato e localização</strong><small>Informações para relacionamento.</small></div></div><div className="crm-view-grid"><DetailItem label="E-mail" value={record.email} /><DetailItem label="Telefone" value={record.phone} /><DetailItem label="WhatsApp" value={record.whatsapp} /><DetailItem label="Cidade" value={record.city} /><DetailItem label="Estado" value={record.state} /><DetailItem label="País" value={record.country} /></div></section>

    <section className="crm-view-section"><div className="crm-view-section__title"><span>03</span><div><strong>{record.kind === 'contact' ? 'Relacionamento' : 'Qualificação'}</strong><small>Contexto operacional do registro.</small></div></div><div className="crm-view-grid">{record.kind === 'contact' ? <><DetailItem label="Relacionamento" value={record.relationship} /><DetailItem label="Origem" value={record.source} /><DetailItem label="Responsável" value={record.owner} /></> : <><DetailItem label="Origem" value={record.source} /><DetailItem label="Destino" value={record.destination} /><DetailItem label="Tipo de visto" value={record.visaType} /><DetailItem label="Temperatura" value={record.temperature} /></>}</div></section>
    <section className="crm-view-note"><span>OBSERVAÇÕES</span><p>{record.notes || 'Nenhuma observação registrada.'}</p></section>
    <div className="crm-view-footer"><div><small>Criado em {new Date(record.createdAt).toLocaleString('pt-BR')}</small><small>Atualizado em {new Date(record.updatedAt).toLocaleString('pt-BR')}</small></div><button type="button" className="crm-btn-secondary" onClick={onClose}>Fechar</button><button type="button" className="crm-btn-primary" onClick={onEdit}>Editar</button></div>
  </div>;
}

function RecordModal({ mode, kind, record, onClose, onSave, onEdit }: { mode: ModalMode; kind: RecordKind; record?: CrmRecord; onClose: () => void; onSave: (draft: RecordDraft) => void; onEdit: () => void }) {
  if (mode === 'view' && record) return <div className="crm-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="crm-view-modal" role="dialog" aria-modal="true"><RecordView record={record} onClose={onClose} onEdit={onEdit} /></div></div>;
  const draft = record ? { ...EMPTY_DRAFT, ...record } : EMPTY_DRAFT;
  return <div className="crm-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="crm-form-modal" role="dialog" aria-modal="true"><header><div><span>{mode === 'create' ? 'NOVO REGISTRO' : 'EDITAR REGISTRO'}</span><h2>{mode === 'create' ? 'Novo' : 'Editar'} {kind === 'contact' ? 'contato' : 'lead'}</h2><p>Selecione Pessoa Física ou Pessoa Jurídica para exibir somente os campos correspondentes.</p></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header><RecordForm kind={kind} initial={draft} onCancel={onClose} onSubmit={onSave} /></div></div>;
}

function RelationshipCrm({ tab, setTab, records, openModal }: { tab: CrmTab; setTab: (tab: CrmTab) => void; records: CrmRecord[]; openModal: (mode: ModalMode, kind: RecordKind, record?: CrmRecord) => void }) {
  const visible = records.filter((record) => tab === 'contacts' ? record.kind === 'contact' : record.kind === 'lead');
  const contacts = records.filter((record) => record.kind === 'contact').length; const leads = records.filter((record) => record.kind === 'lead').length; const clients = records.filter((record) => record.kind === 'contact' && record.relationship === 'Cliente').length; const qualified = records.filter((record) => record.kind === 'lead' && record.leadStatus === 'Qualificado').length; const converted = records.filter((record) => record.kind === 'lead' && record.leadStatus === 'Convertido').length;
  const summary = [['Total de contatos', String(contacts)], ['Clientes', String(clients)], ['Leads', String(leads)], ['Qualificados', String(qualified)], ['Convertidos', String(converted)]];
  return <section className="crm-directory">
    <section className="crm-directory-summary" aria-label="Resumo do relacionamento">{summary.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <div className="crm-directory-tabs" role="tablist" aria-label="CRM"><button type="button" role="tab" aria-selected={tab === 'contacts'} className={tab === 'contacts' ? 'is-active' : ''} onClick={() => setTab('contacts')}><span aria-hidden="true">♧</span> Contatos <small>{contacts}</small></button><button type="button" role="tab" aria-selected={tab === 'leads'} className={tab === 'leads' ? 'is-active' : ''} onClick={() => setTab('leads')}><span aria-hidden="true">⌁</span> Leads <small>{leads}</small></button></div>
    <div className="crm-directory-toolbar"><label className="crm-directory-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar" placeholder={tab === 'contacts' ? 'Buscar por nome, empresa, e-mail, telefone ou cidade' : 'Buscar lead por nome, origem, e-mail ou telefone'} /></label><select aria-label="Filtrar registros"><option>Todos</option>{tab === 'contacts' ? <><option>Clientes</option><option>Parceiros</option><option>Fornecedores</option><option>Prestadores</option></> : <><option>Novo</option><option>Em contato</option><option>Qualificado</option><option>Convertido</option></>}</select></div>
    <div className="crm-directory-table"><div className="crm-directory-table__head"><span>Nome</span><span>{tab === 'contacts' ? 'Relacionamento' : 'Origem'}</span><span>Status</span><span>E-mail / telefone</span><span>{tab === 'contacts' ? 'Cidade' : 'Próxima ação'}</span><span>Ações</span></div>{visible.length === 0 ? <div className="crm-directory-list"><p>Nenhum {tab === 'contacts' ? 'contato' : 'lead'} encontrado.</p></div> : visible.map((record) => <div className="crm-directory-row" key={record.id}><div><strong>{displayName(record)}</strong><small>{record.personType === 'Pessoa Jurídica' ? record.legalName : record.personType}</small></div><span>{record.kind === 'contact' ? record.relationship : record.source}</span><span><b className="crm-status-pill">{record.kind === 'contact' ? record.contactStatus : record.leadStatus}</b></span><div><strong>{record.email}</strong><small>{record.whatsapp || record.phone}</small></div><span>{record.kind === 'contact' ? [record.city, record.state].filter(Boolean).join(' / ') : record.nextAction || '—'}</span><div className="crm-row-actions"><button type="button" onClick={() => openModal('view', record.kind, record)}>Ver</button><button type="button" onClick={() => openModal('edit', record.kind, record)}>Editar</button></div></div>)}</div>
  </section>;
}

function Placeholder({ title }: { title: string }) { return <section className="crm-placeholder"><span>PROTÓTIPO</span><h2>{title}</h2><p>Estrutura visual criada. O conteúdo deste módulo será definido na próxima etapa.</p></section>; }

export function CrmApp() {
  const path = normalizePath(window.location.pathname); const active = useMemo(() => NAV_ITEMS.find((item) => path === item.href) ?? NAV_ITEMS[0], [path]); const isDashboard = path === '/crm'; const isRelationship = path === '/crm/relacionamento';
  const [tab, setTab] = useState<CrmTab>('contacts'); const [records, setRecords] = useState<CrmRecord[]>(() => getCrmInitialRecords()); const [modal, setModal] = useState<{ mode: ModalMode; kind: RecordKind; record?: CrmRecord }>();
  const openModal = (mode: ModalMode, kind: RecordKind, record?: CrmRecord) => setModal({ mode, kind, record });
  const saveRecord = (draft: RecordDraft) => { const now = new Date().toISOString(); if (modal?.record) setRecords((current) => current.map((record) => record.id === modal.record?.id ? { ...record, ...draft, updatedAt: now } : record)); else if (modal) setRecords((current) => [...current, { ...draft, id: crypto.randomUUID(), kind: modal.kind, createdAt: now, updatedAt: now }]); setModal(undefined); };
  return <div className="crm-shell"><aside className="crm-sidebar"><a className="crm-brand" href={browserHref('/crm')}><BrandMark /><span><strong>VISA FÁCIL</strong><small>CRM · Relacionamento</small></span></a><div className="crm-sidebar-accent"><i /><i /><i /></div><span className="crm-sidebar-label">OPERAÇÃO</span><nav>{NAV_ITEMS.map((item) => <a key={item.href} className={path === item.href ? 'is-active' : ''} href={browserHref(item.href)}><span>{item.icon}</span>{item.label}</a>)}</nav><div className="crm-sidebar-footer"><FlagCard /><a href={browserHref('/')}>← Voltar ao site</a><small>Protótipo · branch dev</small></div></aside>
    <div className="crm-workspace"><header className="crm-topbar"><div><small>VISA FÁCIL · CRM</small><h1>{active.label}</h1><p>{isDashboard ? 'Visão geral do relacionamento e da operação comercial.' : isRelationship ? 'Central de relacionamento operacional.' : `Gestão de ${active.label.toLowerCase()} no CRM Visa Fácil.`}</p></div><div className="crm-topbar-actions">{isRelationship && <button className="crm-topbar-primary" type="button" onClick={() => openModal('create', tab === 'contacts' ? 'contact' : 'lead')}>+ Novo {tab === 'contacts' ? 'contato' : 'lead'}</button>}<button type="button" aria-label="Alertas">⌁</button><div className="crm-user"><span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div></div></div></header><main className="crm-content">{isDashboard ? <Dashboard /> : isRelationship ? <RelationshipCrm tab={tab} setTab={setTab} records={records} openModal={openModal} /> : <Placeholder title={active.label} />}</main></div>
    {modal && <RecordModal mode={modal.mode} kind={modal.kind} record={modal.record} onClose={() => setModal(undefined)} onSave={saveRecord} onEdit={() => setModal((current) => current?.record ? { ...current, mode: 'edit' } : current)} />}
  </div>;
}
