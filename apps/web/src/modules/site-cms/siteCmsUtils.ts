import type { CmsStatus } from './types';

export type View='overview'|'pages'|'media'|'globals'|'settings';
export function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base==='/'?'':base}
export function href(path:string){return `${basePath()}${path}`||path}
export function go(path:string){window.location.href=href(path)}
export function stripCmsBasePath(pathname:string){const base=basePath();if(!base)return pathname;if(pathname===base)return'/';return pathname.startsWith(`${base}/`)?pathname.slice(base.length)||'/':pathname}
function isPathAtOrBelow(path:string,prefix:string){return path===prefix||path.startsWith(`${prefix}/`)}
export function currentView():View{const raw=stripCmsBasePath(window.location.pathname);if(isPathAtOrBelow(raw,'/site-admin/pages'))return'pages';if(isPathAtOrBelow(raw,'/site-admin/media'))return'media';if(isPathAtOrBelow(raw,'/site-admin/globals'))return'globals';if(isPathAtOrBelow(raw,'/site-admin/settings'))return'settings';return'overview'}
export function clone<T>(value:T):T{return structuredClone(value)}
export function now(){return new Date().toISOString()}
export function formatDate(value:string|null){if(!value)return'Nunca';return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
export function statusLabel(status:CmsStatus){return{draft:'Draft',published:'Published',scheduled:'Scheduled',hidden:'Hidden'}[status]}
