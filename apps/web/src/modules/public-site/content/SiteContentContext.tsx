import { createContext, useContext, type ReactNode } from 'react';
import type { CmsDocument, CmsRepeaterItem, CmsSectionInstance, CmsValue } from '../../site-cms/types';
export { cmsHref, cmsImageSrc, cmsTarget } from './publicContentSafety';

const SiteContentContext=createContext<{document:CmsDocument;pageId:string}|null>(null);

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
