import type { CmsStatus } from './types';

export type View='overview'|'pages'|'media'|'globals'|'settings';
export function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base||''}
export function href(path:string){return `${basePath()}${path}`||path}
export function go(path:string){window.location.href=href(path)}
export function currentView():View{const base=basePath();const raw=base&&window.location.pathname.startsWith(base)?window.location.pathname.slice(base.length):window.location.pathname;if(raw.startsWith('/site-admin/pages'))return'pages';if(raw.startsWith('/site-admin/media'))return'media';if(raw.startsWith('/site-admin/globals'))return'globals';if(raw.startsWith('/site-admin/settings'))return'settings';return'overview'}
export function clone<T>(value:T):T{return structuredClone(value)}
export function now(){return new Date().toISOString()}
export function formatDate(value:string|null){if(!value)return'Nunca';return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
export function statusLabel(status:CmsStatus){return{draft:'Draft',published:'Published',scheduled:'Scheduled',hidden:'Hidden'}[status]}
