import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './table-view-pagination.css';

type PaginationConfig = {
  paths: string[];
  containerSelector: string;
  rowSelector: string;
  label: string;
};

const PAGE_SIZE = 10;

const CONFIGS: PaginationConfig[] = [
  { paths: ['/crm/relacionamento'], containerSelector: '.crm-directory', rowSelector: '.crm-directory-row', label: 'CRM' },
  { paths: ['/crm/tarefas'], containerSelector: '.tasks-card', rowSelector: '.tasks-row', label: 'Tarefas' },
  { paths: ['/crm/contratos', '/crm/contratos/templates', '/crm/contratos/variaveis'], containerSelector: '.contracts-panel', rowSelector: '.contracts-table tbody tr', label: 'Contratos' },
  { paths: ['/crm/financeiro', '/crm/financeiro/transacoes'], containerSelector: '.finance-transactions-card', rowSelector: '.finance-transactions-table .finance-row', label: 'Transações' },
  { paths: ['/crm/financeiro/invoices'], containerSelector: '.invoice-list-card', rowSelector: '.invoice-table .invoice-table-row', label: 'Faturamento' },
  { paths: ['/crm/marketing/briefings'], containerSelector: '.marketing-briefings-card', rowSelector: '.marketing-briefings-card .marketing-briefing-row', label: 'Briefings' },
  { paths: ['/crm/marketing/campanhas'], containerSelector: '.marketing-table-card', rowSelector: '.marketing-table-card .marketing-table-row--campaign', label: 'Campanhas' },
  { paths: ['/crm/marketing/tarefas'], containerSelector: '.tasks-card', rowSelector: '.tasks-row', label: 'Tarefas de Marketing' },
];

function basePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base === '/' ? '' : base;
}

function currentPath() {
  const base = basePath();
  const pathname = window.location.pathname;
  const path = !base
    ? pathname
    : pathname === base
      ? '/'
      : pathname.startsWith(`${base}/`)
        ? pathname.slice(base.length) || '/'
        : pathname;
  return path.replace(/\/+$/, '') || '/';
}

function activeConfig() {
  const path = currentPath();
  return CONFIGS.find((config) => config.paths.includes(path));
}

function rowIdentity(row: HTMLElement, index: number) {
  const action = row.querySelector<HTMLElement>('button[aria-label^="Ações"]');
  return action?.getAttribute('aria-label') || row.getAttribute('data-id') || `${index}:${row.textContent?.trim().slice(0, 120) ?? ''}`;
}

function applyPage(rows: HTMLElement[], page: number) {
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  rows.forEach((row, index) => { row.hidden = index < start || index >= end; });
}

export function TableViewPagination() {
  const config = activeConfig();
  const [mount, setMount] = useState<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const rowsRef = useRef<HTMLElement[]>([]);
  const signatureRef = useRef('');

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    let frame = 0;
    let observer: MutationObserver | undefined;
    let paginationMount: HTMLDivElement | undefined;

    const attach = () => {
      if (cancelled) return;
      const container = document.querySelector<HTMLElement>(config.containerSelector);
      if (!container) {
        frame = window.requestAnimationFrame(attach);
        return;
      }

      paginationMount = document.createElement('div');
      paginationMount.className = 'tableview-pagination-mount';
      paginationMount.dataset.paginationFor = config.label;
      container.insertAdjacentElement('beforeend', paginationMount);
      setMount(paginationMount);

      const sync = () => {
        const rows = Array.from(document.querySelectorAll<HTMLElement>(config.rowSelector));
        rowsRef.current = rows;
        const signature = rows.map(rowIdentity).join('|');
        const changed = signature !== signatureRef.current;
        signatureRef.current = signature;
        const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        const nextPage = changed ? 1 : Math.min(pageRef.current, pageCount);
        if (nextPage !== pageRef.current) {
          pageRef.current = nextPage;
          setPage(nextPage);
        }
        setTotal(rows.length);
        applyPage(rows, nextPage);
      };

      sync();
      observer = new MutationObserver(sync);
      observer.observe(container, { childList: true, subtree: true });
    };

    attach();
    return () => {
      cancelled = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      rowsRef.current.forEach((row) => { row.hidden = false; });
      paginationMount?.remove();
      rowsRef.current = [];
      signatureRef.current = '';
      pageRef.current = 1;
      setMount(null);
      setPage(1);
      setTotal(0);
    };
  }, [config?.containerSelector, config?.label, config?.rowSelector]);

  if (!config || !mount) return null;

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);
  const changePage = (next: number) => {
    const bounded = Math.max(1, Math.min(next, pageCount));
    pageRef.current = bounded;
    setPage(bounded);
    applyPage(rowsRef.current, bounded);
  };

  return createPortal(
    <nav className="tableview-pagination" aria-label={`Paginação de ${config.label}`}>
      <span className="tableview-pagination__summary">{first}–{last} de {total}</span>
      <div className="tableview-pagination__controls">
        <button type="button" aria-label="Primeira página" title="Primeira página" disabled={page === 1} onClick={() => changePage(1)}>«</button>
        <button type="button" aria-label="Página anterior" title="Página anterior" disabled={page === 1} onClick={() => changePage(page - 1)}>‹</button>
        <span className="tableview-pagination__page" aria-live="polite">Página {page} de {pageCount}</span>
        <button type="button" aria-label="Próxima página" title="Próxima página" disabled={page === pageCount} onClick={() => changePage(page + 1)}>›</button>
        <button type="button" aria-label="Última página" title="Última página" disabled={page === pageCount} onClick={() => changePage(pageCount)}>»</button>
      </div>
    </nav>,
    mount,
  );
}

export default TableViewPagination;
