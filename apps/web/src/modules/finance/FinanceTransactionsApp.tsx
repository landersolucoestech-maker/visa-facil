import { useEffect, useMemo, useState } from 'react';
import './finance.css';
import { activeFinanceCategories } from './financeConfigStore';
import { type FinanceRecord, type FinanceStatus, type FinanceType } from './mocks/financeMockProvider';
import { getCrmSessionRecords, getFinanceSessionRecords, saveFinanceSessionRecords } from '../../shared/operationalSessionStore';
import type { CrmRecord } from '../crm/types';
import { localDateIso } from '../../shared/localDate';
import { OfxImportModal } from './OfxImportModal';

type Mode = 'create' | 'view' | 'edit';
type Draft = Omit<FinanceRecord, 'id'>;

const TYPES: Array<'Todos' | FinanceType> = ['Todos', 'Receita', 'Despesa'];
const STATUSES: Array<'Todos' | FinanceStatus> = ['Todos', 'Recebido', 'A receber', 'Pago', 'A pagar'];
const STATUS_BY_TYPE: Record<FinanceType, FinanceStatus[]> = {
  Receita: ['Recebido', 'A receber'],
  Despesa: ['Pago', 'A pagar'],
};
const DEFAULT_STATUS: Record<FinanceType, FinanceStatus> = { Receita: 'A receber', Despesa: 'A pagar' };
function categoryNames(type: FinanceType) { return activeFinanceCategories(type).map((category) => category.name); }
function defaultCategory(type: FinanceType) { return categoryNames(type)[0] ?? ''; }
function emptyDraft(): Draft { return { description: '', type: 'Receita', category: defaultCategory('Receita'), amount: 0, date: '', dueDate: '', status: 'A receber', paymentMethod: 'Pix', relatedName: '', relatedRecordId: '', notes: '' }; }

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const classNamePart = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
function basePath() { return import.meta.env.BASE_URL.replace(/\/$/, ''); }
function href(path: string) { return `${basePath()}${path}` || path; }
function normalized(value:string){return value.trim().toLocaleLowerCase('pt-BR')}

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}
function PlusIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function UploadIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function SlidersIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M10 14v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }

function isValidStatus(type: FinanceType, status: FinanceStatus) {
  return STATUS_BY_TYPE[type].includes(status);
}

