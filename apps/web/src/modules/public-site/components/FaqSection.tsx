import { cmsList, cmsText, itemText, usePageSection } from '../content/SiteContentContext';

export function FaqSection({sectionId='faq'}:{sectionId?:string}) {
  const section=usePageSection(sectionId);const values=section?.values||{};const questions=cmsList(values.questions);
  return <section className="section faq" id="duvidas"><div className="container faq__grid"><div className="faq__heading reveal"><span className="kicker">{cmsText(values.kicker)}</span><h2>{cmsText(values.title)}</h2><p>{cmsText(values.description)}</p><a className="btn btn--dark" href={cmsText(values.ctaUrl,'#diagnostico')} target={cmsText(values.ctaTarget,'_self')}>{cmsText(values.ctaLabel,'Falar com a equipe')}</a></div><div className="accordion reveal reveal--delay">{questions.map((item,index)=><article className={`accordion__item${index===0?' is-open':''}`} key={index}><button type="button"><span>{itemText(item,'question')}</span><i>+</i></button><div className="accordion__content"><p>{itemText(item,'answer')}</p></div></article>)}</div></div></section>
}
