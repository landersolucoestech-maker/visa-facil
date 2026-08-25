import { useMemo, useState } from 'react';
import './crm-relationship-layout.css';
import './crm-record-modals.css';
import { getCrmInitialRecords } from './mocks/mockDataProvider';
import type { CrmRecord, CrmRecordDraft, CrmTab, ModalMode, RecordKind } from './types';

const SERVICE_OPTIONS = ['Assessoria para visto de turismo', 'Renovação de visto', 'Visto de estudante', 'Visto de trabalho', 'Visto de negócios', 'Outro'];
const DESTINATION_OPTIONS = ['Estados Unidos', 'Canadá', 'Outro'];
const VISA_TYPE_OPTIONS = ['B1/B2', 'F-1', 'J-1', 'H-1B', 'L-1', 'O-1', 'EB', 'Outro'];
const SOURCE_OPTIONS = ['Website', 'WhatsApp', 'Instagram', 'Facebook', 'Indicação', 'Google', 'Outro'];
const RELATIONSHIP_OPTIONS = ['Cliente', 'Parceiro', 'Outro'];
const CONTACT_STATUS_OPTIONS = ['Ativo', 'Inativo'];
const LEAD_STATUS_OPTIONS = ['Novo', 'Em contato', 'Qualificado', 'Não qualificado', 'Convertido', 'Perdido'];
const TEMPERATURE_OPTIONS = ['Frio', 'Morno', 'Quente'];

const EMPTY_DRAFT: CrmRecordDraft = {
  fullName: '', cpf: '', rg: '', passportNumber: '', email: '', phone: '', whatsapp: '', city: '', state: '', country: 'Brasil', notes: '',
  relationship: 'Cliente', contactStatus: 'Ativo', source: 'Website', owner: '', interest: '', destination: '', visaType: '',
  leadStatus: 'Novo', temperature: 'Morno', nextAction: '', nextActionDate: '',
};

function displayName(record: Pick<CrmRecord, 'fullName'>) { return record.fullName || 'Contato sem nome'; }
function BellIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="crm-form-field"><span>{label}</span>{children}</label>; }
function Options({ values }: { values: string[] }) { return <>{values.map(value => <option key={value}>{value}</option>)}</>; }
function ServiceFields({ draft, set }: { draft: CrmRecordDraft; set: (key: keyof CrmRecordDraft, value: string) => void }) {
  return <>
    <Field label="Interesse / Serviço"><select value={draft.interest} onChange={(event) => set('interest', event.target.value)}><option value="">Selecione o serviço</option><Options values={SERVICE_OPTIONS}/></select></Field>
    <Field label="Destino de interesse"><select value={draft.destination} onChange={(event) => set('destination', event.target.value)}><option value="">Selecione o destino</option><Options values={DESTINATION_OPTIONS}/></select></Field>
    <Field label="Tipo de visto / Interesse"><select value={draft.visaType} onChange={(event) => set('visaType', event.target.value)}><option value="">Selecione o tipo de visto</option><Options values={VISA_TYPE_OPTIONS}/></select></Field>
  </>;
}

