import { cmsList, cmsText, itemText, useGlobalSection } from '../content/SiteContentContext';

function homeHref(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return `${base}/`||'/'}

export function PublicHeader() {
  const section=useGlobalSection('header');
  if(section&&!section.visible)return null;
  const values=section?.values||{};
  const primaryNav=cmsList(values.primaryNav);
  const visaMenu=cmsList(values.visaMenu);
  const brandName=cmsText(values.brandName,'VISA FÁCIL');
  const brandTagline=cmsText(values.brandTagline,'seu visto, sem complicação');
  const logoImage=cmsText(values.logoImage);
  const announcementTarget=cmsText(values.announcementCtaTarget,'_self');
  const headerCtaTarget=cmsText(values.headerCtaTarget,'_self');
  return (
    <>
      <div className="announcement">
        <div className="container announcement__inner">
          <span>{cmsText(values.announcementText,'Atendimento online para todo o Brasil')}</span>
          <a href={cmsText(values.announcementCtaUrl,'#diagnostico')} target={announcementTarget} rel={announcementTarget==='_blank'?'noreferrer':undefined}>
            {cmsText(values.announcementCtaLabel,'Faça uma análise inicial gratuita')}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <header className="header" id="inicio">
        <div className="container header__inner">
          <a className="logo" href={homeHref()} aria-label={`${brandName}, página inicial`}>
            {logoImage?<img className="logo__mark" src={logoImage} alt={brandName} style={{objectFit:'contain'}}/>:<svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M7 8h17l8 39L20 56 7 8Z" fill="#FFFFFF"></path>
              <path d="M29 19c7-6 15-9 26-10-1 6-4 11-9 15-6 4-11 6-17 8v-13Z" fill="#B22234"></path>
              <path d="M31 31c7-5 14-7 24-8-2 6-5 10-10 13-5 3-10 5-14 7V31Z" fill="#E31B23"></path>
              <path d="M32 43c6-4 13-6 21-7-2 6-6 10-10 13-4 3-8 5-11 6V43Z" fill="#B22234"></path>
              <path d="m18 19 1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L18 19Z" fill="#0D1B3D"></path>
            </svg>}
            <span className="logo__text"><strong>{brandName}</strong><small>{brandTagline}</small></span>
          </a>
          <nav className="nav" id="public-navigation" aria-label="Navegação principal" data-nav="">
            {primaryNav.slice(0,2).map((item,index)=><a href={itemText(item,'url','#')} target={itemText(item,'target','_self')} rel={itemText(item,'target')==='_blank'?'noreferrer':undefined} key={`${itemText(item,'label')}-${index}`}>{itemText(item,'label')}</a>)}
            {visaMenu.length>0&&<div className="nav__dropdown"><button type="button" className="nav__trigger" aria-haspopup="true" aria-expanded="false" aria-controls="visa-menu">Vistos <span aria-hidden="true">⌄</span></button><div className="nav__menu" id="visa-menu">{visaMenu.map((item,index)=><a href={itemText(item,'url','#')} target={itemText(item,'target','_self')} rel={itemText(item,'target')==='_blank'?'noreferrer':undefined} key={`${itemText(item,'label')}-${index}`}><b>{itemText(item,'label')}</b><small>{itemText(item,'description')}</small></a>)}</div></div>}
            {primaryNav.slice(2).map((item,index)=><a href={itemText(item,'url','#')} target={itemText(item,'target','_self')} rel={itemText(item,'target')==='_blank'?'noreferrer':undefined} key={`${itemText(item,'label')}-${index+2}`}>{itemText(item,'label')}</a>)}
          </nav>
          <div className="header__actions">
            <a className="btn btn--small btn--primary" href={cmsText(values.headerCtaUrl,'#diagnostico')} target={headerCtaTarget} rel={headerCtaTarget==='_blank'?'noreferrer':undefined}>{cmsText(values.headerCtaLabel,'Analisar meu perfil')}</a>
            <button className="menu-button" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="public-navigation" data-menu-button=""><span></span><span></span><span></span></button>
          </div>
        </div>
      </header>
    </>
  );
}
