import { useMemo, useState } from 'react';
import type { Client } from '../../clients/types/client';
import { DESTINATION_LABELS, PROCESS_STAGE_LABELS, type VisaProcess } from '../../processes/types/process';
import type { ManagementTask } from '../../tasks/types/task';

type GlobalSearchProps = { clients: Client[]; processes: VisaProcess[]; tasks: ManagementTask[]; onNavigate: (path: string) => void };
type SearchResult = { id: string; group: string; title: string; subtitle: string; path: string };

export function GlobalSearch({ clients, processes, tasks, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const results = useMemo<SearchResult[]>(() => {
    if (!normalized) return [];
    const clientResults = clients.filter((client)=>`${client.fullName} ${client.email} ${client.phone}`.toLowerCase().includes(normalized)).map((client)=>({id:`client-${client.id}`,group:'Cliente',title:client.fullName,subtitle:`${client.phone} · ${client.email}`,path:`/app/clientes/${encodeURIComponent(client.id)}`}));
    const processResults = processes.filter((process)=>{ const client=clients.find((item)=>item.id===process.clientId); return `${process.category} ${DESTINATION_LABELS[process.destination]} ${PROCESS_STAGE_LABELS[process.stage]} ${client?.fullName ?? ''}`.toLowerCase().includes(normalized); }).map((process)=>{ const client=clients.find((item)=>item.id===process.clientId); return {id:`process-${process.id}`,group:'Processo',title:process.category,subtitle:`${client?.fullName ?? 'Cliente'} · ${DESTINATION_LABELS[process.destination]} · ${PROCESS_STAGE_LABELS[process.stage]}`,path:`/app/processos/${encodeURIComponent(process.id)}`}; });
    const taskResults = tasks.filter((task)=>`${task.title} ${task.notes}`.toLowerCase().includes(normalized)).map((task)=>({id:`task-${task.id}`,group:'Tarefa',title:task.title,subtitle:task.status==='open'?'Aberta':'Concluída',path:'/app/tarefas'}));
    return [...clientResults,...processResults,...taskResults].slice(0,8);
  },[clients,processes,tasks,normalized]);

  function open(result: SearchResult){ onNavigate(result.path); setQuery(''); }
  return <div className="global-search"><span className="global-search__icon">⌕</span><input aria-label="Busca global" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Buscar cliente, processo ou tarefa..." />{normalized && <div className="global-search__popover">{results.length===0?<div className="global-search__empty">Nenhum resultado nesta sessão.</div>:results.map((result)=><button type="button" key={result.id} onClick={()=>open(result)}><span>{result.group}</span><div><strong>{result.title}</strong><small>{result.subtitle}</small></div></button>)}</div>}</div>;
}
