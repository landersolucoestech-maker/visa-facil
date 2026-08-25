import { Card, INITIAL_INTEGRATIONS, StatusBadge } from './settingsShared';
import { AUTHENTICATION_ENABLED } from '../auth/auth';

export function SecurityTab(){
 return <Card title="Segurança da Conta" description="Estado das proteções de acesso deste ambiente" icon="◈">
  <div className="settings-info-box">
   {AUTHENTICATION_ENABLED
    ? 'A autenticação está habilitada. As operações de segurança dependem do provedor configurado.'
    : 'A autenticação está desativada neste ambiente. Alteração de senha, 2FA, gestão de sessões e exclusão de conta permanecem indisponíveis até existir um provedor de autenticação real.'}
  </div>
  <div className="settings-security-block"><h3>Credenciais</h3><div className="settings-security-row"><div className="settings-security-row-icon">▯</div><div><strong>Senha e autenticação em duas etapas</strong><p>Requer um provedor de autenticação server-side.</p></div><button className="settings-btn settings-btn-outline" type="button" disabled>Indisponível</button></div></div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3>Sessões</h3><div className="settings-security-row"><div className="settings-security-row-icon">▰</div><div><strong>Gerenciamento de sessões</strong><p>Não há sessão autenticada de backend para inspecionar ou revogar.</p></div><span className="settings-status is-indisponivel">Indisponível</span></div></div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3 className="is-danger-text">Conta</h3><div className="settings-danger-row"><div><strong>Exclusão de conta</strong><p>Disponível somente quando identidade e autorização estiverem conectadas a um backend.</p></div><button className="settings-btn settings-btn-danger" type="button" disabled>Indisponível</button></div></div>
 </Card>;
}

export function IntegrationsTab(){
 const categories=Array.from(new Set(INITIAL_INTEGRATIONS.map(item=>item.category)));
 return <Card title="Integrações" description="Conectores previstos para este workspace" icon="↗">
  <div className="settings-info-box">Este repositório não contém backend, armazenamento seguro de credenciais nem adapters de API externos. Por segurança, nenhuma integração pode ser marcada como conectada a partir desta interface.</div>
  {categories.map(category=><div className="settings-integration-category" key={category}><div className="settings-integration-category-title"><span>◈</span><strong>{category}</strong></div>{INITIAL_INTEGRATIONS.filter(item=>item.category===category).map(item=><div className="settings-integration-row" key={item.id}><div className="settings-integration-logo">{item.icon}</div><div className="settings-integration-copy"><strong>{item.name}</strong><p>{item.description}</p></div><div className="settings-integration-actions"><StatusBadge status={item.status}/><button className="settings-btn settings-btn-outline" type="button" disabled>Configurar</button></div></div>)}</div>)}
 </Card>;
}
