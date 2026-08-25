import { useState } from 'react';
import { Card, Field, INITIAL_INTEGRATIONS, type Integration, StatusBadge, MiniModal } from './settingsShared';

export function SecurityTab(){
 const [show,setShow]=useState(false);const [twoFactor,setTwoFactor]=useState(false);const [notice,setNotice]=useState('');const [passwords,setPasswords]=useState({current:'',next:'',confirm:''});
 const change=()=>{if(passwords.next.length<6)return setNotice('A nova senha precisa ter pelo menos 6 caracteres.');if(passwords.next!==passwords.confirm)return setNotice('As senhas não coincidem.');setPasswords({current:'',next:'',confirm:''});setNotice('Senha atualizada no protótipo.')};
 return <Card title="Segurança da Conta" description="Gerencie a segurança e acesso da sua conta" icon="◈">
  <div className="settings-security-block"><h3>Alterar Senha</h3><div className="settings-form-grid"><Field label="Senha Atual"><div className="settings-password"><input type={show?'text':'password'} value={passwords.current} onChange={e=>setPasswords(c=>({...c,current:e.target.value}))} placeholder="••••••••"/><button onClick={()=>setShow(v=>!v)} type="button">{show?'◉':'○'}</button></div></Field><div/><Field label="Nova Senha"><input type="password" value={passwords.next} onChange={e=>setPasswords(c=>({...c,next:e.target.value}))} placeholder="••••••••"/></Field><Field label="Confirmar Nova Senha"><input type="password" value={passwords.confirm} onChange={e=>setPasswords(c=>({...c,confirm:e.target.value}))} placeholder="••••••••"/></Field></div><button className="settings-btn settings-btn-outline" onClick={change}>⌘ Alterar Senha</button>{notice&&<p className="settings-security-notice">{notice}</p>}</div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3>Autenticação em Duas Etapas</h3><div className="settings-security-row"><div className="settings-security-row-icon">▯</div><div><strong>Autenticação 2FA</strong><p>Adicione uma camada extra de segurança</p></div><button className="settings-btn settings-btn-outline" onClick={()=>setTwoFactor(v=>!v)}>{twoFactor?'Desativar':'Configurar'}</button></div></div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3>Sessões Ativas</h3><div className="settings-security-row"><div className="settings-security-row-icon is-green">▰</div><div><strong>Sessão Atual</strong><p>Chrome · Windows · Brasil</p></div><span className="settings-status is-conectado">Ativa</span></div><button className="settings-btn settings-btn-outline is-danger-text">Encerrar Todas as Outras Sessões</button></div>
  <div className="settings-divider"/>
  <div className="settings-security-block"><h3 className="is-danger-text">Zona de Perigo</h3><div className="settings-danger-row"><div><strong>Excluir Conta</strong><p>Esta ação é irreversível</p></div><button className="settings-btn settings-btn-danger">⌫ Excluir</button></div></div>
 </Card>;
}

export function IntegrationsTab(){
 const [items,setItems]=useState(INITIAL_INTEGRATIONS);const [selected,setSelected]=useState<Integration>();const categories=Array.from(new Set(items.map(i=>i.category)));
 const toggle=(item:Integration)=>{if(item.status==='Conectado')setItems(c=>c.map(i=>i.id===item.id?{...i,status:'Não conectado'}:i));else setSelected(item)};
 const connect=()=>{if(!selected)return;setItems(c=>c.map(i=>i.id===selected.id?{...i,status:'Conectado'}:i));setSelected(undefined)};
 return <><Card title="Integrações" description="Conecte e configure as integrações específicas deste workspace. Essas conexões pertencem apenas a este cliente." icon="↗">
  {categories.map(category=><div className="settings-integration-category" key={category}><div className="settings-integration-category-title"><span>◈</span><strong>{category}</strong></div>{items.filter(i=>i.category===category).map(item=><div className="settings-integration-row" key={item.id}><div className="settings-integration-logo">{item.icon}</div><div className="settings-integration-copy"><strong>{item.name}</strong><p>{item.description}</p></div><div className="settings-integration-actions"><StatusBadge status={item.status}/><button className={`settings-btn settings-btn-outline ${item.status==='Conectado'?'is-danger-text':''}`} onClick={()=>toggle(item)}>{item.status==='Conectado'?'Desconectar':item.status==='Reconexão necessária'?'Reconectar':'Configurar'} ↗</button></div></div>)}</div>)}
  <div className="settings-integrations-footer"><p>Não encontrou a integração que precisa?</p><button className="settings-btn settings-btn-outline">Solicitar Nova Integração</button></div>
 </Card>{selected&&<MiniModal title={selected.name} description={`Configure a integração ${selected.name} para este workspace.`} close={()=>setSelected(undefined)} footer={<><button className="settings-btn settings-btn-outline" onClick={()=>setSelected(undefined)}>Cancelar</button><button className="settings-btn settings-btn-primary" onClick={connect}>Conectar</button></>}><div className="settings-form-grid"><Field label="Identificador / Conta"><input placeholder="Informe a conta ou identificador"/></Field><Field label="Chave / Token"><input type="password" placeholder="••••••••••••"/></Field></div><div className="settings-info-box">As credenciais exibidas aqui são apenas campos de protótipo e não são enviadas para nenhum serviço externo.</div></MiniModal>}</>;
}

