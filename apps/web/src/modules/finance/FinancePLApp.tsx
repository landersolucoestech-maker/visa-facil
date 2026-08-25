import { useMemo, useState } from 'react';
import './finance-accounting.css';
import { getFinanceInitialRecords, type FinanceRecord } from './mocks/financeMockProvider';
import invoiceMocks from './mocks/invoices.dev.json';

type Entry = { id: string; kind: 'Receita' | 'Despesa'; category: string; description: string; amount: number; date: string };
type InvoiceLike = {
  id: string;
  invoiceNumber: string;
  customer: string;
  issueDate: string;
  serviceFee: number;
  consularFee: number;
  translationFee: number;
  courierFee: number;
  thirdPartyFee: number;
  otherCharges: number;
  discounts: number;
  tax: number;
  status: string;
};

type AccountingAlert = { id: string; title: string; detail: string; tone: 'danger' | 'neutral' };

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const compactDate = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const invoiceTotal = (invoice: InvoiceLike) => Math.max(0,
  invoice.serviceFee + invoice.consularFee + invoice.translationFee + invoice.courierFee + invoice.thirdPartyFee + invoice.otherCharges - invoice.discounts + invoice.tax,
);

function BellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export function FinancePLApp() {
  const records = useMemo<FinanceRecord[]>(() => getFinanceInitialRecords(), []);
  const invoices = useMemo<InvoiceLike[]>(() => invoiceMocks as InvoiceLike[], []);
  const today = new Date().toISOString().slice(0, 10);

  const [start, setStart] = useState(`${today.slice(0, 7)}-01`);
  const [end, setEnd] = useState(today);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('Todos');
  const [notifications, setNotifications] = useState(false);
  const [user, setUser] = useState(false);

  const entries = useMemo<Entry[]>(() => {
    const invoiceRevenue = invoices
      .filter((invoice) => invoice.status !== 'Cancelada')
      .map((invoice) => ({
        id: `inv-${invoice.id}`,
        kind: 'Receita' as const,
        category: 'Receita de serviços',
        description: `${invoice.invoiceNumber} · ${invoice.customer}`,
        amount: invoiceTotal(invoice),
        date: invoice.issueDate,
      }))
      .filter((entry) => entry.amount > 0);

    const transactionRevenue = records
      .filter((record) => record.type === 'Receita' && record.status === 'Recebido')
      .map((record) => ({ id: `rec-${record.id}`, kind: 'Receita' as const, category: record.category || 'Receita', description: record.description, amount: record.amount, date: record.date }));

    const expenses = records
      .filter((record) => record.type === 'Despesa' && record.status === 'Pago')
      .map((record) => ({ id: `exp-${record.id}`, kind: 'Despesa' as const, category: record.category || 'Despesa operacional', description: record.description, amount: record.amount, date: record.date }));

    return [...invoiceRevenue, ...transactionRevenue, ...expenses];
  }, [records, invoices]);

  const invalidPeriod = Boolean(start && end && start > end);
  const filtered = useMemo(() => {
    if (invalidPeriod) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return entries.filter((entry) =>
      (!start || entry.date >= start) &&
      (!end || entry.date <= end) &&
      (kind === 'Todos' || entry.kind === kind) &&
      (!normalizedQuery || `${entry.category} ${entry.description}`.toLowerCase().includes(normalizedQuery)),
    );
  }, [entries, start, end, kind, query, invalidPeriod]);

  const revenue = filtered.filter((entry) => entry.kind === 'Receita').reduce((sum, entry) => sum + entry.amount, 0);
  const expense = filtered.filter((entry) => entry.kind === 'Despesa').reduce((sum, entry) => sum + entry.amount, 0);
  const net = revenue - expense;
  const margin = revenue ? (net / revenue) * 100 : 0;

  const grouped = (target: 'Receita' | 'Despesa') => {
    const map = new Map<string, number>();
    filtered.filter((entry) => entry.kind === target).forEach((entry) => map.set(entry.category, (map.get(entry.category) || 0) + entry.amount));
    return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  };

  const revenueGroups = grouped('Receita');
  const expenseGroups = grouped('Despesa');
  const hasFilters = Boolean(query.trim() || kind !== 'Todos');

  const alerts = useMemo<AccountingAlert[]>(() => {
    const items: AccountingAlert[] = [];
    if (invalidPeriod) items.push({ id: 'invalid-period', title: 'Período inválido', detail: 'A data inicial está depois da data final.', tone: 'danger' });
    else if (!filtered.length) items.push({ id: 'empty-period', title: 'Sem movimentações', detail: 'Nenhum lançamento reconhecido no período selecionado.', tone: 'neutral' });
    if (!invalidPeriod && filtered.length && net < 0) items.push({ id: 'negative-result', title: 'Resultado negativo', detail: `Prejuízo de ${money(Math.abs(net))} no período.`, tone: 'danger' });
    return items;
  }, [filtered.length, invalidPeriod, net]);

  const clearFilters = () => {
    setQuery('');
    setKind('Todos');
  };

  return <div className="crm-shell finance-accounting-shell accounting-workspace" onClick={() => { setNotifications(false); setUser(false); }}>
    <div className="crm-workspace accounting-workspace-main">
      <header className="crm-topbar accounting-topbar">
        <div className="accounting-topbar-copy">
          <small>VISA FÁCIL · CRM · FINANCEIRO</small>
          <h1>Contabilidade</h1>
          <p>Receitas, despesas e resultado consolidado da operação.</p>
        </div>
        <div className="crm-topbar-actions accounting-topbar-actions" onClick={(event) => event.stopPropagation()}>
          <div className="accounting-topbar-menu">
            <button className="accounting-notification-button" type="button" aria-label="Notificações da contabilidade" aria-expanded={notifications} onClick={() => { setNotifications((current) => !current); setUser(false); }}>
              <BellIcon />
              {alerts.length > 0 && <span>{alerts.length}</span>}
            </button>
            {notifications && <div className="accounting-dropdown accounting-notification-menu">
              <header><strong>Notificações</strong><span>{alerts.length}</span></header>
              {alerts.length ? <div>{alerts.map((alert) => <article className={alert.tone === 'danger' ? 'is-danger' : ''} key={alert.id}><strong>{alert.title}</strong><small>{alert.detail}</small></article>)}</div> : <p>Nenhum alerta contábil no período.</p>}
            </div>}
          </div>
          <div className="accounting-topbar-menu">
            <button className="crm-user accounting-user" type="button" onClick={() => { setUser((current) => !current); setNotifications(false); }}>
              <span>VF</span><div><strong>Administrador</strong><small>Protótipo frontend</small></div><span className="crm-user-caret">⌄</span>
            </button>
            {user && <div className="accounting-dropdown accounting-user-dropdown"><button type="button">Perfil</button><button type="button">Configurações</button><button className="is-danger" type="button">Logout</button></div>}
          </div>
        </div>
      </header>

      <main className="finance-content accounting-content">
        <section className="accounting-kpis">
          <article><span>Receita total</span><strong>{money(revenue)}</strong><small>Receitas reconhecidas no período</small></article>
          <article><span>Despesas totais</span><strong>{money(expense)}</strong><small>Custos e despesas reconhecidos</small></article>
          <article className={net < 0 ? 'is-alert' : ''}><span>Resultado líquido</span><strong className={net < 0 ? 'is-negative' : ''}>{net < 0 ? '-' : ''}{money(Math.abs(net))}</strong><small>Receita menos despesas</small></article>
          <article><span>Margem líquida</span><strong>{margin.toFixed(1)}%</strong><small>Resultado líquido sobre receita</small></article>
        </section>

        <section className="accounting-toolbar" aria-label="Filtros da contabilidade">
          <label className="accounting-date-field"><span>De</span><input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
          <label className="accounting-date-field"><span>Até</span><input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
          <label className="accounting-search"><span>Buscar</span><div><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Categoria ou descrição" /></div></label>
          <label className="accounting-kind-field"><span>Tipo</span><select value={kind} onChange={(event) => setKind(event.target.value)}><option>Todos</option><option>Receita</option><option>Despesa</option></select></label>
          <button className="accounting-clear" type="button" disabled={!hasFilters} onClick={clearFilters}>Limpar</button>
        </section>

        {invalidPeriod && <div className="accounting-inline-alert" role="alert"><strong>Período inválido.</strong><span>A data inicial deve ser anterior ou igual à data final.</span></div>}

        <section className="accounting-report-card">
          <header className="accounting-report-header">
            <div><h2>Demonstrativo de resultado</h2><p>Receitas e despesas consolidadas para o período selecionado.</p></div>
            <div className="accounting-period-summary"><span>{compactDate(start)} — {compactDate(end)}</span><strong>{filtered.length} {filtered.length === 1 ? 'lançamento' : 'lançamentos'}</strong></div>
          </header>

          <div className="accounting-table">
            <div className="accounting-table-head"><span>Categoria</span><span>Valor</span><span>% da receita</span></div>

            <div className="accounting-group-title"><span>Receitas</span><strong>{revenueGroups.length} {revenueGroups.length === 1 ? 'categoria' : 'categorias'}</strong></div>
            {revenueGroups.length ? revenueGroups.map((row) => <div className="accounting-table-row" key={`revenue-${row.category}`}><span>{row.category}</span><strong className="is-positive">+{money(row.amount)}</strong><span>{revenue ? ((row.amount / revenue) * 100).toFixed(1) : '0.0'}%</span></div>) : <div className="accounting-empty-row">Nenhuma receita reconhecida no período.</div>}
            <div className="accounting-table-total"><strong>Receita total</strong><strong>{money(revenue)}</strong><strong>{revenue ? '100.0%' : '0.0%'}</strong></div>

            <div className="accounting-group-title"><span>Despesas</span><strong>{expenseGroups.length} {expenseGroups.length === 1 ? 'categoria' : 'categorias'}</strong></div>
            {expenseGroups.length ? expenseGroups.map((row) => <div className="accounting-table-row" key={`expense-${row.category}`}><span>{row.category}</span><strong className="is-negative">-{money(row.amount)}</strong><span>{revenue ? ((row.amount / revenue) * 100).toFixed(1) : '0.0'}%</span></div>) : <div className="accounting-empty-row">Nenhuma despesa reconhecida no período.</div>}
            <div className="accounting-table-total"><strong>Despesas totais</strong><strong className="is-negative">-{money(expense)}</strong><strong>{revenue ? ((expense / revenue) * 100).toFixed(1) : '0.0'}%</strong></div>

            <div className="accounting-table-net"><strong>Resultado líquido</strong><strong className={net < 0 ? 'is-negative' : 'is-positive'}>{net < 0 ? '-' : '+'}{money(Math.abs(net))}</strong><strong>{margin.toFixed(1)}%</strong></div>
          </div>
        </section>
      </main>
    </div>
  </div>;
}

export default FinancePLApp;
