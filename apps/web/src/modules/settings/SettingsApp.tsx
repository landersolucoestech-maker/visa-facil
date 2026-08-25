import { useMemo, useState } from 'react';
import './settings.css';
import './settings-responsive.css';
import './settings-layout-fix.css';
import { TABS, type Tab, Bell } from './settingsShared';
import { CompanyTab, AutomationsTab } from './CompanyAutomationTabs';
import { SecurityTab, IntegrationsTab } from './SecurityIntegrationTabs';
import { UsersTab } from './UsersTab';

export function SettingsApp(){
 const [tab,setTab]=useState<Tab>('empresa');const [notifications,setNotifications]=useState(false);
 const active=useMemo(()=>TABS.find(t=>t.id===tab)!,[tab]);
 return <div className="crm-shell settings-shell" onClick={()=>setNotifications(false)}><div className="crm-workspace"><header className="crm-topbar"><div><small>VISA FÁCIL · CRM · CONFIGURAÇÕES</small><h1>Configurações</h1><p>Gerencie as configurações do sistema e preferências.</p></div><div className="crm-topbar-actions" onClick={e=>e.stopPropagation()}><div className="settings-topbar-menu"><button className="settings-notification-btn" type="button" aria-label="Alertas" aria-expanded={notifications} onClick={()=>setNotifications(v=>!v)}><Bell/></button>{notifications&&<div className="settings-dropdown"><strong>Notificações</strong><p>Nenhuma notificação no momento.</p></div>}</div></div></header>
  <main className="settings-content"><section className="settings-surface"><nav className="settings-tabs" role="tablist" aria-label="Seções de configurações">{TABS.map(item=><button type="button" role="tab" aria-selected={tab===item.id} key={item.id} className={tab===item.id?'is-active':''} onClick={()=>setTab(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav><div className="settings-tab-content" key={active.id}>{tab==='empresa'&&<CompanyTab/>}{tab==='automacoes'&&<AutomationsTab/>}{tab==='seguranca'&&<SecurityTab/>}{tab==='integracoes'&&<IntegrationsTab/>}{tab==='usuarios'&&<UsersTab/>}</div></section></main>
 </div></div>;
}

export default SettingsApp;