function TransactionModal({ mode, record, crmRecords, close, save }: { mode: Mode; record?: FinanceRecord; crmRecords:CrmRecord[]; close: () => void; save: (draft: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>(() => record ? {
    description: record.description,
    type: record.type,
    category: record.category,
    amount: record.amount,
    date: record.date,
    dueDate: record.dueDate,
    status: isValidStatus(record.type, record.status) ? record.status : DEFAULT_STATUS[record.type],
    paymentMethod: record.paymentMethod,
    relatedName: record.relatedName,
    relatedRecordId: record.relatedRecordId ?? '',
    notes: record.notes,
  } : emptyDraft());
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const changeType = (next: FinanceType) => setDraft((current) => ({ ...current, type: next, category: categoryNames(next).includes(current.category) ? current.category : defaultCategory(next), status: isValidStatus(next, current.status) ? current.status : DEFAULT_STATUS[next] }));
  const activeModalCategories = categoryNames(draft.type);
  const preservesHistoricalCategory = Boolean(record && draft.type === record.type && record.category && !activeModalCategories.includes(record.category));
  const modalCategories = preservesHistoricalCategory ? [record!.category, ...activeModalCategories] : activeModalCategories;
  const relationRecords=crmRecords.filter(item=>item.kind==='contact');
  const resolvedRelationId=draft.relatedRecordId||relationRecords.find(item=>normalized(item.fullName)===normalized(draft.relatedName))?.id||'';
  const relationUnavailable=Boolean(draft.relatedName)&&!resolvedRelationId;
  const changeRelation=(id:string)=>{const related=relationRecords.find(item=>item.id===id);setDraft(current=>({...current,relatedRecordId:id,relatedName:related?.fullName??(id==='__legacy__'?current.relatedName:'')}))};

  if (mode === 'view' && record) {
    return <div className="finance-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
      <div className="finance-view-modal finance-transaction-view-modal" role="dialog" aria-modal="true" aria-labelledby="finance-transaction-view-title">
        <header><div><span>TRANSAÇÃO</span><h2 id="finance-transaction-view-title">{record.description}</h2><p>{record.category} · {record.type}</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
        <section className="finance-view-summary">
          <div><span>Valor</span><strong className={record.type === 'Receita' ? 'is-income' : 'is-expense'}>{record.type === 'Despesa' ? '- ' : ''}{money(record.amount)}</strong></div>
          <div><span>Status</span><strong>{record.status}</strong></div>
          <div><span>Data</span><strong>{formatDate(record.date)}</strong></div>
          <div><span>Vencimento</span><strong>{formatDate(record.dueDate)}</strong></div>
        </section>
        <section className="finance-view-body"><dl className="finance-transaction-details"><div><dt>Forma de pagamento</dt><dd>{record.paymentMethod}</dd></div><div><dt>Cliente / contato</dt><dd>{record.relatedName || '—'}</dd></div><div><dt>Categoria</dt><dd>{record.category}</dd></div><div><dt>Tipo</dt><dd>{record.type}</dd></div></dl><div className="finance-view-notes"><span>Observações</span><p>{record.notes || 'Nenhuma observação cadastrada.'}</p></div></section>
        <footer><button className="crm-btn-secondary" type="button" onClick={close}>Fechar</button></footer>
      </div>
    </div>;
  }

  const invalidDueDate = Boolean(draft.date && draft.dueDate && draft.dueDate < draft.date);
  const invalid = !draft.description.trim() || draft.amount <= 0 || !draft.date || !draft.category || !isValidStatus(draft.type, draft.status) || invalidDueDate;
  return <div className="finance-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="finance-form-modal finance-transaction-form-modal" role="dialog" aria-modal="true" aria-labelledby="finance-transaction-form-title">
      <header><div><span>{mode === 'create' ? 'NOVA TRANSAÇÃO' : 'EDITAR TRANSAÇÃO'}</span><h2 id="finance-transaction-form-title">{mode === 'create' ? 'Adicionar transação' : 'Editar transação'}</h2><p>Registre os dados financeiros e o vínculo correspondente.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
      <form onSubmit={(event) => { event.preventDefault(); if (!invalid) save(draft); }}>
        <div className="finance-form-grid finance-transaction-form-grid">
          <label className="finance-field-wide"><span>Descrição</span><input required value={draft.description} onChange={(event) => set('description', event.target.value)} /></label>
          <label><span>Tipo</span><select value={draft.type} onChange={(event) => changeType(event.target.value as FinanceType)}><option>Receita</option><option>Despesa</option></select></label>
          <label><span>Categoria</span><select value={draft.category} onChange={(event) => set('category', event.target.value)} disabled={!modalCategories.length}>{modalCategories.length ? modalCategories.map((item) => <option key={item} value={item}>{item}{preservesHistoricalCategory && item === record?.category ? ' (inativa — histórico)' : ''}</option>) : <option value="">Nenhuma categoria ativa</option>}</select></label>
          <label><span>Valor</span><input required type="number" min="0.01" step="0.01" value={draft.amount || ''} onChange={(event) => set('amount', Number(event.target.value))} /></label>
          <label><span>Status</span><select value={draft.status} onChange={(event) => set('status', event.target.value as FinanceStatus)}>{STATUS_BY_TYPE[draft.type].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Data</span><input required type="date" value={draft.date} onChange={(event) => set('date', event.target.value)} /></label>
          <label><span>Vencimento</span><input type="date" min={draft.date || undefined} value={draft.dueDate} onChange={(event) => set('dueDate', event.target.value)} /></label>
          <label><span>Forma de pagamento</span><select value={draft.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value)}><option>Pix</option><option>Cartão</option><option>Boleto</option><option>Transferência</option><option>Dinheiro</option><option>OFX</option></select></label>
          <label className="finance-field-wide"><span>Cliente / contato relacionado</span><select value={relationUnavailable?'__legacy__':resolvedRelationId} onChange={(event)=>changeRelation(event.target.value)}><option value="">Sem vínculo</option>{relationUnavailable&&<option value="__legacy__">{draft.relatedName} · legado/indisponível</option>}{relationRecords.map(item=><option key={item.id} value={item.id}>{item.fullName}{item.email?` · ${item.email}`:''}</option>)}</select></label>
          <label className="finance-field-wide"><span>Observações</span><textarea rows={4} value={draft.notes} onChange={(event) => set('notes', event.target.value)} /></label>
        </div>
        {invalidDueDate && <p className="finance-inline-error" role="alert">O vencimento não pode ser anterior à data da transação.</p>}
        {preservesHistoricalCategory && <p className="finance-inline-error" role="status">A categoria histórica “{record?.category}” está inativa e foi preservada. Ela só será substituída se você alterar explicitamente o tipo ou a categoria.</p>}
        {!modalCategories.length && <p className="finance-inline-error" role="alert">Não existe categoria financeira ativa para {draft.type.toLowerCase()}. Cadastre uma categoria antes de salvar.</p>}
        <footer><button type="button" className="crm-btn-secondary" onClick={close}>Cancelar</button><button type="submit" className="crm-btn-primary" disabled={invalid}>Salvar transação</button></footer>
      </form>
    </div>
  </div>;
}

export function FinanceTransactionsApp() {
  const [records, setRecords] = useState<FinanceRecord[]>(() => getFinanceSessionRecords());
  const [query, setQuery] = useState('');
  const [type, setType] = useState('Todos');
  const [status, setStatus] = useState('Todos');
  const [category, setCategory] = useState('Todas');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [modal, setModal] = useState<{ mode: Mode; record?: FinanceRecord }>();
  const [menu, setMenu] = useState<string>();
  const [ofx, setOfx] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const crmRecords=useMemo(()=>getCrmSessionRecords(),[]);
  useEffect(() => { saveFinanceSessionRecords(records); }, [records]);

  const today = localDateIso();
  const activeCategories = activeFinanceCategories();
  const filterCategories = useMemo(() => ['Todas', ...Array.from(new Set([...activeCategories.map((item) => item.name), ...records.map((record) => record.category).filter(Boolean)]))], [records, activeCategories]);
  const invalidPeriod = Boolean(start && end && end < start);
  const filtered = useMemo(() => invalidPeriod ? [] : records.filter((record) => {
    const normalizedQuery = query.trim().toLowerCase();
    return (!normalizedQuery || `${record.description} ${record.category} ${record.relatedName} ${record.paymentMethod}`.toLowerCase().includes(normalizedQuery))
      && (type === 'Todos' || record.type === type)
      && (status === 'Todos' || record.status === status)
      && (category === 'Todas' || record.category === category)
      && (!start || record.date >= start)
      && (!end || record.date <= end);
  }), [records, query, type, status, category, start, end, invalidPeriod]);

  const received = records.filter((record) => record.type === 'Receita' && record.status === 'Recebido').reduce((sum, record) => sum + record.amount, 0);
  const paid = records.filter((record) => record.type === 'Despesa' && record.status === 'Pago').reduce((sum, record) => sum + record.amount, 0);
  const receivable = records.filter((record) => record.type === 'Receita' && record.status === 'A receber').reduce((sum, record) => sum + record.amount, 0);
  const payable = records.filter((record) => record.type === 'Despesa' && record.status === 'A pagar').reduce((sum, record) => sum + record.amount, 0);
  const balance = received - paid;
  const pendingRecords = records.filter((record) => record.status === 'A receber' || record.status === 'A pagar');
  const overdueRecords = pendingRecords.filter((record) => record.dueDate && record.dueDate < today);
  const dueTodayRecords = pendingRecords.filter((record) => record.dueDate === today);
  const alertRecords = [...overdueRecords, ...dueTodayRecords].slice(0, 5);

  const save = (draft: Draft) => {
    if (modal?.record) setRecords((current) => current.map((record) => record.id === modal.record!.id ? { ...record, ...draft } : record));
    else setRecords((current) => [{ ...draft, id: crypto.randomUUID() }, ...current]);
    setModal(undefined);
  };
  const remove = (record: FinanceRecord) => {
    if (window.confirm(`Excluir a transação “${record.description}”?`)) setRecords((current) => current.filter((item) => item.id !== record.id));
    setMenu(undefined);
  };
  const clearFilters = () => { setQuery(''); setType('Todos'); setStatus('Todos'); setCategory('Todas'); setStart(''); setEnd(''); };
  const hasFilters = Boolean(query || type !== 'Todos' || status !== 'Todos' || category !== 'Todas' || start || end);

  return <div className="crm-shell finance-shell finance-transactions-shell" onClick={() => { setMenu(undefined); setNotifications(false); }} onKeyDown={(event)=>{if(event.key==='Escape'){setMenu(undefined);setNotifications(false);if(modal)setModal(undefined);if(ofx)setOfx(false)}}}>
    <div className="crm-workspace finance-transactions-workspace">
      <header className="crm-topbar finance-transactions-topbar">
        <div><small>VISA FÁCIL · CRM · FINANCEIRO</small><h1>Transações</h1><p>Receitas, despesas, contas a pagar e contas a receber.</p></div>
        <div className="crm-topbar-actions finance-header-actions" onClick={(event) => event.stopPropagation()}>
          <a className="finance-ofx-button finance-header-nav-button" href={href('/crm/categorias-financeiras')}>Categorias</a>
          <a className="finance-ofx-button finance-header-nav-button" href={href('/crm/regras-financeiras')}>Regras</a>
          <button className="finance-ofx-button" type="button" onClick={() => setOfx(true)}><UploadIcon />Importar OFX</button>
          <button className="crm-topbar-primary finance-new-transaction" type="button" onClick={() => setModal({ mode: 'create' })}><PlusIcon />Nova transação</button>
          <div className="finance-topbar-menu"><button className="finance-notification-button" type="button" aria-label="Alertas" aria-expanded={notifications} onClick={() => setNotifications((value) => !value)}><BellIcon />{alertRecords.length > 0 && <span className="finance-notification-count">{alertRecords.length}</span>}</button>{notifications && <div className="finance-dropdown finance-notifications"><header><strong>Notificações</strong><span>{alertRecords.length}</span></header>{alertRecords.length ? <div>{alertRecords.map((record) => <button key={record.id} type="button" onClick={() => { setNotifications(false); setModal({ mode: 'view', record }); }}><strong>{record.description}</strong><small>{record.dueDate < today ? 'Vencida' : 'Vence hoje'} · {record.status} · {money(record.amount)}</small></button>)}</div> : <p>Nenhuma pendência financeira para hoje.</p>}</div>}</div>
        </div>
      </header>

      <main className="finance-content finance-transactions-content">
        <section className="finance-stats finance-transaction-stats">
          <article><span>Receitas recebidas</span><strong>{money(received)}</strong><small>Entradas confirmadas</small></article>
          <article><span>Despesas pagas</span><strong>{money(paid)}</strong><small>Saídas confirmadas</small></article>
          <article><span>Contas a receber</span><strong>{money(receivable)}</strong><small>{records.filter((record) => record.status === 'A receber').length} pendentes</small></article>
          <article><span>Contas a pagar</span><strong>{money(payable)}</strong><small>{records.filter((record) => record.status === 'A pagar').length} pendentes</small></article>
          <article className={balance < 0 ? 'is-alert' : ''}><span>Saldo operacional</span><strong>{money(balance)}</strong><small>Receitas − despesas</small></article>
        </section>

        <section className="finance-card finance-transactions-card">
          <div className="finance-filters finance-transaction-filters">
            <label className="finance-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar descrição, categoria, cliente ou pagamento" /></label>
            <div className="finance-filter-dates"><label><span>De</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label><label><span>Até</span><input type="date" min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)} /></label></div>
            <select aria-label="Tipo" value={type} onChange={(event) => setType(event.target.value)}>{TYPES.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="Categoria" value={category} onChange={(event) => setCategory(event.target.value)}>{filterCategories.map((item) => <option key={item}>{item}</option>)}</select>
            <button className="finance-clear-filters" type="button" disabled={!hasFilters} onClick={clearFilters}><SlidersIcon />Limpar</button>
          </div>
          {invalidPeriod && <p className="finance-inline-error" role="alert">O período é inválido: a data final deve ser posterior ou igual à data inicial.</p>}
          <div className="finance-table-meta"><span>{filtered.length} {filtered.length === 1 ? 'transação' : 'transações'}</span>{overdueRecords.length > 0 && <strong>{overdueRecords.length} {overdueRecords.length === 1 ? 'vencida' : 'vencidas'}</strong>}</div>
          <div className="finance-table finance-transactions-table">
            <div className="finance-table-head"><span>Descrição</span><span>Categoria</span><span>Tipo</span><span>Valor</span><span>Data</span><span>Vencimento</span><span>Status</span><span>Ações</span></div>
            {filtered.length ? filtered.map((record) => <div className="finance-row" key={record.id}>
              <div data-label="Descrição"><strong>{record.description}</strong><small>{record.relatedName || 'Sem vínculo'}</small></div>
              <span data-label="Categoria">{record.category}</span><span data-label="Tipo"><b className={`finance-type is-${classNamePart(record.type)}`}>{record.type}</b></span>
              <strong data-label="Valor" className={record.type === 'Receita' ? 'finance-income' : 'finance-expense'}>{record.type === 'Despesa' ? '- ' : ''}{money(record.amount)}</strong>
              <span data-label="Data">{formatDate(record.date)}</span><span data-label="Vencimento" className={record.dueDate && record.dueDate < today && (record.status === 'A receber' || record.status === 'A pagar') ? 'is-overdue' : ''}>{formatDate(record.dueDate)}</span>
              <span data-label="Status"><b className={`finance-status is-${classNamePart(record.status)}`}>{record.status}</b></span>
              <div className="finance-row-actions" data-label="Ações" onClick={(event) => event.stopPropagation()}><button className="finance-actions-trigger" type="button" aria-label={`Ações de ${record.description}`} aria-haspopup="menu" aria-expanded={menu === record.id} onClick={() => setMenu((current) => current === record.id ? undefined : record.id)}>⋯</button>{menu === record.id && <div className="finance-actions-menu" role="menu"><button type="button" role="menuitem" onClick={() => { setMenu(undefined); setModal({ mode: 'view', record }); }}>Ver</button><button type="button" role="menuitem" onClick={() => { setMenu(undefined); setModal({ mode: 'edit', record }); }}>Editar</button><button type="button" role="menuitem" className="is-danger" onClick={() => remove(record)}>Excluir</button></div>}</div>
            </div>) : <div className="finance-empty"><strong>Nenhuma transação encontrada</strong><span>Ajuste os filtros ou adicione uma nova transação.</span></div>}
          </div>
        </section>
      </main>
    </div>

    {modal && <TransactionModal mode={modal.mode} record={modal.record} crmRecords={crmRecords} close={() => setModal(undefined)} save={save} />}
    {ofx && <OfxImportModal existingIds={records.map((record) => record.id)} close={() => setOfx(false)} imported={(incoming) => { setRecords((current) => [...incoming, ...current]); setOfx(false); }} />}
  </div>;
}

export default FinanceTransactionsApp;