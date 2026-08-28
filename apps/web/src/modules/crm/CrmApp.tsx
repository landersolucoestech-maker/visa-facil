import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import './crm-relationship-layout.css';
import './crm-record-modals.css';
import { getCrmSessionRecords, getOperationalTeamMembers, saveCrmSessionRecords, type OperationalTeamMember } from '../../shared/operationalSessionStore';
import type { CrmRecord, CrmRecordDraft, CrmTab, ModalMode, RecordKind } from './types';

const SERVICE_OPTIONS = ['Assessoria para visto de turismo', 'Renovação de visto', 'Visto de estudante', 'Visto de trabalho', 'Visto de negócios', 'Outro'];
const DESTINATION_OPTIONS = ['Estados Unidos', 'Canadá', 'Outro'];
const VISA_TYPE_OPTIONS = ['B1/B2', 'F-1', 'J-1', 'H-1B', 'L-1', 'O-1', 'EB', 'Outro'];
const SOURCE_OPTIONS = ['Website', 'WhatsApp', 'Instagram', 'Facebook', 'Indicação', 'Google', 'Outro'];
const RELATIONSHIP_OPTIONS = ['Cliente', 'Parceiro', 'Outro'];
const CONTACT_STATUS_OPTIONS = ['Ativo', 'Inativo'];
const LEAD_STATUS_OPTIONS = ['Novo', 'Em contato', 'Qualificado', 'Não qualificado', 'Convertido', 'Perdido'];
const LEAD_EDITABLE_STATUS_OPTIONS = LEAD_STATUS_OPTIONS.filter((status) => status !== 'Convertido');
const TEMPERATURE_OPTIONS = ['Frio', 'Morno', 'Quente'];

