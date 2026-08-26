import { useState } from 'react';
import { INITIAL_USERS, INITIAL_ROLES, type Role, initials, Card, MiniModal } from './settingsShared';
import { AUTHENTICATION_ENABLED } from '../auth/auth';

export function UsersTab(){
 const [roleModal,setRoleModal]=useState<Role>();
 const users=INITIAL_USERS;
 const roles=INITIAL_ROLES;
 const accessControlEnabled=AUTHENTICATION_ENABLED;
 const metrics=[['Usuários de referência',String(users.length),'♙'],['Convites Pendentes','0','✉'],['Papéis de referência',String(roles.length),'◈'],['Permissões declaradas',String(new Set(roles.flatMap(role=>role.permissions)).size),'⌘']];
 return <>
  {!accessControlEnabled&&<div className="settings-info-box">Autenticação e autorização estão desativadas. Os usuários e papéis abaixo são apenas referências de interface e não concedem, restringem ou persistem acesso real.</div>}
  <div className="settings-user-metrics">{metrics.map(([label,value,icon])=><article key={label}><span>{icon} {label}</span><strong>{value}</strong></article>)}</div>
  <Card title="Equipe" description="Referência de usuários prevista para o controle de acesso" icon="♙">
   <div className="settings-user-list">{users.map(user=><div className={`settings-user-row ${user.status==='Pendente'?'is-pending':''}`} key={user.id}><span className="settings-user-avatar">{initials(user.name)}</span><div className="settings-user-copy"><strong>{user.name}</strong><p>{user.email}</p></div><select value={user.role} disabled aria-label={`Papel de ${user.name}`}><option>{user.role}</option></select><select value={user.status} disabled aria-label={`Status de ${user.name}`}><option>{user.status}</option></select><button className="settings-icon-danger" type="button" disabled aria-label={`Remover ${user.name}`}>×</button></div>)}</div>
  </Card>
  <Card title="Papéis e Permissões" description="Modelo de permissões ainda não aplicado por uma camada de autorização" icon="◈"><div className="settings-role-list">{roles.map(role=><div className="settings-role-row" key={role.id}><span className="settings-role-icon">◈</span><div><strong>{role.name}</strong><p>{role.description}</p></div><button className="settings-btn settings-btn-ghost" type="button" onClick={()=>setRoleModal(role)}>Ver permissões ›</button></div>)}</div></Card>
  {roleModal&&<MiniModal title={`Permissões · ${roleModal.name}`} description="Permissões declarativas de referência; ainda não existe enforcement de autorização no frontend ou backend." close={()=>setRoleModal(undefined)} footer={<button className="settings-btn settings-btn-primary" onClick={()=>setRoleModal(undefined)}>Concluir</button>}><div className="settings-permission-grid">{['CRM','Atendimentos','Tarefas','Agenda','Contratos','Financeiro','Marketing','Relatórios','Configurações'].map(permission=><label key={permission}><input type="checkbox" checked={roleModal.permissions.includes('Todos os módulos')||roleModal.permissions.includes(permission)} readOnly/><span>{permission}</span></label>)}</div></MiniModal>}
 </>;
}
