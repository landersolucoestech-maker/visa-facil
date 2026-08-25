import { useState } from 'react';
import { INITIAL_COMPANY, INITIAL_AUTOMATIONS, type AutomationKey, Card, Field, Toggle, SettingRow, SettingsGroup, base } from './settingsShared';

export function CompanyTab(){
 const [company,setCompany]=useState(INITIAL_COMPANY);
 const [snapshot,setSnapshot]=useState(INITIAL_COMPANY);
 const [editing,setEditing]=useState(false);
 const [logo,setLogo]=useState<string>();
 const [saved,setSaved]=useState(false);
 const begin=()=>{setSnapshot(company);setEditing(true);setSaved(false)};
 const cancel=()=>{setCompany(snapshot);setEditing(false)};
 const save=()=>{setEditing(false);setSaved(true)};
 return <div className="settings-company-grid">
  <Card title="Identidade Visual" description="Logo exibida nas áreas públicas e internas" icon="◐" className="settings-identity-card">
   <div className="settings-identity">
    <label className="settings-logo-picker" title="Alterar logo"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)setLogo(URL.createObjectURL(file))}}/>{logo?<img src={logo} alt="Logo da empresa"/>:<span>VF</span>}<i>⌁</i></label>
    <button type="button" className="settings-btn settings-btn-outline" onClick={()=>document.querySelector<HTMLInputElement>('.settings-logo-picker input')?.click()}>Alterar foto</button>
    <small className="settings-upload-help">PNG, JPG ou WEBP · Máx. 5 MB</small>
    <h3>{company.fantasyName||company.companyName}</h3>
    <code>/cadastro/{company.slug||'seu-slug'}</code>
    <div className="settings-identity-meta">
     <div><span>CNPJ:</span><b>{company.cnpj||'Não informado'}</b></div>
     <div><span>Telefone:</span><b>{company.phone||'Não informado'}</b></div>
     <div><span>Responsável:</span><b>{company.responsible||'Não informado'}</b></div>
    </div>
   </div>
  </Card>
  <Card title="Dados da Empresa" description="Informações da empresa para contratos e documentos" icon="▣" className="settings-company-form-card" action={!editing?<button className="settings-btn settings-btn-outline" onClick={begin}>✎ Editar Dados</button>:undefined}>
   <div className="settings-form-grid">
    <Field label="Razão Social"><input disabled={!editing} value={company.companyName} onChange={e=>setCompany(c=>({...c,companyName:e.target.value}))}/></Field>
    <Field label="Nome Fantasia"><input disabled={!editing} value={company.fantasyName} onChange={e=>setCompany(c=>({...c,fantasyName:e.target.value}))}/></Field>
    <Field label="CNPJ"><input disabled={!editing} placeholder="00.000.000/0000-00" value={company.cnpj} onChange={e=>setCompany(c=>({...c,cnpj:e.target.value}))}/></Field>
    <Field label="Endereço Completo" help="Endereço utilizado em documentos e dados institucionais."><input disabled={!editing} value={company.address} placeholder="Rua, número, bairro, cidade/UF, CEP" onChange={e=>setCompany(c=>({...c,address:e.target.value}))}/></Field>
    <Field label="Telefone/WhatsApp"><input disabled={!editing} placeholder="(00) 00000-0000" value={company.phone} onChange={e=>setCompany(c=>({...c,phone:e.target.value}))}/></Field>
    <Field label="Responsável"><input disabled={!editing} value={company.responsible} onChange={e=>setCompany(c=>({...c,responsible:e.target.value}))}/></Field>
    <Field label="Slug da organização" help={`Link de cadastro: ${window.location.origin}${base()}/cadastro/${company.slug||'seu-slug'}`}><input disabled={!editing} value={company.slug} onChange={e=>setCompany(c=>({...c,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-')}))}/></Field>
   </div>
   {editing&&<div className="settings-form-actions"><button className="settings-btn settings-btn-primary" onClick={save}>Salvar Configurações</button><button className="settings-btn settings-btn-outline" onClick={cancel}>Cancelar</button></div>}
   {saved&&<div className="settings-inline-success">✓ Configurações da empresa salvas neste protótipo.</div>}
  </Card>
 </div>;
}

export function AutomationsTab(){
 const [values,setValues]=useState(INITIAL_AUTOMATIONS);const [frequency,setFrequency]=useState('Imediato');const [time,setTime]=useState('09:00');const [saved,setSaved]=useState(false);
 const set=(key:AutomationKey,v:boolean)=>{setValues(c=>({...c,[key]:v}));setSaved(false)};
 return <Card title="Automações & Notificações" description="Configure quando, como e por qual canal o sistema deve notificar" icon="⚡">
  <div className="settings-section-block"><div className="settings-section-title"><span>◌</span><div><h3>Canais de Notificação</h3><p>Configuração de meios de envio</p></div></div><div className="settings-channel-grid">
   <div><span>✉</span><strong>E-mail</strong><Toggle checked={values.email} onChange={v=>set('email',v)}/></div>
   <div className="is-disabled"><span>▯</span><strong>SMS</strong><Toggle checked={false} onChange={()=>{}} disabled/></div>
   <div><span>◌</span><strong>Push/In-App</strong><Toggle checked={values.push} onChange={v=>set('push',v)}/></div>
  </div></div>
  <div className="settings-divider"/>
  <SettingsGroup title="CRM & Atendimento" icon="◎"><SettingRow title="Novo lead criado" description="Notificar quando um novo lead entrar no CRM" checked={values.newLead} onChange={v=>set('newLead',v)}/><SettingRow title="Próxima ação do lead" description="Alertar sobre follow-ups e ações comerciais próximas" checked={values.leadFollowup} onChange={v=>set('leadFollowup',v)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Financeiro" icon="$"><SettingRow title="Movimentação financeira relevante" description="Novos lançamentos, cobranças ou pagamentos" checked={values.financeMovement} onChange={v=>set('financeMovement',v)}/><SettingRow title="Resumo financeiro semanal" description="Receba um resumo das movimentações da semana" checked={values.weeklyFinance} onChange={v=>set('weeklyFinance',v)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Relatórios & Resumos" icon="□"><SettingRow title="Relatório semanal de atividades" description="Atendimentos, tarefas, financeiro e desempenho comercial" checked={values.weeklyReport} onChange={v=>set('weeklyReport',v)}/></SettingsGroup>
  <div className="settings-divider"/>
  <SettingsGroup title="Sistema" icon="↻"><SettingRow title="Alertas críticos do sistema" description="Erros, falhas de integração e eventos importantes" checked={values.criticalAlerts} onChange={v=>set('criticalAlerts',v)}/><SettingRow title="Notificações operacionais" description="Atualizações relevantes e ações pendentes do usuário" checked={values.operational} onChange={v=>set('operational',v)}/><SettingRow title="Backup automático" description="Realizar backup periódico dos dados" checked={values.backup} onChange={v=>set('backup',v)}/></SettingsGroup>
  <div className="settings-divider"/>
  <div className="settings-section-block"><div className="settings-section-title"><span>◷</span><div><h3>Frequência & Preferências</h3></div></div><div className="settings-form-grid"><Field label="Frequência de envio"><select value={frequency} onChange={e=>setFrequency(e.target.value)}><option>Imediato</option><option>Diário (resumo)</option><option>Semanal</option><option>Por evento/gatilho</option></select></Field><Field label="Horário preferido de recebimento"><select value={time} onChange={e=>setTime(e.target.value)}>{['08:00','09:00','10:00','12:00','14:00','18:00'].map(v=><option key={v}>{v}</option>)}</select></Field></div></div>
  <div className="settings-form-actions"><button className="settings-btn settings-btn-primary" onClick={()=>setSaved(true)}>Salvar Configurações</button>{saved&&<span className="settings-saved-text">✓ Preferências salvas</span>}</div>
 </Card>;
}