const EMPTY_DRAFT: CrmRecordDraft = {
  fullName: '', cpf: '', rg: '', passportNumber: '', email: '', phone: '', whatsapp: '', city: '', state: '', country: 'Brasil', notes: '',
  relationship: 'Cliente', contactStatus: 'Ativo', source: 'Website', owner: '', ownerUserId: '', interest: '', destination: '', visaType: '',
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

function OwnerField({draft,set,members}:{draft:CrmRecordDraft;set:(key:keyof CrmRecordDraft,value:string)=>void;members:OperationalTeamMember[]}){
  const unavailable=Boolean(draft.ownerUserId)&&!members.some((member)=>member.id===draft.ownerUserId);
  return <Field label="Responsável"><select value={draft.ownerUserId||''} onChange={(event)=>{const id=event.target.value;const member=members.find((item)=>item.id===id);set('ownerUserId',id);set('owner',member?.name||'')}}><option value="">Não atribuído</option>{unavailable&&<option value={draft.ownerUserId}>{draft.owner||'Usuário indisponível'} · indisponível</option>}{members.map((member)=><option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}</select></Field>;
}

function normalizeRecordIdentity(value:string){return value.trim().toLocaleLowerCase('pt-BR')}
function normalizeDigits(value:string){return value.replace(/\D/g,'')}
function normalizePassport(value:string){return value.replace(/\s+/g,'').toLocaleUpperCase('pt-BR')}
function identityPairs(record:Pick<CrmRecord,'email'|'cpf'|'passportNumber'|'whatsapp'>|Pick<CrmRecordDraft,'email'|'cpf'|'passportNumber'|'whatsapp'>){
  return [
    ['e-mail',normalizeRecordIdentity(record.email)],
    ['CPF',normalizeDigits(record.cpf)],
    ['passaporte',normalizePassport(record.passportNumber)],
    ['WhatsApp',normalizeDigits(record.whatsapp)],
  ] as const;
}
function samePerson(left:Pick<CrmRecord,'email'|'cpf'|'passportNumber'|'whatsapp'>|Pick<CrmRecordDraft,'email'|'cpf'|'passportNumber'|'whatsapp'>,right:Pick<CrmRecord,'email'|'cpf'|'passportNumber'|'whatsapp'>){
  const rightValues=new Map(identityPairs(right));
  return identityPairs(left).some(([field,value])=>value.length>0&&value===rightValues.get(field));
}
function duplicateMessage(draft:CrmRecordDraft,records:CrmRecord[],editing?:CrmRecord){
  const ignored=new Set<string>([editing?.id,editing?.convertedContactId,editing?.convertedFromLeadId].filter((id):id is string=>Boolean(id)));
  for(const record of records){
    if(ignored.has(record.id))continue;
    const recordValues=new Map(identityPairs(record));
    for(const [field,value] of identityPairs(draft)){
      if(value&&value===recordValues.get(field))return `Já existe ${record.kind==='lead'?'um lead':'um contato'} com o mesmo ${field}: ${displayName(record)}.`;
    }
  }
  return '';
}

function RecordForm({ kind, initial, members, onCancel, onSubmit }: { kind: RecordKind; initial: CrmRecordDraft; members:OperationalTeamMember[]; onCancel: () => void; onSubmit: (draft: CrmRecordDraft) => string | undefined }) {
  const [draft, setDraft] = useState<CrmRecordDraft>(initial);
  const [error,setError]=useState('');
  const set = (key: keyof CrmRecordDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const convertedLead=kind==='lead'&&initial.leadStatus==='Convertido';
  return <form className="crm-record-form" onSubmit={(event) => { event.preventDefault(); if (!draft.fullName.trim() || !draft.email.trim()) return; const result=onSubmit(draft);setError(result||''); }}>
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
      {kind === 'contact' ? <><Field label="Status"><select value={draft.contactStatus} onChange={(event) => set('contactStatus', event.target.value)}><Options values={CONTACT_STATUS_OPTIONS}/></select></Field><Field label="Origem do contato"><select value={draft.source} onChange={(event) => set('source', event.target.value)}><Options values={SOURCE_OPTIONS}/></select></Field><OwnerField draft={draft} set={set} members={members}/></> : <><Field label="Status do lead"><select value={draft.leadStatus} disabled={convertedLead} onChange={(event) => set('leadStatus', event.target.value)}>{convertedLead&&<option value="Convertido">Convertido · via conversão</option>}<Options values={LEAD_EDITABLE_STATUS_OPTIONS}/></select></Field><Field label="Temperatura"><select value={draft.temperature} onChange={(event) => set('temperature', event.target.value)}><Options values={TEMPERATURE_OPTIONS}/></select></Field><OwnerField draft={draft} set={set} members={members}/><Field label="Próxima ação"><input value={draft.nextAction} onChange={(event) => set('nextAction', event.target.value)} /></Field><Field label="Data da próxima ação"><input type="date" value={draft.nextActionDate} onChange={(event) => set('nextActionDate', event.target.value)} /></Field></>}
      <Field label="Observações"><textarea rows={4} value={draft.notes} onChange={(event) => set('notes', event.target.value)} placeholder="Observações importantes..." /></Field>
    </div></div>
    {error&&<p className="crm-inline-error" role="alert">{error}</p>}
    <div className="crm-form-actions"><button type="button" className="crm-btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="crm-btn-primary">Salvar {kind === 'contact' ? 'contato' : 'lead'}</button></div>
  </form>;
}

function DetailItem({ label, value }: { label: string; value?: string }) { return <div className="crm-view-item"><span>{label}</span><strong>{value || '—'}</strong></div>; }
function RecordView({ record, onClose, onEdit, onConvert, titleId }: { record: CrmRecord; onClose: () => void; onEdit: () => void; onConvert:()=>void; titleId: string }) {
  const status = record.kind === 'contact' ? record.contactStatus : record.leadStatus;
  const name = displayName(record);
  return <div className="crm-view-record"><div className="crm-view-hero"><div className="crm-view-avatar">{name.slice(0, 2).toUpperCase()}</div><div className="crm-view-identity"><span>{record.kind === 'contact' ? 'CONTATO' : 'LEAD'}</span><h2 id={titleId}>{name}</h2><p>{record.email} · {record.whatsapp || record.phone || 'Sem telefone'}</p><div className="crm-view-badges"><b>{status}</b>{record.kind === 'lead' && <b className="is-warm">{record.temperature}</b>}{record.source && <b className="is-source">{record.source}</b>}</div></div><button className="crm-view-close" type="button" onClick={onClose} aria-label="Fechar">×</button></div>
    {record.kind === 'lead' && <div className="crm-view-commercial"><div><span>Status comercial</span><strong>{record.leadStatus}</strong></div><div><span>Interesse</span><strong>{record.interest || 'Não informado'}</strong></div><div><span>Responsável</span><strong>{record.owner || 'Não definido'}</strong></div><div><span>Próxima ação</span><strong>{record.nextAction || 'Não definida'}</strong><small>{record.nextActionDate || ''}</small></div></div>}
    {record.kind==='lead'&&record.convertedContactId&&<section className="crm-view-note"><span>CONVERSÃO</span><p>Lead convertido e vinculado ao contato/cliente <strong>{record.convertedContactId}</strong>{record.convertedAt?` em ${new Date(record.convertedAt).toLocaleString('pt-BR')}`:''}.</p></section>}
    {record.kind==='contact'&&record.convertedFromLeadId&&<section className="crm-view-note"><span>ORIGEM DA CONVERSÃO</span><p>Cliente criado a partir do lead <strong>{record.convertedFromLeadId}</strong>.</p></section>}
    <section className="crm-view-section"><div className="crm-view-section__title"><span>01</span><div><strong>Identificação pessoal</strong><small>Dados cadastrais e documentos.</small></div></div><div className="crm-view-grid"><DetailItem label="Nome completo" value={record.fullName} /><DetailItem label="CPF" value={record.cpf} /><DetailItem label="RG" value={record.rg} /><DetailItem label="Número do passaporte" value={record.passportNumber} /></div></section>
    <section className="crm-view-section"><div className="crm-view-section__title"><span>02</span><div><strong>Contato e localização</strong><small>Informações para relacionamento.</small></div></div><div className="crm-view-grid"><DetailItem label="E-mail" value={record.email} /><DetailItem label="Telefone" value={record.phone} /><DetailItem label="WhatsApp" value={record.whatsapp} /><DetailItem label="Cidade" value={record.city} /><DetailItem label="Estado" value={record.state} /><DetailItem label="País" value={record.country} /></div></section>
    <section className="crm-view-section"><div className="crm-view-section__title"><span>03</span><div><strong>{record.kind === 'contact' ? 'Relacionamento e interesse' : 'Qualificação'}</strong><small>Contexto operacional.</small></div></div><div className="crm-view-grid">{record.kind === 'contact' ? <><DetailItem label="Relacionamento" value={record.relationship} /><DetailItem label="Interesse / Serviço" value={record.interest} /><DetailItem label="Destino" value={record.destination} /><DetailItem label="Tipo de visto" value={record.visaType} /><DetailItem label="Origem" value={record.source} /><DetailItem label="Responsável" value={record.owner} /></> : <><DetailItem label="Origem" value={record.source} /><DetailItem label="Interesse / Serviço" value={record.interest} /><DetailItem label="Destino" value={record.destination} /><DetailItem label="Tipo de visto" value={record.visaType} /><DetailItem label="Temperatura" value={record.temperature} /><DetailItem label="Responsável" value={record.owner} /></>}</div></section>
    <section className="crm-view-note"><span>OBSERVAÇÕES</span><p>{record.notes || 'Nenhuma observação registrada.'}</p></section><div className="crm-view-footer"><div><small>Criado em {new Date(record.createdAt).toLocaleString('pt-BR')}</small><small>Atualizado em {new Date(record.updatedAt).toLocaleString('pt-BR')}</small></div><button type="button" className="crm-btn-secondary" onClick={onClose}>Fechar</button>{record.kind==='lead'&&!record.convertedContactId&&<button type="button" className="crm-btn-secondary" onClick={onConvert}>Converter em cliente</button>}<button type="button" className="crm-btn-primary" onClick={onEdit}>Editar</button></div>
  </div>;
}

function RecordModal({ mode, kind, record, members, onClose, onSave, onEdit, onConvert }: { mode: ModalMode; kind: RecordKind; record?: CrmRecord; members:OperationalTeamMember[]; onClose: () => void; onSave: (draft: CrmRecordDraft) => string|undefined; onEdit: () => void; onConvert:()=>void }) {
  const titleId=useId();
  useEffect(()=>{const closeOnEscape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose()}};document.addEventListener('keydown',closeOnEscape);return()=>document.removeEventListener('keydown',closeOnEscape)},[onClose]);
  if (mode === 'view' && record) return <div className="crm-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="crm-view-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}><RecordView record={record} onClose={onClose} onEdit={onEdit} onConvert={onConvert} titleId={titleId} /></div></div>;
  const draft:CrmRecordDraft={...EMPTY_DRAFT,...record};
  if(!draft.ownerUserId&&draft.owner){const match=members.find((member)=>normalizeRecordIdentity(member.name)===normalizeRecordIdentity(draft.owner||''));if(match)draft.ownerUserId=match.id}
  return <div className="crm-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="crm-form-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}><header><div><span>{mode === 'create' ? 'NOVO REGISTRO' : 'EDITAR REGISTRO'}</span><h2 id={titleId}>{mode === 'create' ? 'Novo' : 'Editar'} {kind === 'contact' ? 'contato' : 'lead'}</h2><p>Cadastre os dados da pessoa atendida.</p></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header><RecordForm kind={kind} initial={draft} members={members} onCancel={onClose} onSubmit={onSave} /></div></div>;
}

