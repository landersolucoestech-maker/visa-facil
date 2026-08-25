import { cmsList, cmsText, itemText, usePageSection } from '../content/SiteContentContext';

export function ServicesIntroSection({sectionId='services-intro'}:{sectionId?:string}){
 const section=usePageSection(sectionId);const values=section?.values||{};
 return <section className="section intro" id="servicos"><div className="container intro__grid"><div className="section-heading reveal"><span className="kicker">{cmsText(values.kicker,'O que fazemos')}</span><h2>{cmsText(values.title)}</h2></div><div className="intro__copy reveal reveal--delay"><p>{cmsText(values.description)}</p><a className="text-link" href={cmsText(values.ctaUrl,'#diagnostico')} target={cmsText(values.ctaTarget,'_self')}>{cmsText(values.ctaLabel,'Descobrir por onde começar')} <span>↗</span></a></div></div></section>
}

export function ServicesGridSection({sectionId='services'}:{sectionId?:string}){
 const section=usePageSection(sectionId);const values=section?.values||{};const cards=cmsList(values.cards);const supports=cmsList(values.supportCards);
 return <section className="section services" id="vistos"><div className="container"><div className="services__grid">{cards.map((item,index)=>{const bullets=itemText(item,'bullets').split('\n').map(v=>v.trim()).filter(Boolean);return <article className={`service-card${index===0?' service-card--featured':''} reveal${index%2?' reveal--delay':''}`} id={itemText(item,'anchor')||undefined} key={`${itemText(item,'title')}-${index}`}><div className="service-card__image"><img src={itemText(item,'image')} alt={itemText(item,'alt',itemText(item,'title'))}/><span className="service-card__number">{String(index+1).padStart(2,'0')}</span></div><div className="service-card__body"><span className="service-card__label">{itemText(item,'label')}</span><h3>{itemText(item,'title')}</h3><p>{itemText(item,'description')}</p>{bullets.length>0&&<ul>{bullets.map(bullet=><li key={bullet}>{bullet}</li>)}</ul>}<a href={itemText(item,'ctaUrl','#diagnostico')} target={itemText(item,'ctaTarget','_self')} rel={itemText(item,'ctaTarget')==='_blank'?'noreferrer':undefined}>{itemText(item,'ctaLabel','Saiba mais')} <span>→</span></a></div></article>})}</div><div className="support-services reveal">{supports.map((item,index)=><article key={index}><span className="support-services__icon">{itemText(item,'icon','✓')}</span><div><h4>{itemText(item,'title')}</h4><p>{itemText(item,'description')}</p></div></article>)}</div></div></section>
}

export function ServicesSection(){return <><ServicesIntroSection/><ServicesGridSection/></>}
