import heroVisaFacil from '../assets/hero-visa-facil.webp';
import { cmsList, cmsText, itemText, usePageSection } from '../content/SiteContentContext';

export function HeroSection({sectionId='hero'}:{sectionId?:string}) {
  const section=usePageSection(sectionId);const values=section?.values||{};
  const slides=cmsList(values.slides);const trust=cmsList(values.trustItems);const mini=cmsList(values.miniBenefits);const confidence=cmsList(values.confidenceItems);
  const primaryTarget=cmsText(values.primaryCtaTarget,'_self');const secondaryTarget=cmsText(values.secondaryCtaTarget,'_self');
  return (
    <section className="hero" aria-label="Destaques VISA FÁCIL">
      <div className="hero-slider hero-slider--background" data-hero-slider="" role="region" aria-roledescription="carousel" aria-label="Destaques e campanhas">
        {slides.map((slide,index)=><article className={`hero-slide${index===0?' is-active':''}`} data-hero-slide="" role="group" aria-roledescription="slide" aria-label={`${index+1} de ${slides.length}`} aria-hidden={index!==0} key={`${itemText(slide,'image')}-${index}`}><img src={itemText(slide,'image')||heroVisaFacil} alt={itemText(slide,'alt','Destaque VISA FÁCIL')}/></article>)}
        {slides.length>1&&<><button type="button" className="hero-slider__side hero-slider__side--prev" aria-label="Banner anterior" data-hero-prev="">‹</button><button type="button" className="hero-slider__side hero-slider__side--next" aria-label="Próximo banner" data-hero-next="">›</button><div className="hero-slider__dots" aria-label="Selecionar banner">{slides.map((_,index)=><button className={`hero-slider__dot${index===0?' is-active':''}`} type="button" aria-label={`Mostrar banner ${index+1}`} aria-current={index===0?'true':'false'} data-hero-dot={index} key={index}/>)}</div></>}
      </div>
      <div className="container hero__grid"><div className="hero__content reveal"><h1>{cmsText(values.headlineLine1,'O caminho mais fácil')}<br/>{cmsText(values.headlineLine2,'para o seu visto')}<br/><em>{cmsText(values.headlineAccent,'começa aqui.')}</em></h1><div className="hero__trust">{trust.map((item,index)=><div key={index}><span className="check">✓</span><b>{itemText(item,'text')}</b></div>)}</div><div className="hero__mini-benefits" aria-label="Diferenciais do atendimento">{mini.map((item,index)=><div key={index}><span>{itemText(item,'icon','•')}</span><b>{itemText(item,'text')}</b></div>)}</div><div className="hero__actions"><a className="btn btn--primary btn--large" href={cmsText(values.primaryCtaUrl,'#diagnostico')} target={primaryTarget} rel={primaryTarget==='_blank'?'noreferrer':undefined}>{cmsText(values.primaryCtaLabel,'Analisar meu perfil')}</a><a className="btn btn--outline btn--large" href={cmsText(values.secondaryCtaUrl,'#servicos')} target={secondaryTarget} rel={secondaryTarget==='_blank'?'noreferrer':undefined}>{cmsText(values.secondaryCtaLabel,'Conhecer os serviços')}</a></div></div></div>
      <div className="container confidence-strip reveal">{confidence.map((item,index)=><div key={index}><b>{itemText(item,'title')}</b><span>{itemText(item,'description')}</span></div>)}</div>
    </section>
  );
}