type KpiCardData={label:string;value:number;helper:string};
function safePercent(value:number,total:number){return total>0?(value/total)*100:0}
function formatPercent(value:number){return `${new Intl.NumberFormat('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:1}).format(Number.isFinite(value)?value:0)}%`}
function createdWithinLast30Days(record:CrmRecord){
  const createdAt=new Date(record.createdAt).getTime();
  if(!Number.isFinite(createdAt))return false;
  const now=Date.now();
  const thirtyDays=30*24*60*60*1000;
  return createdAt<=now&&createdAt>=now-thirtyDays;
}
function KpiCard({label,value,helper}:{label:string;value:number;helper:string}){return <article className="crm-kpi-card"><span>{label}</span><strong>{value}</strong><small>{helper}</small></article>}

function RelationshipCrm({ tab, setTab, records, openModal, onDelete, onConvert }: { tab: CrmTab; setTab: (tab: CrmTab) => void; records: CrmRecord[]; openModal: (mode: ModalMode, kind: RecordKind, record?: CrmRecord) => void; onDelete: (record: CrmRecord) => void; onConvert:(record:CrmRecord)=>void }) {
  const [openActionId, setOpenActionId] = useState<string>();
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('Todos');
  const contactRecords=records.filter((record)=>record.kind==='contact');
  const leadRecords=records.filter((record)=>record.kind==='lead');
  const contacts=contactRecords.length;
  const leads=leadRecords.length;
  const contactsWithCompany=0;
  const activeClients=contactRecords.filter((record)=>record.relationship==='Cliente'&&record.contactStatus==='Ativo').length;
  const newContacts=contactRecords.filter(createdWithinLast30Days).length;
  const newLeads=leadRecords.filter(createdWithinLast30Days).length;
  const leadsInProgress=leadRecords.filter((record)=>!record.convertedContactId&&record.leadStatus!=='Convertido'&&record.leadStatus!=='Perdido').length;
  const qualifiedLeads=leadRecords.filter((record)=>record.leadStatus==='Qualificado').length;
  const convertedLeads=leadRecords.filter((record)=>Boolean(record.convertedContactId)||record.leadStatus==='Convertido').length;
  const conversionRate=safePercent(convertedLeads,leads);
  const summary:KpiCardData[]=tab==='contacts'?[{
    label:'Total de contatos',value:contacts,helper:contacts===0?'Nenhum contato cadastrado':`+${newContacts} nos últimos 30 dias`,
  },{
    label:'Com empresa',value:contactsWithCompany,helper:`${formatPercent(safePercent(contactsWithCompany,contacts))} dos contatos`,
  },{
    label:'Clientes ativos',value:activeClients,helper:`${formatPercent(safePercent(activeClients,contacts))} dos contatos`,
  },{
    label:'Novos contatos',value:newContacts,helper:'Nos últimos 30 dias',
  }]:[{
    label:'Total de leads',value:leads,helper:leads===0?'Nenhum lead cadastrado':`+${newLeads} nos últimos 30 dias`,
  },{
    label:'Em andamento',value:leadsInProgress,helper:`${formatPercent(safePercent(leadsInProgress,leads))} do total`,
  },{
    label:'Qualificados',value:qualifiedLeads,helper:`${formatPercent(safePercent(qualifiedLeads,leads))} do total`,
  },{
    label:'Convertidos',value:convertedLeads,helper:`${formatPercent(conversionRate)} de conversão`,
  }];
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
  const handleTabKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next:CrmTab=event.key==='ArrowLeft'||event.key==='Home'?'contacts':'leads';changeTab(next);requestAnimationFrame(()=>document.getElementById(`crm-directory-tab-${next}`)?.focus())};
  useEffect(()=>{if(!openActionId)return;const closeOnEscape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape')setOpenActionId(undefined)};document.addEventListener('keydown',closeOnEscape);return()=>document.removeEventListener('keydown',closeOnEscape)},[openActionId]);

  return <section className="crm-directory" onClick={() => setOpenActionId(undefined)}>
    <section className="crm-directory-summary" aria-label={`Resumo de ${tab==='contacts'?'contatos':'leads'}`}>{summary.map((item)=><KpiCard key={item.label} {...item}/>)}</section>
    <div className="crm-directory-tabs" role="tablist" aria-label="CRM" onKeyDown={handleTabKeyDown}><button id="crm-directory-tab-contacts" type="button" role="tab" aria-selected={tab === 'contacts'} aria-controls="crm-directory-table" tabIndex={tab==='contacts'?0:-1} className={tab === 'contacts' ? 'is-active' : ''} onClick={() => changeTab('contacts')}>Contatos <small>{contacts}</small></button><button id="crm-directory-tab-leads" type="button" role="tab" aria-selected={tab === 'leads'} aria-controls="crm-directory-table" tabIndex={tab==='leads'?0:-1} className={tab === 'leads' ? 'is-active' : ''} onClick={() => changeTab('leads')}>Leads <small>{leads}</small></button></div>
    <div className="crm-directory-toolbar"><label className="crm-directory-search"><span className="crm-directory-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><input type="search" aria-label="Buscar" value={query} onChange={event=>setQuery(event.target.value)} placeholder={tab === 'contacts' ? 'Buscar por nome, e-mail, telefone ou cidade' : 'Buscar lead por nome, origem, e-mail ou telefone'} /></label><select aria-label="Filtrar registros" value={filter} onChange={event=>setFilter(event.target.value)}><option>Todos</option><Options values={filters}/></select></div>
    <div className="crm-directory-table" id="crm-directory-table" role="tabpanel" aria-labelledby={`crm-directory-tab-${tab}`}><div className="crm-directory-table__head"><span>Nome</span><span>{tab === 'contacts' ? 'Relacionamento' : 'Origem'}</span><span>Status</span><span>E-mail / telefone</span><span>{tab === 'contacts' ? 'Cidade' : 'Próxima ação'}</span><span>Ações</span></div>{visible.length === 0 ? <div className="crm-directory-list"><p>Nenhum {tab === 'contacts' ? 'contato' : 'lead'} encontrado.</p></div> : visible.map((record) => <div className="crm-directory-row" key={record.id}><div><strong>{displayName(record)}</strong><small>{record.kind === 'contact' ? record.relationship : record.interest}</small></div><span>{record.kind === 'contact' ? record.relationship : record.source}</span><span><b className="crm-status-pill">{record.kind === 'contact' ? record.contactStatus : record.leadStatus}</b></span><div><strong>{record.email}</strong><small>{record.whatsapp || record.phone}</small></div><span>{record.kind === 'contact' ? [record.city, record.state].filter(Boolean).join(' / ') : record.nextAction || '—'}</span><div className="crm-row-actions" onClick={(event) => event.stopPropagation()}><button className="crm-actions-trigger" type="button" aria-label={`Ações de ${displayName(record)}`} aria-haspopup="menu" aria-expanded={openActionId === record.id} onClick={() => setOpenActionId((current) => current === record.id ? undefined : record.id)}>⋯</button>{openActionId === record.id && <div className="crm-actions-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setOpenActionId(undefined); openModal('view', record.kind, record); }}>Ver</button><button type="button" role="menuitem" onClick={() => { setOpenActionId(undefined); openModal('edit', record.kind, record); }}>Editar</button>{record.kind==='lead'&&!record.convertedContactId&&<button type="button" role="menuitem" onClick={()=>{setOpenActionId(undefined);onConvert(record)}}>Converter em cliente</button>}<button type="button" role="menuitem" className="is-danger" onClick={() => { setOpenActionId(undefined); onDelete(record); }}>Excluir</button></div>}</div></div>)}</div>
  </section>;
}

export function CrmApp() {
  const [tab, setTab] = useState<CrmTab>('contacts');
  const [records, setRecords] = useState<CrmRecord[]>(() => getCrmSessionRecords());
  const [modal, setModal] = useState<{ mode: ModalMode; kind: RecordKind; record?: CrmRecord }>();
  const teamMembers=useMemo(()=>getOperationalTeamMembers(),[]);
  useEffect(() => { saveCrmSessionRecords(records); }, [records]);
  const openModal = (mode: ModalMode, kind: RecordKind, record?: CrmRecord) => setModal({ mode, kind, record });
  const saveRecord = (draft: CrmRecordDraft) => {
    const owner=draft.ownerUserId?teamMembers.find((member)=>member.id===draft.ownerUserId):undefined;
    if(draft.ownerUserId&&!owner)return 'Selecione um responsável ativo cadastrado em Configurações → Usuários.';
    if(draft.owner?.trim()&&!draft.ownerUserId)return 'O responsável precisa ser selecionado a partir dos usuários ativos.';
    const duplicate=duplicateMessage(draft,records,modal?.record);
    if(duplicate)return duplicate;
    const canonicalDraft={...draft,owner:owner?.name||'',ownerUserId:owner?.id||''};
    const now = new Date().toISOString();
    if (modal?.record) setRecords((current) => current.map((record) => record.id === modal.record?.id ? { ...record, ...canonicalDraft, updatedAt: now } : record));
    else if (modal) setRecords((current) => [...current, { ...canonicalDraft, id: crypto.randomUUID(), kind: modal.kind, createdAt: now, updatedAt: now }]);
    setModal(undefined);
    return undefined;
  };
  const convertLead=(lead:CrmRecord)=>{
    if(lead.kind!=='lead'||lead.convertedContactId)return;
    const now=new Date().toISOString();
    const existing=records.find((record)=>record.kind==='contact'&&samePerson(lead,record));
    const contact:CrmRecord=existing?{...existing,relationship:'Cliente',contactStatus:'Ativo',updatedAt:now}:{
      id:crypto.randomUUID(),kind:'contact',fullName:lead.fullName,cpf:lead.cpf,rg:lead.rg,passportNumber:lead.passportNumber,email:lead.email,phone:lead.phone,whatsapp:lead.whatsapp,
      city:lead.city,state:lead.state,country:lead.country,notes:lead.notes,relationship:'Cliente',contactStatus:'Ativo',source:lead.source||'',owner:lead.owner||'',ownerUserId:lead.ownerUserId||'',
      interest:lead.interest||'',destination:lead.destination||'',visaType:lead.visaType||'',createdAt:now,updatedAt:now,convertedFromLeadId:lead.id,
    };
    const convertedLead:CrmRecord={...lead,leadStatus:'Convertido',convertedContactId:contact.id,convertedAt:now,updatedAt:now,nextAction:'',nextActionDate:''};
    setRecords((current)=>{
      const without=current.filter((record)=>record.id!==lead.id&&record.id!==contact.id);
      return [...without,contact,convertedLead];
    });
    setTab('contacts');
    setModal({mode:'view',kind:'contact',record:contact});
  };
  const deleteRecord = (record: CrmRecord) => {
    const linked=record.kind==='lead'?Boolean(record.convertedContactId):records.some((item)=>item.kind==='lead'&&item.convertedContactId===record.id);
    if(linked){window.alert('Este registro participa de uma conversão de lead para cliente e não pode ser excluído isoladamente.');return}
    if (!window.confirm(`Excluir ${record.kind === 'contact' ? 'o contato' : 'o lead'} ${displayName(record)}?`)) return;
    setRecords((current) => current.filter((item) => item.id !== record.id));
  };
  const createKind:RecordKind=tab==='contacts'?'contact':'lead';
  return <div className="crm-shell"><div className="crm-workspace"><header className="crm-topbar"><div><small>VISA FÁCIL · CRM</small><h1>CRM</h1><p>Central de relacionamento operacional.</p></div><div className="crm-topbar-actions"><button className="crm-topbar-primary" type="button" onClick={()=>openModal('create',createKind)}>+ Novo {createKind==='contact'?'contato':'lead'}</button><button type="button" aria-label="Alertas" title="Nenhum alerta disponível" disabled><BellIcon/></button></div></header><main className="crm-content"><RelationshipCrm tab={tab} setTab={setTab} records={records} openModal={openModal} onDelete={deleteRecord} onConvert={convertLead} /></main></div>{modal && <RecordModal mode={modal.mode} kind={modal.kind} record={modal.record} members={teamMembers} onClose={() => setModal(undefined)} onSave={saveRecord} onEdit={() => setModal((current) => current?.record ? { ...current, mode: 'edit' } : current)} onConvert={()=>{if(modal.record)convertLead(modal.record)}} />}</div>;
}

export default CrmApp;