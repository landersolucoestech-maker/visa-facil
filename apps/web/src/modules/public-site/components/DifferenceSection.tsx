import { cmsList, cmsText, itemText, usePageSection } from '../content/SiteContentContext';

export function DifferenceSection({sectionId='difference'}:{sectionId?:string}) {
  const section=usePageSection(sectionId);const values=section?.values||{};const items=cmsList(values.items);
  return <section className="section difference"><div className="container difference__grid"><div className="difference__heading reveal"><span className="kicker">{cmsText(values.kicker)}</span><h2>{cmsText(values.title)}</h2><p>{cmsText(values.description)}</p></div><div className="difference__items">{items.map((item,index)=><article className="reveal" key={index}><span>{itemText(item,'number',String(index+1).padStart(2,'0'))}</span><div><h3>{itemText(item,'title')}</h3><p>{itemText(item,'description')}</p></div></article>)}</div></div></section>
}
