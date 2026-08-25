import { useEffect, useState } from 'react';
import { INITIAL_COMPANY, INITIAL_AUTOMATIONS, type AutomationKey, Card, Field, Toggle, SettingRow, SettingsGroup, base } from './settingsShared';

const MAX_LOGO_BYTES=5*1024*1024;
const ALLOWED_LOGO_TYPES=new Set(['image/png','image/jpeg','image/webp']);

export function CompanyTab(){
 const [company,setCompany]=useState(INITIAL_COMPANY);
 const [snapshot,setSnapshot]=useState(INITIAL_COMPANY);
 const [editing,setEditing]=useState(false);
 const [logo,setLogo]=useState<string>();
 const [logoError,setLogoError]=useState('');
 const [saved,setSaved]=useState(false);
 useEffect(()=>()=>{if(logo)URL.revokeObjectURL(logo)},[logo]);
 const chooseLogo=(file?:File)=>{
  setLogoError('');
  if(!file)return;
  if(!ALLOWED_LOGO_TYPES.has(file.type)){setLogoError('Formato inválido. Use PNG, JPG ou WEBP.');return}
  if(file.size>MAX_LOGO_BYTES){setLogoError('A imagem excede o limite de 5 MB.');return}
  const next=URL.createObjectURL(file);
  setLogo(current=>{if(current)URL.revokeObjectURL(current);return next});
 };
 const begin=()=>{setSnapshot(company);setEditing(true);setSaved(false)};
 const cancel=()=>{setCompany(snapshot);setEditing(false)};
 const save=()=>{setEditing(false);setSaved(true)};
 return <div className="settings-company-grid">
  <Card title="Identidade Visual" description="Prévia da identidade usada nesta sessão do protótipo" icon="◐" className="settings-identity-card">
   <div className="settings-identity">
    <label className="settings-logo-picker" title="Alterar logo"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>chooseLogo(event.target.files?.[0])}/>{logo?<img src={logo} alt="Logo da empresa"/>:<span>VF</span>}<i>⌁</i></label>
    <button type="button" className="settings-btn settings-btn-outline" onClick={()=>document.querySelector<HTMLInputElement>('.settings-logo-picker input')?.click()}>Alterar foto</button>
    <small className="settings-upload-help">PNG, JPG ou WEBP · Máx. 5 MB</small>{logoError&&<p className="settings-security-notice" role="alert">{logoError}</p>}
    <h3>{company.fantasyName||company.companyName}</h3><code>/cadastro/{company.slug||'seu-slug'}</code>
    <div className="settings-identity-meta"><div><span>CNPJ:</span><b>{company.cnpj||'Não informado'}</b></div><div><span>Telefone:</span><b>{company.phone||'Não informado'}</b></div><div><span>Responsável:</span><b>{company.responsible||'Não informado'}</b></div></div>
   </div>
  </Card>
  <Card title="Dados da Empresa" description="Informações de referência para documentos" icon="▣" className="settings-company-form-card" action={!editing?<button className="settings-btn settings-btn-outline" onClick={begin}>✎ Editar Dados</button>:undefined}>
   <div className="settings-form-grid">
    <Field label="Razão Social"><input disabled={!editing} value={company.companyName} onChange={event=>setCompany(current=>({...current,companyName:event.target.value}))}/></Field>
    <Field label="Nome Fantasia"><input disabled={!editing} value={company.fantasyName} onChange={event=>setCompany(current=>({...current,fantasyName:event.target.value}))}/></Field>
    <Field label="CNPJ"><input disabled={!editing} placeholder="00.000.000/0000-00" value={company.cnpj} onChange={event=>setCompany(current=>({...current,cnpj:event.target.value}))}/></Field>
    <Field label="Endereço Completo" help="Endereço utilizado em documentos e dados institucionais."><input disabled={!editing} value={company.address} placeholder="Rua, número, bairro, cidade/UF, CEP" onChange={event=>setCompany(current=>({...current,address:event.target.value}))}/></Field>
    <Field label="Telefone/WhatsApp"><input disabled={!editing} placeholder="(00) 00000-0000" value={company.phone} onChange={event=>setCompany(current=>({...current,phone:event.target.value}))}/></Field>
    <Field label="Responsável"><input disabled={!editing} value={company.responsible} onChange={event=>setCompany(current=>({...current,responsible:event.target.value}))}/></Field>
    <Field label="Slug da organização" help={`Link de cadastro: ${window.location.origin}${base()}/cadastro/${company.slug||'seu-slug'}`}><input disabled={!editing} value={company.slug} onChange={event=>setCompany(current=>({...current,slug:event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-')}))}/></Field>
   </div>
   {editing&&<div className="settings-form-actions"><button className="settings-btn settings-btn-primary" onClick={save}>Aplicar nesta sessão</button><button className="settings-btn settings-btn-outline" onClick={cancel}>Cancelar</button></div>}
   {saved&&<div className="settings-inline-success">✓ Alterações aplicadas apenas nesta sessão do frontend; não há persistência de empresa conectada.</div>}
  </Card>
 </div>;
}

export function AutomationsTab(){
 const [values,setValues]=useState(INITIAL_AUTOMATIONS);
 const [frequency,setFrequency]=useState('Imediato');
 const [time,setTime]=useState('09:00');
 const [saved,setSaved]=useState(false);
 const set=(key:AutomationKey,value:boolean)=>{setValues(current=>({...current,[key]:value}));setSaved(false)};
 return <Card title="Automações & Notificações" description="Preferências de interface; nenhum executor de automações está conectado" icon="⚡">
  <div className="settings-info-box">As opções abaixo não disparam e-mails, push, backups ou jobs. Elas servem apenas para modelar preferências enquanto não existe backend/worker responsável pela execução.</div>
  <div className="settings-section-block"><div className="settings-section-title"><span>◌</span><div><h3>Canais de Notificação</h3><p>Preferências previstas para futura integração</p></div></div><div className="settings-channel-grid"><div><span>✉</span><strong>E-mail</strong><Toggle checked={values.email} onChange={value=>set('email',value)}/></div><div className="is-disabled"><span>▯</span><strong>SMS</strong><Toggle checked={false} onChange={()=>{}} disabled/></div><div><span>◌</span><strong>Push/In-App</strong><Toggle checked={values.push} onChange={value=>set('push',value)}/></div></div></div>
  <div className="settings-divider"/>
  <SettingsGroup title="CRM & Atendimento" icon="◎"><SettingRow title="Novo lead criado" description="Preferência para futuro evento de novo lead" checked={values.newLead} onChange={value=>set('newLead',value)}/><SettingRow title="Próxima ação do lead" description="Preferência para futuros lembretes de follow-up" checked={values.leadFollowup} onChange={value=>set('leadFollowup',value)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Financeiro" icon="$"><SettingRow title="Movimentação financeira relevante" description="Preferência para futuros eventos financeiros" checked={values.financeMovement} onChange={value=>set('financeMovement',value)}/><SettingRow title="Resumo financeiro semanal" description="Preferência para futuro resumo financeiro" checked={values.weeklyFinance} onChange={value=>set('weeklyFinance',value)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Relatórios & Resumos" icon="□"><SettingRow title="Relatório semanal de atividades" description="Preferência para futuro resumo operacional" checked={values.weeklyReport} onChange={value=>set('weeklyReport',value)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Sistema" icon="↻"><SettingRow title="Alertas críticos do sistema" description="Preferência para futuros eventos de erro" checked={values.criticalAlerts} onChange={value=>set('criticalAlerts',value)}/><SettingRow title="Notificações operacionais" description="Preferência para futuras notificações in-app" checked={values.operational} onChange={value=>set('operational',value)}/><SettingRow title="Backup automático" description="Indisponível: não existe banco de dados ou rotina de backup neste repositório" checked={false} onChange={()=>{}} disabled/></SettingsGroup>
  <div className="settings-divider"/>
  <div className="settings-section-block"><div className="settings-section-title"><span>◷</span><div><h3>Frequência & Preferências</h3></div></div><div className="settings-form-grid"><Field label="Frequência de envio"><select value={frequency} onChange={event=>setFrequency(event.target.value)}><option>Imediato</option><option>Diário (resumo)</option><option>Semanal</option><option>Por evento/gatilho</option></select></Field><Field label="Horário preferido"><select value={time} onChange={event=>setTime(event.target.value)}>{['08:00','09:00','10:00','12:00','14:00','18:00'].map(value=><option key={value}>{value}</option>)}</select></Field></div></div>
  <div className="settings-form-actions"><button className="settings-btn settings-btn-primary" onClick={()=>setSaved(true)}>Aplicar nesta sessão</button>{saved&&<span className="settings-saved-text">✓ Preferências aplicadas localmente</span>}</div>
 </Card>;
}
