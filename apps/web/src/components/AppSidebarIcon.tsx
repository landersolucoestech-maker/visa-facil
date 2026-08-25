export type AppSidebarIconName =
  | 'dashboard'
  | 'contacts'
  | 'support'
  | 'tasks'
  | 'calendar'
  | 'finance'
  | 'marketing'
  | 'reports'
  | 'settings'
  | 'overview'
  | 'pages'
  | 'media'
  | 'globe'
  | 'external'
  | 'logout'
  | 'chevron';

export function AppSidebarIcon({name,className=''}:{name:AppSidebarIconName;className?:string}){
  const common={width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true};
  const icon=(()=>{
    switch(name){
      case 'dashboard': return <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>;
      case 'contacts': return <><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.6-3.1 2.4-5 5.2-5s4.6 1.9 5.2 5"/><path d="M16 7.2a2.6 2.6 0 0 1 0 5.1"/><path d="M16.5 14.2c2.2.5 3.4 2.1 3.7 4.3"/></>;
      case 'support': return <><path d="M5 5.5h14v10H9l-4 3v-13Z"/><path d="M8 9h8M8 12h5"/></>;
      case 'tasks': return <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 2.5 2.5L16.5 8.5"/></>;
      case 'calendar': return <><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3.5v4M16 3.5v4M4 9.5h16"/><path d="M8 13h3M13 13h3M8 16h3"/></>;
      case 'finance': return <><rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17"/><path d="M7 14h3"/></>;
      case 'marketing': return <><path d="M5 10.5v3h4l6 4V6l-6 4.5H5Z"/><path d="M9 13.5 10.5 19"/><path d="M18 9v6"/></>;
      case 'reports': return <><path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/></>;
      case 'settings': return <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>;
      case 'overview': return <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/></>;
      case 'pages': return <><path d="M7 3.5h7l4 4V20H7Z"/><path d="M14 3.5V8h4M10 12h5M10 15.5h5"/></>;
      case 'media': return <><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6.5 17 4-4 2.5 2 2.5-2.5 2 2.5"/></>;
      case 'globe': return <><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.2 2.2 3.2 4.9 3.2 8S14.2 17.8 12 20c-2.2-2.2-3.2-4.9-3.2-8S9.8 6.2 12 4Z"/></>;
      case 'external': return <><path d="M9 6H5v13h13v-4"/><path d="M13 5h6v6M19 5l-9 9"/></>;
      case 'logout': return <><path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M8 12h10"/></>;
      case 'chevron': return <path d="m9 7 5 5-5 5"/>;
    }
  })();
  return <svg className={className} {...common}>{icon}</svg>;
}
