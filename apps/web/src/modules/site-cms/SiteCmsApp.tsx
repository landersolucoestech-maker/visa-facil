import { useEffect, useMemo, useState } from 'react';
import { CmsStorageError, loadDraft, publishDraft, resetCms, saveDraft } from './siteStore';
import { cmsPublicationIssues } from './cmsDocumentContract';
import type { CmsDocument } from './types';
import { CmsSidebar } from './CmsEditors';
import { OverviewView } from './CmsOverviewView';
import { PagesView } from './CmsPagesView';
import { GlobalsView, MediaView, SettingsView } from './CmsResourceViews';
import { currentView, go, href } from './siteCmsUtils';
import './site-cms-base.css';
import './site-cms-editor.css';
import './site-cms-responsive.css';
import './site-cms-product.css';

export function SiteCmsApp(){
 const view=currentView();const [document,setDocumentState]=useState<CmsDocument>(()=>loadDraft());const [dirty,setDirty]=useState(false);const [selectedPageId,setSelectedPageId]=useState(document.pages[0]?.id||'');const [notice,setNotice]=useState('');
 const setDocument=(next:CmsDocument)=>{setDocumentState(next);setDirty(true)};
 const selectedPage=useMemo(()=>document.pages.find(page=>page.id===selectedPageId)||document.pages[0],[document.pages,selectedPageId]);
 const showNotice=(message:string,timeout=2400)=>{setNotice(message);window.setTimeout(()=>setNotice(''),timeout)};
 const storageMessage=(error:unknown)=>error instanceof CmsStorageError?error.message:'Não foi possível salvar o conteúdo local do CMS.';
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirty]);
 const save=()=>{try{const next=saveDraft(document);setDocumentState(next);setDirty(false);showNotice('Rascunho salvo localmente neste navegador.')}catch(error){showNotice(storageMessage(error),4200)}};
 const publish=()=>{const issues=cmsPublicationIssues(document);if(issues.length){showNotice(`Publicação bloqueada: ${issues[0]}`,5200);return}try{const saved=saveDraft(document);const next=publishDraft(saved);setDocumentState(next);setDirty(false);showNotice('Conteúdo publicado localmente neste navegador.',3000)}catch(error){showNotice(storageMessage(error),4200)}};
 const preview=()=>{try{const next=saveDraft(document);setDocumentState(next);setDirty(false);const slug=selectedPage?.slug||'/';window.open(`${href('/preview')}?cmsPreview=draft&page=${encodeURIComponent(slug)}`,'_blank','noopener,noreferrer')}catch(error){showNotice(storageMessage(error),4200)}};
 const reset=()=>{try{const next=resetCms();setDocumentState(next);setSelectedPageId(next.pages[0]?.id||'');setDirty(false);showNotice('CMS local restaurado para o conteúdo inicial.',3200)}catch(error){showNotice(storageMessage(error),4200)}};
 return <div className="site-cms-shell"><CmsSidebar view={view}/><div className="site-cms-workspace"><header className="site-cms-topbar"><div><span>SITE / WEBSITE</span><strong>{view==='overview'?'Visão Geral':view==='pages'?'Páginas':view==='media'?'Mídia':view==='globals'?'Globais':'Configurações'}</strong><small>{dirty?'Alterações não salvas':'Rascunho salvo localmente'}</small></div><div className="site-cms-topbar-actions"><button className="site-cms-secondary" onClick={preview}>Pré-visualizar</button><button className="site-cms-secondary" disabled={!dirty} onClick={save}>Salvar rascunho</button><button className="site-cms-primary" onClick={publish}>Publicar localmente</button></div></header><main className="site-cms-content">{view==='overview'&&<OverviewView document={document} onOpenPages={()=>go('/site-admin/pages')}/>} {view==='pages'&&<PagesView document={document} setDocument={setDocument} selectedPageId={selectedPageId} setSelectedPageId={setSelectedPageId}/>} {view==='media'&&<MediaView document={document} setDocument={setDocument}/>} {view==='globals'&&<GlobalsView document={document} setDocument={setDocument}/>} {view==='settings'&&<SettingsView document={document} setDocument={setDocument} onReset={reset}/>}</main>{notice&&<div className="site-cms-toast" role="status">{notice}</div>}</div></div>
}

export default SiteCmsApp;
