import { createContext, useContext, type ReactNode } from 'react';
import type { CmsDocument, CmsRepeaterItem, CmsSectionInstance, CmsValue } from '../../site-cms/types';

const SiteContentContext=createContext<{document:CmsDocument;pageId:string}|null>(null);
const SAFE_LINK_PROTOCOLS=new Set(['http:','https:','mailto:','tel:']);
const SAFE_IMAGE_PROTOCOLS=new Set(['http:','https:']);
const SAFE_RASTER_DATA_IMAGE=/^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;
const CONTROL_CHARACTERS=/[\u0000-\u001f\u007f]/;
const URL_BASE='https://cms.local.invalid/';

export function SiteContentProvider({document,pageId,children}:{document:CmsDocument;pageId:string;children:ReactNode}){
 return <SiteContentContext.Provider value={{document,pageId}}>{children}</SiteContentContext.Provider>
}

export function usePageSection(sectionId:string):CmsSectionInstance|undefined{
 const context=useContext(SiteContentContext);
 return context?.document.pages.find(page=>page.id===context.pageId)?.sections.find(section=>section.id===sectionId)
}

export function useGlobalSection(type:string):CmsSectionInstance|undefined{
 const context=useContext(SiteContentContext);
 return context?.document.globals.find(section=>section.type===type)
}

export function cmsText(value:CmsValue|undefined,fallback=''){return typeof value==='string'?value:fallback}
export function cmsBool(value:CmsValue|undefined,fallback=true){return typeof value==='boolean'?value:fallback}
export function cmsList(value:CmsValue|undefined):CmsRepeaterItem[]{return Array.isArray(value)?value:[]}
export function itemText(item:CmsRepeaterItem,key:string,fallback=''){const value=item[key];return typeof value==='string'?value:fallback}
export function itemBool(item:CmsRepeaterItem,key:string,fallback=false){const value=item[key];if(typeof value==='boolean')return value;if(value==='true')return true;if(value==='false')return false;return fallback}

export function cmsHref(value:string|undefined,fallback='#'){
 const href=(value??'').trim();
 if(!href||CONTROL_CHARACTERS.test(href)||href.startsWith('//')||href.startsWith('\\'))return fallback;
 if(href.startsWith('#'))return href;
 try{
  const parsed=new URL(href,URL_BASE);
  if(!SAFE_LINK_PROTOCOLS.has(parsed.protocol))return fallback;
  const explicitScheme=/^[a-z][a-z0-9+.-]*:/i.test(href);
  if(explicitScheme)return href;
  return parsed.origin===new URL(URL_BASE).origin?href:fallback;
 }catch{return fallback}
}

export function cmsImageSrc(value:string|undefined,fallback=''){
 const src=(value??'').trim();
 if(!src||CONTROL_CHARACTERS.test(src)||src.startsWith('//')||src.startsWith('\\'))return fallback;
 if(SAFE_RASTER_DATA_IMAGE.test(src))return src;
 try{
  const parsed=new URL(src,URL_BASE);
  if(!SAFE_IMAGE_PROTOCOLS.has(parsed.protocol))return fallback;
  const explicitScheme=/^[a-z][a-z0-9+.-]*:/i.test(src);
  if(explicitScheme)return src;
  return parsed.origin===new URL(URL_BASE).origin?src:fallback;
 }catch{return fallback}
}

export function cmsTarget(value:string|undefined){return value==='_blank'?'_blank':'_self'}
