import { useMemo, useState } from 'react';
import { loadDraft, publishDraft, saveDraft } from './siteStore';
import type { CmsDocument } from './types';
import { CmsSidebar } from './CmsEditors';
import { OverviewView } from './CmsOverviewView';
import { PagesView } from './CmsPagesView';
import { GlobalsView, MediaView, SettingsView } from './CmsResourceViews';
import { currentView, go, href } from './siteCmsUtils';
import './site-cms-base.css';
import './site-cms-editor.css';
import './site-cms-responsive.css';

export function SiteCmsApp(){
 const view=currentView();const [document,setDocumentState]=useState<CmsDocument>(()=>loadDraft());const [dirty,setDirty]=useState(false);const [selectedPageId,setSelectedPageId]=useState(document.pages[0]?.id||'');const [notice,setNotice]=useState('');
 const setDocument=(next:CmsDocument)=>{setDocumentState(next);setDirty(true)};
 const selectedPage=useMemo(()=>document.pages.find(page=>page.id===selectedPageId)||document.pages[0],[document.pages,selectedPageId]);
 const save=()=>{const next=saveDraft(document);setDocumentState(next);setDirty(false);setNotice('Rascunho salvo.');setTimeout(()=>setNotice(''),1800)};
 const publish=()=>{const saved=saveDraft(document);const next=publishDraft(saved);setDocumentState(next);setDirty(false);setNotice('Conteúdo publicado com sucesso.');setTimeout(()=>setNotice(''),2200)};
 const preview=()=>{saveDraft(document);const slug=selectedPage?.slug||'/';window.open(`${href('/preview')}?cmsPreview=draft&page=${encodeURIComponent(slug)}`,'_blank','noopener,noreferrer')};
 return <div className="site-cms-shell"><CmsSidebar view={view}/><div className="site-cms-workspace"><header className="site-cms-topbar"><div><span>SITE / WEBSITE</span><strong>{view==='overview'?'Visão Geral':view==='pages'?'Páginas':view==='media'?'Mídia':view==='globals'?'Globais':'Configurações'}</strong><small>{dirty?'Alterações não salvas':'Rascunho salvo'}</small></div><div className="site-cms-topbar-actions"><button className="site-cms-secondary" onClick={preview}>Pré-visualizar</button><button className="site-cms-secondary" disabled={!dirty} onClick={save}>Salvar rascunho</button><button className="site-cms-primary" onClick={publish}>Publicar</button></div></header><main className="site-cms-content">{view==='overview'&&<OverviewView document={document} onOpenPages={()=>go('/site-admin/pages')}/>} {view==='pages'&&<PagesView document={document} setDocument={setDocument} selectedPageId={selectedPageId} setSelectedPageId={setSelectedPageId}/>} {view==='media'&&<MediaView document={document} setDocument={setDocument}/>} {view==='globals'&&<GlobalsView document={document} setDocument={setDocument}/>} {view==='settings'&&<SettingsView document={document} setDocument={setDocument}/>}</main>{notice&&<div className="site-cms-toast">{notice}</div>}</div></div>
}

export default SiteCmsApp;
