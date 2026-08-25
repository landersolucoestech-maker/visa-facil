import { cmsList, cmsText, itemText, usePageSection } from '../content/SiteContentContext';

export function ProcessSection({sectionId='process'}:{sectionId?:string}) {
  const section=usePageSection(sectionId);const values=section?.values||{};const steps=cmsList(values.steps);
  return <section className="section method" id="processo"><div className="container method__grid"><div className="method__heading reveal"><span className="kicker">{cmsText(values.kicker)}</span><h2>{cmsText(values.title)}</h2><p>{cmsText(values.description)}</p><a className="text-link text-link--light" href={cmsText(values.ctaUrl,'#diagnostico')} target={cmsText(values.ctaTarget,'_self')}>{cmsText(values.ctaLabel,'Começar agora')} <span>↗</span></a></div><div className="method__steps">{steps.map((item,index)=><article className="reveal" key={index}><span>{itemText(item,'number',String(index+1).padStart(2,'0'))}</span><div><h3>{itemText(item,'title')}</h3><p>{itemText(item,'description')}</p></div></article>)}</div></div></section>
}