function RecordForm({ kind, initial, onCancel, onSubmit }: { kind: RecordKind; initial: CrmRecordDraft; onCancel: () => void; onSubmit: (draft: CrmRecordDraft) => void }) {
  const [draft, setDraft] = useState<CrmRecordDraft>(initial);
  const set = (key: keyof CrmRecordDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return <form className="crm-record-form" onSubmit={(event) => { event.preventDefault(); if (!draft.fullName.trim() || !draft.email.trim()) return; onSubmit(draft); }}>
    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>Identificação pessoal</strong><small>Dados principais e documentos da pessoa atendida.</small></div><div className="crm-form-grid">
      <Field label="Nome completo"><input required value={draft.fullName} onChange={(event) => set('fullName', event.target.value)} placeholder="Nome completo" /></Field>
      <Field label="CPF"><input value={draft.cpf} onChange={(event) => set('cpf', event.target.value)} placeholder="000.000.000-00" /></Field>
      <Field label="RG"><input value={draft.rg} onChange={(event) => set('rg', event.target.value)} placeholder="Número do RG" /></Field>
      <Field label="Número do passaporte"><input value={draft.passportNumber} onChange={(event) => set('passportNumber', event.target.value)} placeholder="Número do passaporte" /></Field>
      <ServiceFields draft={draft} set={set} />
      {kind === 'contact' ? <Field label="Relacionamento"><select value={draft.relationship} onChange={(event) => set('relationship', event.target.value)}><Options values={RELATIONSHIP_OPTIONS}/></select></Field> : <Field label="Origem"><select value={draft.source} onChange={(event) => set('source', event.target.value)}><Options values={SOURCE_OPTIONS}/></select></Field>}
    </div></div>
    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>Contato</strong><small>Canais e localização.</small></div><div className="crm-form-grid">
      <Field label="E-mail"><input required type="email" value={draft.email} onChange={(event) => set('email', event.target.value)} /></Field><Field label="Telefone"><input value={draft.phone} onChange={(event) => set('phone', event.target.value)} /></Field><Field label="WhatsApp"><input value={draft.whatsapp} onChange={(event) => set('whatsapp', event.target.value)} /></Field><Field label="Cidade"><input value={draft.city} onChange={(event) => set('city', event.target.value)} /></Field><Field label="Estado"><input value={draft.state} onChange={(event) => set('state', event.target.value)} /></Field><Field label="País"><input value={draft.country} onChange={(event) => set('country', event.target.value)} /></Field>
    </div></div>
    <div className="crm-form-section"><div className="crm-form-section__heading"><strong>{kind === 'contact' ? 'Relacionamento' : 'Qualificação comercial'}</strong><small>Contexto operacional do registro.</small></div><div className="crm-form-grid">
      {kind === 'contact' ? <><Field label="Status"><select value={draft.contactStatus} onChange={(event) => set('contactStatus', event.target.value)}><Options values={CONTACT_STATUS_OPTIONS}/></select></Field><Field label="Origem do contato"><select value={draft.source} onChange={(event) => set('source', event.target.value)}><Options values={SOURCE_OPTIONS}/></select></Field><Field label="Responsável"><input value={draft.owner} onChange={(event) => set('owner', event.target.value)} /></Field></> : <><Field label="Status do lead"><select value={draft.leadStatus} onChange={(event) => set('leadStatus', event.target.value)}><Options values={LEAD_STATUS_OPTIONS}/></select></Field><Field label="Temperatura"><select value={draft.temperature} onChange={(event) => set('temperature', event.target.value)}><Options values={TEMPERATURE_OPTIONS}/></select></Field><Field label="Responsável"><input value={draft.owner} onChange={(event) => set('owner', event.target.value)} /></Field><Field label="Próxima ação"><input value={draft.nextAction} onChange={(event) => set('nextAction', event.target.value)} /></Field><Field label="Data da próxima ação"><input type="date" value={draft.nextActionDate} onChange={(event) => set('nextActionDate', event.target.value)} /></Field></>}
      <Field label="Observações"><textarea rows={4} value={draft.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Observações importantes..." /></Field>
    </div></div>
    <div className="crm-form-actions"><button type="button" className="crm-btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="crm-btn-primary">Salvar {kind === 'contact' ? 'contato' : 'lead'}</button></div>
  </form>;
}

function DetailItem({ label, value }: { label: string; value?: string }) { return <div className="crm-view-item"><span>{label}</span><strong>{value || '—'}</strong></div>; }
function RecordView({ record, onClose, onEdit }: { record: CrmRecord; onClose: () => void; onEdit: () => void }) {
  const status = record.kind === 'contact' ? record.contactStatus : record.leadStatus;
  const name = displayName(record);
  return <div className="crm-view-record"><div className="crm-view-hero"><div className="crm-view-avatar">{name.slice(0, 2).toUpperCase()}</div><div className="crm-view-identity"><span>{record.kind === 'contact' ? 'CONTATO' : 'LEAD'}</span><h2>{name}</h2><p>{record.email} · {record.whatsapp || record.phone || 'Sem telefone'}</p><div className="crm-view-badges"><b>{status}</b>{record.kind === 'lead' && <b className="is-warm">{record.temperature}</b>}{record.source && <b className="is-source">{record.source}</b>}</div></div><button className="crm-view-close" type="button" onClick={onClose} aria-label="Fechar">×</button></div>
    {record.kind === 'lead' && <div className="crm-view-commercial"><div><span>Status comercial</span><strong>{record.leadStatus}</strong></div><div><span>Interesse</span><strong>{record.interest || 'Não informado'}</strong></div><div><span>Responsável</span><strong>{record.owner || 'Não definido'}</strong></div><div><span>Próxima ação</span><strong>{record.nextAction || 'Não definida'}</strong><small>{record.nextActionDate || ''}</small></div></div>}
    <section className="crm-view-section"><div className="crm-view-section__title"><span>01</span><div><strong>Identificação pessoal</strong><small>Dados cadastrais e documentos.</small></div></div><div className="crm-view-grid"><DetailItem label="Nome completo" value={record.fullName} /><DetailItem label="CPF" value={record.cpf} /><DetailItem label="RG" value={record.rg} /><DetailItem label="Número do passaporte" value={record.passportNumber} /></div></section>
    <section className="crm-view-section"><div className="crm-view-section__title"><span>02</span><div><strong>Contato e localização</strong><small>Informações para relacionamento.</small></div></div><div className="crm-view-grid"><DetailItem label="E-mail" value={record.email} /><DetailItem label="Telefone" value={record.phone} /><DetailItem label="WhatsApp" value={record.whatsapp} /><DetailItem label="Cidade" value={record.city} /><DetailItem label="Estado" value={record.state} /><DetailItem label="País" value={record.country} /></div></section>
    <section className="crm-view-section"><div className="crm-view-section__title"><span>03</span><div><strong>{record.kind === 'contact' ? 'Relacionamento e interesse' : 'Qualificação'}</strong><small>Contexto operacional.</small></div></div><div className="crm-view-grid">{record.kind === 'contact' ? <><DetailItem label="Relacionamento" value={record.relationship} /><DetailItem label="Interesse / Serviço" value={record.interest} /><DetailItem label="Destino" value={record.destination} /><DetailItem label="Tipo de visto" value={record.visaType} /><DetailItem label="Origem" value={record.source} /><DetailItem label="Responsável" value={record.owner} /></> : <><DetailItem label="Origem" value={record.source} /><DetailItem label="Interesse / Serviço" value={record.interest} /><DetailItem label="Destino" value={record.destination} /><DetailItem label="Tipo de visto" value={record.visaType} /><DetailItem label="Temperatura" value={record.temperature} /></>}</div></section>
    <section className="crm-view-note"><span>OBSERVAÇÕES</span><p>{record.notes || 'Nenhuma observação registrada.'}</p></section><div className="crm-view-footer"><div><small>Criado em {new Date(record.createdAt).toLocaleString('pt-BR')}</small><small>Atualizado em {new Date(record.updatedAt).toLocaleString('pt-BR')}</small></div><button type="button" className="crm-btn-secondary" onClick={onClose}>Fechar</button><button type="button" className="crm-btn-primary" onClick={onEdit}>Editar</button></div>
  </div>;
}

function RecordModal({ mode, kind, record, onClose, onSave, onEdit }: { mode: ModalMode; kind: RecordKind; record?: CrmRecord; onClose: () => void; onSave: (draft: CrmRecordDraft) => void; onEdit: () => void }) {
  if (mode === 'view' && record) return <div className="crm-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="crm-view-modal" role="dialog" aria-modal="true"><RecordView record={record} onClose={onClose} onEdit={onEdit} /></div></div>;
  const draft = record ? { ...EMPTY_DRAFT, ...record } : EMPTY_DRAFT;
  return <div className="crm-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="crm-form-modal" role="dialog" aria-modal="true"><header><div><span>{mode === 'create' ? 'NOVO REGISTRO' : 'EDITAR REGISTRO'}</span><h2>{mode === 'create' ? 'Novo' : 'Editar'} {kind === 'contact' ? 'contato' : 'lead'}</h2><p>Cadastre os dados da pessoa atendida.</p></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header><RecordForm kind={kind} initial={draft} onCancel={onClose} onSubmit={onSave} /></div></div>;
}

function RelationshipCrm({ tab, setTab, records, openModal, onDelete }: { tab: CrmTab; setTab: (tab: CrmTab) => void; records: CrmRecord[]; openModal: (mode: ModalMode, kind: RecordKind, record?: CrmRecord) => void; onDelete: (record: CrmRecord) => void }) {
  const [openActionId, setOpenActionId] = useState<string>();
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('Todos');
  const contacts = records.filter((record) => record.kind === 'contact').length;
  const leads = records.filter((record) => record.kind === 'lead').length;
  const clients = records.filter((record) => record.kind === 'contact' && record.relationship === 'Cliente').length;
  const qualified = records.filter((record) => record.kind === 'lead' && record.leadStatus === 'Qualificado').length;
  const converted = records.filter((record) => record.kind === 'lead' && record.leadStatus === 'Convertido').length;
  const summary = [['Total de contatos', String(contacts)], ['Clientes', String(clients)], ['Leads', String(leads)], ['Qualificados', String(qualified)], ['Convertidos', String(converted)]];
  const normalizedQuery=query.trim().toLowerCase();
  const visible=records.filter(record=>{
    if(tab==='contacts'&&record.kind!=='contact')return false;
    if(tab==='leads'&&record.kind!=='lead')return false;
    const haystack=`${record.fullName} ${record.email} ${record.phone} ${record.whatsapp} ${record.city} ${record.state} ${record.source}`.toLowerCase();
    if(normalizedQuery&&!haystack.includes(normalizedQuery))return false;
    if(filter==='Todos')return true;
    if(record.kind==='contact')return record.relationship===filter;
    return record.leadStatus===filter;
  });
  const changeTab=(next:CrmTab)=>{setTab(next);setFilter('Todos');setQuery('');setOpenActionId(undefined)};
  const filters=tab==='contacts'?RELATIONSHIP_OPTIONS:LEAD_STATUS_OPTIONS;

  return <section className="crm-directory" onClick={() => setOpenActionId(undefined)}>
    <section className="crm-directory-summary" aria-label="Resumo do relacionamento">{summary.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <div className="crm-directory-tabs" role="tablist" aria-label="CRM"><button type="button" role="tab" aria-selected={tab === 'contacts'} className={tab === 'contacts' ? 'is-active' : ''} onClick={() => changeTab('contacts')}>Contatos <small>{contacts}</small></button><button type="button" role="tab" aria-selected={tab === 'leads'} className={tab === 'leads' ? 'is-active' : ''} onClick={() => changeTab('leads')}>Leads <small>{leads}</small></button></div>
    <div className="crm-directory-toolbar"><label className="crm-directory-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Buscar" value={query} onChange={event=>setQuery(event.target.value)} placeholder={tab === 'contacts' ? 'Buscar por nome, e-mail, telefone ou cidade' : 'Buscar lead por nome, origem, e-mail ou telefone'} /></label><select aria-label="Filtrar registros" value={filter} onChange={event=>setFilter(event.target.value)}><option>Todos</option><Options values={filters}/></select></div>
    <div className="crm-directory-table"><div className="crm-directory-table__head"><span>Nome</span><span>{tab === 'contacts' ? 'Relacionamento' : 'Origem'}</span><span>Status</span><span>E-mail / telefone</span><span>{tab === 'contacts' ? 'Cidade' : 'Próxima ação'}</span><span>Ações</span></div>{visible.length === 0 ? <div className="crm-directory-list"><p>Nenhum {tab === 'contacts' ? 'contato' : 'lead'} encontrado.</p></div> : visible.map((record) => <div className="crm-directory-row" key={record.id}><div><strong>{displayName(record)}</strong><small>{record.kind === 'contact' ? record.relationship : record.interest}</small></div><span>{record.kind === 'contact' ? record.relationship : record.source}</span><span><b className="crm-status-pill">{record.kind === 'contact' ? record.contactStatus : record.leadStatus}</b></span><div><strong>{record.email}</strong><small>{record.whatsapp || record.phone}</small></div><span>{record.kind === 'contact' ? [record.city, record.state].filter(Boolean).join(' / ') : record.nextAction || '—'}</span><div className="crm-row-actions" onClick={(event) => event.stopPropagation()}><button className="crm-actions-trigger" type="button" aria-label={`Ações de ${displayName(record)}`} aria-haspopup="menu" aria-expanded={openActionId === record.id} onClick={() => setOpenActionId((current) => current === record.id ? undefined : record.id)}>⋯</button>{openActionId === record.id && <div className="crm-actions-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionId(undefined); openModal('view', record.kind, record); }}>Ver</button><button type="button" role="menuitem" onClick={() => { setOpenActionId(undefined); openModal('edit', record.kind, record); }}>Editar</button><button type="button" role="menuitem" className="is-danger" onClick={() => { setOpenActionId(undefined); onDelete(record); }}>Excluir</button></div>}</div></div>)}</div>
  </section>;
}

export function CrmApp() {
  const [tab, setTab] = useState<CrmTab>('contacts');
  const [records, setRecords] = useState<CrmRecord[]>(() => getCrmInitialRecords());
  const [modal, setModal] = useState<{ mode: ModalMode; kind: RecordKind; record?: CrmRecord }>();
  const openModal = (mode: ModalMode, kind: RecordKind, record?: CrmRecord) => setModal({ mode, kind, record });
  const saveRecord = (draft: CrmRecordDraft) => { const now = new Date().toISOString(); if (modal?.record) setRecords((current) => current.map((record) => record.id === modal.record?.id ? { ...record, ...draft, updatedAt: now } : record)); else if (modal) setRecords((current) => [...current, { ...draft, id: crypto.randomUUID(), kind: modal.kind, createdAt: now, updatedAt: now }]); setModal(undefined); };
  const deleteRecord = (record: CrmRecord) => { if (!window.confirm(`Excluir ${record.kind === 'contact' ? 'o contato' : 'o lead'} ${displayName(record)}?`)) return; setRecords((current) => current.filter((item) => item.id !== record.id)); };
  return <div className="crm-shell"><div className="crm-workspace"><header className="crm-topbar"><div><small>VISA FÁCIL · CRM</small><h1>CRM</h1><p>Central de relacionamento operacional.</p></div><div className="crm-topbar-actions"><button type="button" aria-label="Alertas" title="Nenhum alerta disponível" disabled><BellIcon/></button><div className="crm-user" aria-label="Administrador"><span>VF</span><div><strong>Administrador</strong><small>Autenticação desativada</small></div></div></div></header><main className="crm-content"><RelationshipCrm tab={tab} setTab={setTab} records={records} openModal={openModal} onDelete={deleteRecord} /></main></div>{modal && <RecordModal mode={modal.mode} kind={modal.kind} record={modal.record} onClose={() => setModal(undefined)} onSave={saveRecord} onEdit={() => setModal((current) => current?.record ? { ...current, mode: 'edit' } : current)} />}</div>;
}

export default CrmApp;
