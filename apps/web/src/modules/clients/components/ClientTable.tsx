import { CLIENT_STATUS_LABELS, type Client } from '../types/client';

type ClientTableProps = { clients: Client[] };

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) return <div className="management-empty-state client-empty-state"><span className="client-empty-state__icon">VF</span><strong>Nenhum cliente encontrado.</strong><span>Use “Novo cliente” para iniciar o primeiro cadastro desta sessão.</span></div>;

  return (
    <div className="management-table-wrap">
      <table className="management-table">
        <thead><tr><th>Cliente</th><th>Contato</th><th>Status</th><th>Criado em</th></tr></thead>
        <tbody>{clients.map((client) => <tr key={client.id}><td><strong>{client.fullName}</strong>{client.notes && <small>{client.notes}</small>}</td><td><span>{client.phone}</span><small>{client.email}</small></td><td><span className={`management-badge management-badge--${client.status}`}>{CLIENT_STATUS_LABELS[client.status]}</span></td><td>{new Date(client.createdAt).toLocaleDateString('pt-BR')}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
