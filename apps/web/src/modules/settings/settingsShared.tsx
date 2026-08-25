import { useMemo, useState, type ReactNode } from 'react';
import './settings.css';

export type Tab='empresa'|'automacoes'|'seguranca'|'integracoes'|'usuarios';
type Company={companyName:string;fantasyName:string;cnpj:string;address:string;phone:string;responsible:string;slug:string};
export type AutomationKey='email'|'push'|'newLead'|'leadFollowup'|'financeMovement'|'weeklyFinance'|'weeklyReport'|'criticalAlerts'|'operational'|'backup';
export type IntegrationStatus='Conectado'|'Não conectado'|'Reconexão necessária'|'Indisponível';
export type Integration={id:string;category:string;name:string;description:string;icon:string;status:IntegrationStatus};
export type UserRecord={id:string;name:string;email:string;role:string;status:'Ativo'|'Inativo'|'Pendente'};
export type Role={id:string;name:string;description:string;permissions:string[];system?:boolean};

export const TABS:Array<{id:Tab;label:string;icon:string}>=[
 {id:'empresa',label:'Empresa',icon:'▣'},
 {id:'automacoes',label:'Automações',icon:'⚡'},
 {id:'seguranca',label:'Segurança',icon:'◈'},
 {id:'integracoes',label:'Integrações',icon:'↗'},
 {id:'usuarios',label:'Usuários',icon:'♙'},
];

export const INITIAL_COMPANY:Company={
 companyName:'Visa Fácil Assessoria LTDA',
 fantasyName:'Visa Fácil',
 cnpj:'',
 address:'',
 phone:'',
 responsible:'Administrador',
 slug:'visa-facil',
};

export const INITIAL_AUTOMATIONS:Record<AutomationKey,boolean>={
 email:true,push:true,newLead:true,leadFollowup:true,financeMovement:true,weeklyFinance:false,weeklyReport:true,criticalAlerts:true,operational:true,backup:true,
};

export const INITIAL_INTEGRATIONS:Integration[]=[
 {id:'whatsapp',category:'Comunicação',name:'WhatsApp Business',description:'Atendimento, notificações e conversas com clientes.',icon:'◉',status:'Não conectado'},
 {id:'resend',category:'Comunicação',name:'E-mail transacional',description:'Envio de e-mails operacionais, avisos e confirmações.',icon:'✉',status:'Conectado'},
 {id:'autentique',category:'Assinatura Digital',name:'Autentique',description:'Assinatura eletrônica de contratos e documentos.',icon:'✎',status:'Não conectado'},
 {id:'nfe',category:'Fiscal',name:'NFe',description:'Emissão e gestão de documentos fiscais.',icon:'▧',status:'Não conectado'},
 {id:'stripe',category:'Pagamentos',name:'Stripe',description:'Cobranças, pagamentos e faturamento recorrente.',icon:'$',status:'Conectado'},
 {id:'meta',category:'Marketing Digital',name:'Meta Ads',description:'Campanhas, públicos e dados de desempenho.',icon:'M',status:'Não conectado'},
 {id:'google',category:'Marketing Digital',name:'Google Ads',description:'Campanhas e dados de aquisição do Google.',icon:'G',status:'Reconexão necessária'},
 {id:'calendar',category:'Produtividade',name:'Google Calendar',description:'Sincronização de compromissos, entrevistas e lembretes.',icon:'□',status:'Não conectado'},
];

export const INITIAL_USERS:UserRecord[]=[
 {id:'u-1',name:'Administrador',email:'admin@visafacil.com.br',role:'Administrador',status:'Ativo'},
 {id:'u-2',name:'Equipe Comercial',email:'comercial@visafacil.com.br',role:'Consultor',status:'Ativo'},
];

export const INITIAL_ROLES:Role[]=[
 {id:'r-1',name:'Administrador',description:'Acesso total ao CRM e às configurações.',permissions:['Todos os módulos','Financeiro','Configurações','Usuários e permissões'],system:true},
 {id:'r-2',name:'Consultor',description:'Operação comercial e atendimento.',permissions:['CRM','Atendimentos','Tarefas','Agenda']},
 {id:'r-3',name:'Financeiro',description:'Acesso às rotinas financeiras.',permissions:['Financeiro','Relatórios']},
];

export function base(){return import.meta.env.BASE_URL.replace(/\/$/,'')}
export function Bell(){return <svg className="settings-bell-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}
export function initials(name:string){return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'VF'}

export function Toggle({checked,onChange,disabled=false}:{checked:boolean;onChange:(v:boolean)=>void;disabled?:boolean}){
 return <button type="button" className={`settings-toggle ${checked?'is-on':''}`} aria-pressed={checked} disabled={disabled} onClick={()=>!disabled&&onChange(!checked)}><span/></button>;
}

export function Card({title,description,icon,action,children,className=''}:{title:string;description?:string;icon?:string;action?:ReactNode;children:ReactNode;className?:string}){
 return <section className={`settings-card ${className}`}><header className="settings-card-header"><div className="settings-card-title-wrap">{icon&&<span className="settings-card-icon" aria-hidden="true">{icon}</span>}<div><h2>{title}</h2>{description&&<p>{description}</p>}</div></div>{action}</header><div className="settings-card-body">{children}</div></section>;
}

export function Field({label,children,help}:{label:string;children:ReactNode;help?:string}){
 return <label className="settings-field"><span>{label}</span>{children}{help&&<small>{help}</small>}</label>;
}

export function SettingRow({title,description,checked,onChange,disabled=false}:{title:string;description:string;checked:boolean;onChange:(v:boolean)=>void;disabled?:boolean}){
 return <div className={`settings-setting-row ${disabled?'is-disabled':''}`}><div><strong>{title}</strong><p>{description}</p></div><Toggle checked={checked} onChange={onChange} disabled={disabled}/></div>;
}

export function StatusBadge({status}:{status:IntegrationStatus}){
 return <span className={`settings-status is-${status.toLowerCase().replace(/\s+/g,'-').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}`}>{status}</span>;
}

export function MiniModal({title,description,close,children,footer}:{title:string;description?:string;close:()=>void;children:ReactNode;footer?:ReactNode}){
 return <div className="settings-modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&close()}><div className="settings-mini-modal" role="dialog" aria-modal="true"><header><div><span>CONFIGURAÇÕES</span><h2>{title}</h2>{description&&<p>{description}</p>}</div><button type="button" onClick={close} aria-label="Fechar">×</button></header><div className="settings-mini-modal-body">{children}</div>{footer&&<footer>{footer}</footer>}</div></div>;
}

export function SettingsGroup({title,icon,children}:{title:string;icon:string;children:ReactNode}){return <div className="settings-section-block"><div className="settings-section-title"><span>{icon}</span><div><h3>{title}</h3></div></div><div className="settings-setting-list">{children}</div></div>}