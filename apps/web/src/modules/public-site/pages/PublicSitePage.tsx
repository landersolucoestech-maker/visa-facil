import { useEffect, useMemo, useRef } from 'react';
import { ContactSection } from '../components/ContactSection';
import { DifferenceSection } from '../components/DifferenceSection';
import { ExperienceSection } from '../components/ExperienceSection';
import { FaqSection } from '../components/FaqSection';
import { HeroSection } from '../components/HeroSection';
import { PainPointsSection } from '../components/PainPointsSection';
import { ProcessSection } from '../components/ProcessSection';
import { PublicFooter } from '../components/PublicFooter';
import { PublicHeader } from '../components/PublicHeader';
import { ServicesGridSection, ServicesIntroSection } from '../components/ServicesSection';
import { SiteContentProvider } from '../content/SiteContentContext';
import { usePublicSiteInteractions } from '../usePublicSiteInteractions';
import { isSafeCmsExternalUrl } from '../../site-cms/cmsDocumentContract';
import { findPageByPath, resolvePublicDocument } from '../../site-cms/siteStore';
import type { CmsSectionInstance } from '../../site-cms/types';

function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base||''}
function currentPublicPath(){const base=basePath();const pathname=window.location.pathname;const clean=base&&pathname.startsWith(base)?pathname.slice(base.length)||'/':pathname;return clean.replace(/\/+$/,'')||'/'}
function ensureMeta(name:string,property=false){let node=window.document.head.querySelector<HTMLMetaElement>(`meta[${property?'property':'name'}="${name}"]`);if(!node){node=window.document.createElement('meta');node.setAttribute(property?'property':'name',name);window.document.head.appendChild(node)}return node}
function setCanonical(value:string){let node=window.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(value){if(!node){node=window.document.createElement('link');node.rel='canonical';window.document.head.appendChild(node)}node.href=value}else node?.remove()}

function SectionRenderer({section}:{section:CmsSectionInstance}){
 switch(section.type){
  case'hero':return <HeroSection sectionId={section.id}/>;
  case'services-intro':return <ServicesIntroSection sectionId={section.id}/>;
  case'services':return <ServicesGridSection sectionId={section.id}/>;
  case'experience':return <ExperienceSection sectionId={section.id}/>;
  case'pain-points':return <PainPointsSection sectionId={section.id}/>;
  case'process':return <ProcessSection sectionId={section.id}/>;
  case'difference':return <DifferenceSection sectionId={section.id}/>;
  case'faq':return <FaqSection sectionId={section.id}/>;
  case'contact':return <ContactSection sectionId={section.id}/>;
  default:return null;
 }
}

export function PublicSitePage({preview=false}:{preview?:boolean}) {
  const rootRef = useRef<HTMLDivElement>(null);
  usePublicSiteInteractions(rootRef);
  const params=useMemo(()=>new URLSearchParams(window.location.search),[]);
  const draftPreview=preview||params.get('cmsPreview')==='draft';
  const cmsDocument=useMemo(()=>resolvePublicDocument(draftPreview),[draftPreview]);
  const requestedPath=preview?(params.get('page')||'/'):currentPublicPath();
  const candidate=findPageByPath(cmsDocument,requestedPath);
  const scheduledReady=candidate?.status==='scheduled'&&Boolean(candidate.scheduledAt)&&new Date(candidate.scheduledAt).getTime()<=Date.now();
  const page=draftPreview?candidate:(candidate&&(candidate.status==='published'||scheduledReady)?candidate:undefined);

  useEffect(()=>{
    const siteName=cmsDocument.settings.siteName||'VISA FÁCIL';
    if(!page){
      window.document.title=`Página não encontrada | ${siteName}`;
      ensureMeta('description').content='';
      ensureMeta('og:title',true).content=`Página não encontrada | ${siteName}`;
      ensureMeta('og:description',true).content='';
      ensureMeta('og:image',true).content='';
      ensureMeta('robots').content='noindex,nofollow';
      setCanonical('');
      return;
    }
    window.document.title=page.seo.title||siteName;
    ensureMeta('description').content=page.seo.description||'';
    ensureMeta('og:title',true).content=page.seo.title||siteName;
    ensureMeta('og:description',true).content=page.seo.description||'';
    const image=page.seo.ogImage||cmsDocument.settings.defaultOgImage;ensureMeta('og:image',true).content=image||'';
    ensureMeta('robots').content=draftPreview?'noindex,nofollow':page.seo.noIndex?'noindex,nofollow':'index,follow';
    const explicitCanonical=page.seo.canonicalUrl.trim();const siteUrl=cmsDocument.settings.siteUrl.trim();const canonical=isSafeCmsExternalUrl(explicitCanonical)?explicitCanonical:isSafeCmsExternalUrl(siteUrl)?`${siteUrl.replace(/\/$/,'')}${page.slug==='/'?'':page.slug}`:'';
    setCanonical(canonical);
  },[page,cmsDocument.settings,draftPreview]);

  if(!page)return <main className="public-site public-site-not-found"><section className="section"><div className="container"><h1>Página não encontrada</h1></div></section></main>;
  const visible=page.sections.filter(section=>section.visible).sort((a,b)=>a.order-b.order);

  return <SiteContentProvider document={cmsDocument} pageId={page.id}><div ref={rootRef} className="public-site">
      {draftPreview&&<div className="cms-preview-banner">PRÉ-VISUALIZAÇÃO DE RASCUNHO · alterações ainda não publicadas</div>}
      <PublicHeader />
      <main>{visible.map(section=><SectionRenderer section={section} key={section.id}/>)}</main>
      <PublicFooter />
    </div></SiteContentProvider>;
}
