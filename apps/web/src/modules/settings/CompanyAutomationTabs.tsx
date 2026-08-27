import { useEffect, useState } from 'react';
import { reportSessionPersistenceError } from '../../shared/sessionPersistence';
import { INITIAL_COMPANY, INITIAL_AUTOMATIONS, type AutomationKey, type Company, Card, Field, Toggle, SettingRow, SettingsGroup } from './settingsShared';

const MAX_LOGO_BYTES=5*1024*1024;
const ALLOWED_LOGO_TYPES=new Set(['image/png','image/jpeg','image/webp']);
const COMPANY_KEY='visa-facil.settings.company.v1';
const AUTOMATIONS_KEY='visa-facil.settings.automations.v1';
const FREQUENCIES=['Imediato','Diário (resumo)','Semanal','Por evento/gatilho'] as const;
const TIMES=['08:00','09:00','10:00','12:00','14:00','18:00'] as const;
type AutomationSession={values:Record<AutomationKey,boolean>;frequency:string;time:string};

function storage(){try{return typeof sessionStorage==='undefined'?null:sessionStorage}catch{return null}}
function isObject(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function writeSetting(key:string,value:unknown){
 const store=storage();
 if(!store){reportSessionPersistenceError(new Error(`sessionStorage indisponível para ${key}.`),key);return false}
 try{
  const raw=JSON.stringify(value);
  store.setItem(key,raw);
  if(store.getItem(key)!==raw)throw new Error(`A gravação local de ${key} não pôde ser confirmada.`);
  return true;
 }catch(error){reportSessionPersistenceError(error,key);return false}
}
function readCompany():Company{
 const store=storage();if(!store)return structuredClone(INITIAL_COMPANY);
 try{
  const raw=store.getItem(COMPANY_KEY);if(!raw)return structuredClone(INITIAL_COMPANY);
  const value:unknown=JSON.parse(raw);if(!isObject(value))return structuredClone(INITIAL_COMPANY);
  const keys:Array<keyof Company>=['companyName','fantasyName','cnpj','address','phone','responsible','slug'];
  return keys.every(key=>typeof value[key]==='string')?Object.fromEntries(keys.map(key=>[key,value[key]])) as Company:structuredClone(INITIAL_COMPANY);
 }catch{return structuredClone(INITIAL_COMPANY)}
}
function writeCompany(value:Company){return writeSetting(COMPANY_KEY,value)}
function validAutomationValues(value:unknown):value is Record<AutomationKey,boolean>{
 if(!isObject(value))return false;
 return (Object.keys(INITIAL_AUTOMATIONS) as AutomationKey[]).every(key=>typeof value[key]==='boolean')&&value.backup===false;
}
function readAutomationSession():AutomationSession{
 const fallback={values:structuredClone(INITIAL_AUTOMATIONS),frequency:'Imediato',time:'09:00'};
 const store=storage();if(!store)return fallback;
 try{
  const raw=store.getItem(AUTOMATIONS_KEY);if(!raw)return fallback;
  const value:unknown=JSON.parse(raw);if(!isObject(value)||!validAutomationValues(value.values)||typeof value.frequency!=='string'||typeof value.time!=='string'||!FREQUENCIES.includes(value.frequency as typeof FREQUENCIES[number])||!TIMES.includes(value.time as typeof TIMES[number]))return fallback;
  return {values:{...value.values,backup:false},frequency:value.frequency,time:value.time};
 }catch{return fallback}
}
function writeAutomationSession(value:AutomationSession){return writeSetting(AUTOMATIONS_KEY,{...value,values:{...value.values,backup:false}})}

export function CompanyTab(){
 const [company,setCompany]=useState<Company>(()=>readCompany());
 const [snapshot,setSnapshot]=useState<Company>(()=>readCompany());
 const [editing,setEditing]=useState(false);
 const [logo,setLogo]=useState<string>();
 const [logoError,setLogoError]=useState('');
 const [saved,setSaved]=useState(false);
 const [saveError,setSaveError]=useState('');
 useEffect(()=>()=>{if(logo)URL.revokeObjectURL(logo)},[logo]);
 const chooseLogo=(file?:File)=>{
  setLogoError('');
  if(!file)return;
  if(!ALLOWED_LOGO_TYPES.has(file.type)){setLogoError('Formato inválido. Use PNG, JPG ou WEBP.');return}
  if(file.size>MAX_LOGO_BYTES){setLogoError('A imagem excede o limite de 5 MB.');return}
  const next=URL.createObjectURL(file);
  setLogo(current=>{if(current)URL.revokeObjectURL(current);return next});
 };
 const begin=()=>{setSnapshot(company);setEditing(true);setSaved(false);setSaveError('')};
 const cancel=()=>{setCompany(snapshot);setEditing(false);setSaveError('')};
 const save=()=>{
  if(!writeCompany(company)){setSaved(false);setSaveError('Não foi possível preservar os dados nesta sessão. As alterações continuam abertas para nova tentativa.');return}
  setSnapshot(company);setEditing(false);setSaved(true);setSaveError('');
 };
 return <div className="settings-company-grid">
  <Card title="Identidade Visual" description="Dados da empresa nesta sessão; a prévia de logo permanece apenas nesta aba" icon="◐" className="settings-identity-card">
   <div className="settings-identity">
    <label className="settings-logo-picker" title="Alterar logo"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>chooseLogo(event.target.files?.[0])}/>{logo?<img src={logo} alt="Logo da empresa"/>:<span>VF</span>}<i>⌁</i></label>
    <button type="button" className="settings-btn settings-btn-outline" onClick={()=>document.querySelector<HTMLInputElement>('.settings-logo-picker input')?.click()}>Alterar foto</button>
    <small className="settings-upload-help">PNG, JPG ou WEBP · Máx. 5 MB</small>{logoError&&<p className="settings-security-notice" role="alert">{logoError}</p>}
    <h3>{company.fantasyName||company.companyName}</h3><code>Identificador: {company.slug||'não definido'}</code>
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
    <Field label="Identificador da organização" help="Identificador local de referência. A rota pública de cadastro por organização ainda não existe neste protótipo."><input disabled={!editing} value={company.slug} onChange={event=>setCompany(current=>({...current,slug:event.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')}))}/></Field>
   </div>
   {editing&&<div className="settings-form-actions"><button className="settings-btn settings-btn-primary" onClick={save}>Aplicar nesta sessão</button><button className="settings-btn settings-btn-outline" onClick={cancel}>Cancelar</button></div>}
   {saved&&<div className="settings-inline-success" role="status">✓ Dados preservados no sessionStorage deste navegador. Não há persistência remota de empresa.</div>}
   {saveError&&<p className="settings-security-notice" role="alert">{saveError}</p>}
  </Card>
 </div>;
}

export function AutomationsTab(){
 const initial=readAutomationSession();
 const [values,setValues]=useState(initial.values);
 const [frequency,setFrequency]=useState(initial.frequency);
 const [time,setTime]=useState(initial.time);
 const [saved,setSaved]=useState(false);
 const [saveError,setSaveError]=useState('');
 const set=(key:AutomationKey,value:boolean)=>{if(key==='backup')return;setValues(current=>({...current,[key]:value,backup:false}));setSaved(false);setSaveError('')};
 const apply=()=>{
  const ok=writeAutomationSession({values:{...values,backup:false},frequency,time});
  setSaved(ok);
  setSaveError(ok?'':'Não foi possível preservar as preferências nesta sessão. Nenhuma automação foi executada.');
 };
 return <Card title="Automações & Notificações" description="Preferências de interface; nenhum executor de automações está conectado" icon="⚡">
  <div className="settings-info-box">As opções abaixo não disparam e-mails, SMS, push, backups ou jobs. Elas servem apenas para modelar preferências enquanto não existe backend/worker responsável pela execução.</div>
  <div className="settings-section-block"><div className="settings-section-title"><span>◌</span><div><h3>Canais de Notificação</h3><p>Preferências previstas para futura integração</p></div></div><div className="settings-channel-grid"><div><span>✉</span><strong>E-mail</strong><Toggle checked={values.email} onChange={value=>set('email',value)}/></div><div><span>▯</span><strong>SMS</strong><Toggle checked={values.sms} onChange={value=>set('sms',value)}/></div><div><span>◌</span><strong>Push/In-App</strong><Toggle checked={values.push} onChange={value=>set('push',value)}/></div></div></div>
  <div className="settings-divider"/>
  <SettingsGroup title="CRM & Atendimento" icon="◎"><SettingRow title="Novo lead criado" description="Preferência para futuro evento de novo lead" checked={values.newLead} onChange={value=>set('newLead',value)}/><SettingRow title="Próxima ação do lead" description="Preferência para futuros lembretes de follow-up" checked={values.leadFollowup} onChange={value=>set('leadFollowup',value)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Financeiro" icon="$"><SettingRow title="Movimentação financeira relevante" description="Preferência para futuros eventos financeiros" checked={values.financeMovement} onChange={value=>set('financeMovement',value)}/><SettingRow title="Resumo financeiro semanal" description="Preferência para futuro resumo financeiro" checked={values.weeklyFinance} onChange={value=>set('weeklyFinance',value)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Relatórios & Resumos" icon="□"><SettingRow title="Relatório semanal de atividades" description="Preferência para futuro resumo operacional" checked={values.weeklyReport} onChange={value=>set('weeklyReport',value)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Sistema" icon="↻"><SettingRow title="Alertas críticos do sistema" description="Preferência para futuros eventos de erro" checked={values.criticalAlerts} onChange={value=>set('criticalAlerts',value)}/><SettingRow title="Notificações operacionais" description="Preferência para futuras notificações in-app" checked={values.operational} onChange={value=>set('operational',value)}/><SettingRow title="Backup automático" description="Indisponível: não existe banco de dados ou rotina de backup neste repositório" checked={false} onChange={()=>{}} disabled/></SettingsGroup>
  <div className="settings-divider"/>
  <div className="settings-section-block"><div className="settings-section-title"><span>◷</span><div><h3>Frequência & Preferências</h3></div></div><div className="settings-form-grid"><Field label="Frequência de envio"><select value={frequency} onChange={event=>{setFrequency(event.target.value);setSaved(false);setSaveError('')}}>{FREQUENCIES.map(value=><option key={value}>{value}</option>)}</select></Field><Field label="Horário preferido"><select value={time} onChange={event=>{setTime(event.target.value);setSaved(false);setSaveError('')}}>{TIMES.map(value=><option key={value}>{value}</option>)}</select></Field></div></div>
  <div className="settings-form-actions"><button className="settings-btn settings-btn-primary" onClick={apply}>Aplicar nesta sessão</button>{saved&&<span className="settings-saved-text" role="status">✓ Preferências preservadas nesta sessão do navegador</span>}</div>
  {saveError&&<p className="settings-security-notice" role="alert">{saveError}</p>}
 </Card>;
}