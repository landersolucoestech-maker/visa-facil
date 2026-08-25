import { cmsList, cmsText, itemText, usePageSection } from '../content/SiteContentContext';

export function PainPointsSection({sectionId='pain-points'}:{sectionId?:string}) {
  const section=usePageSection(sectionId);const values=section?.values||{};const items=cmsList(values.items);
  return <section className="section pain-points"><div className="container"><div className="section-heading section-heading--center reveal"><span className="kicker">{cmsText(values.kicker)}</span><h2>{cmsText(values.title)}</h2><p>{cmsText(values.description)}</p></div><div className="pain-points__grid">{items.map((item,index)=><article className={`reveal${index%2?' reveal--delay':''}`} key={index}><span>{itemText(item,'number',String(index+1).padStart(2,'0'))}</span><h3>{itemText(item,'title')}</h3><p>{itemText(item,'description')}</p></article>)}</div></div></section>
}
