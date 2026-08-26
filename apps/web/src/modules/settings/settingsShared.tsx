import { type ReactNode } from 'react';
import { getSettingsAutomationMock, getSettingsCompanyMock, getSettingsRoleMocks, getSettingsUserMocks } from './mocks/settingsMockProvider';
import './settings.css';

export type Tab='empresa'|'automacoes'|'seguranca'|'integracoes'|'usuarios';
export type Company={companyName:string;fantasyName:string;cnpj:string;address:string;phone:string;responsible:string;slug:string};
export type AutomationKey='email'|'push'|'newLead'|'leadFollowup'|'financeMovement'|'weeklyFinance'|'weeklyReport'|'criticalAlerts'|'operational'|'backup';
export type UserRecord={id:string;name:string;email:string;role:string;status:'Ativo'|'Inativo'|'Pendente'};
export type Role={id:string;name:string;description:string;permissions:string[];system?:boolean};

export const TABS:Array<{id:Tab;label:string;icon:string}>=[
 {id:'empresa',label:'Empresa',icon:'▣'},
 {id:'automacoes',label:'Automações',icon:'⚡'},
 {id:'seguranca',label:'Segurança',icon:'◈'},
 {id:'integracoes',label:'Integrações',icon:'↗'},
 {id:'usuarios',label:'Usuários',icon:'♙'},
];

const blankCompany:Company={companyName:'',fantasyName:'',cnpj:'',address:'',phone:'',responsible:'',slug:''};
const blankAutomations:Record<AutomationKey,boolean>={email:false,push:false,newLead:false,leadFollowup:false,financeMovement:false,weeklyFinance:false,weeklyReport:false,criticalAlerts:false,operational:false,backup:false};

export const INITIAL_COMPANY:Company=getSettingsCompanyMock()??blankCompany;
export const INITIAL_AUTOMATIONS:Record<AutomationKey,boolean>=getSettingsAutomationMock()??blankAutomations;
export const INITIAL_USERS:UserRecord[]=getSettingsUserMocks();
export const INITIAL_ROLES:Role[]=getSettingsRoleMocks();

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

export function MiniModal({title,description,close,children,footer}:{title:string;description?:string;close:()=>void;children:ReactNode;footer?:ReactNode}){
 return <div className="settings-modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&close()}><div className="settings-mini-modal" role="dialog" aria-modal="true"><header><div><span>CONFIGURAÇÕES</span><h2>{title}</h2>{description&&<p>{description}</p>}</div><button type="button" onClick={close} aria-label="Fechar">×</button></header><div className="settings-mini-modal-body">{children}</div>{footer&&<footer>{footer}</footer>}</div></div>;
}

export function SettingsGroup({title,icon,children}:{title:string;icon:string;children:ReactNode}){return <div className="settings-section-block"><div className="settings-section-title"><span>{icon}</span><div><h3>{title}</h3></div></div><div className="settings-setting-list">{children}</div></div>}
