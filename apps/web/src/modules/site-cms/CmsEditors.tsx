import { getAuthSession, signOut } from '../auth/auth';
import { AppSidebarIcon, type AppSidebarIconName } from '../../components/AppSidebarIcon';
import { sectionDefinition } from './siteSchema';
import type { CmsDocument, CmsFieldDefinition, CmsMediaItem, CmsPage, CmsRepeaterItem, CmsSectionInstance, CmsStatus, CmsValue } from './types';
import { go, href, now, statusLabel, type View } from './siteCmsUtils';

function CmsBrandMark(){return <span className="site-cms-brand-mark" aria-hidden="true"><i/><b/></span>}

export function CmsSidebar({view}:{view:View}){
 const session=getAuthSession();
 const nav:Array<{id:View;label:string;icon:AppSidebarIconName;path:string}>=[
  {id:'overview',label:'Visão Geral',icon:'overview',path:'/site-admin'},
  {id:'pages',label:'Páginas',icon:'pages',path:'/site-admin/pages'},
  {id:'media',label:'Mídia',icon:'media',path:'/site-admin/media'},
  {id:'globals',label:'Globais',icon:'globe',path:'/site-admin/globals'},
  {id:'settings',label:'Configurações',icon:'settings',path:'/site-admin/settings'},
 ];
 return <aside className="site-cms-sidebar">
  <div className="site-cms-sidebar-head">
   <a className="site-cms-brand" href={href('/site-admin')}><CmsBrandMark/><span><strong>VISA FÁCIL</strong><small>Gerenciador do site</small></span></a>
   <div className="site-cms-workspace-switch"><span>Ambiente</span><select value="website" aria-label="Selecionar ambiente" onChange={e=>{if(e.target.value==='crm')go('/crm');if(e.target.value==='selector')go('/workspaces')}}><option value="website">Gerenciador do site</option><option value="crm">CRM</option><option value="selector">Trocar workspace…</option></select></div>
  </div>
  <div className="site-cms-sidebar-body">
   <span className="site-cms-nav-label">Navegação</span>
   <nav>{nav.map(item=><a className={view===item.id?'is-active':''} href={href(item.path)} key={item.id}><AppSidebarIcon name={item.icon}/><span>{item.label}</span></a>)}</nav>
  </div>
  <div className="site-cms-sidebar-footer">
   <a className="site-cms-public-link" href={href('/')} target="_blank" rel="noreferrer"><AppSidebarIcon name="external"/><span>Site público</span></a>
   <div className="site-cms-user"><span>{(session?.name||'A').slice(0,2).toUpperCase()}</span><div><strong>{session?.name||'Administrador'}</strong><small>{session?.email||'Conta interna'}</small></div></div>
   <button onClick={()=>{signOut();go('/login')}}><AppSidebarIcon name="logout"/><span>Sair</span></button>
  </div>
 </aside>
}

export function StatusBadge({status}:{status:CmsStatus}){return <span className={`site-cms-status is-${status}`}>{statusLabel(status)}</span>}

export function FieldEditor({field,value,onChange,media}:{field:CmsFieldDefinition;value:CmsValue|undefined;onChange:(value:CmsValue)=>void;media:CmsMediaItem[]}){
 if(field.type==='repeater'){
  const items=Array.isArray(value)?value:[];
  const updateItem=(index:number,key:string,next:string|boolean)=>onChange(items.map((item,itemIndex)=>itemIndex===index?{...item,[key]:next}:item));
  const add=()=>{const blank=Object.fromEntries((field.itemFields||[]).map(item=>[item.id,item.type==='select'&&item.options?.includes('false')?'false':''])) as CmsRepeaterItem;onChange([...items,blank])};
  const move=(index:number,delta:number)=>{const target=index+delta;if(target<0||target>=items.length)return;const next=[...items];[next[index],next[target]]=[next[target],next[index]];onChange(next)};
  return <div className="site-cms-field site-cms-field--repeater"><div className="site-cms-field-heading"><div><span>{field.label}</span>{field.help&&<small>{field.help}</small>}</div><button type="button" onClick={add}>+ Adicionar</button></div><div className="site-cms-repeater-list">{items.length===0&&<div className="site-cms-empty-mini">Nenhum item cadastrado.</div>}{items.map((item,index)=><article className="site-cms-repeater-item" key={index}><header><b>Item {index+1}</b><div><button type="button" onClick={()=>move(index,-1)} disabled={index===0}>↑</button><button type="button" onClick={()=>move(index,1)} disabled={index===items.length-1}>↓</button><button type="button" className="is-danger" onClick={()=>onChange(items.filter((_,itemIndex)=>itemIndex!==index))}>Remover</button></div></header><div className="site-cms-repeater-grid">{(field.itemFields||[]).map(itemField=>{const raw=item[itemField.id];const stringValue=typeof raw==='boolean'?String(raw):String(raw||'');if(itemField.type==='textarea')return <label className="is-wide" key={itemField.id}><span>{itemField.label}</span><textarea value={stringValue} rows={3} onChange={e=>updateItem(index,itemField.id,e.target.value)}/></label>;if(itemField.type==='select')return <label key={itemField.id}><span>{itemField.label}</span><select value={stringValue} onChange={e=>updateItem(index,itemField.id,e.target.value)}>{(itemField.options||[]).map(option=><option key={option}>{option}</option>)}</select></label>;if(itemField.type==='image')return <label className="is-wide" key={itemField.id}><span>{itemField.label}</span><div className="site-cms-image-input"><input value={stringValue} onChange={e=>updateItem(index,itemField.id,e.target.value)} placeholder="URL ou mídia"/><select value="" onChange={e=>e.target.value&&updateItem(index,itemField.id,e.target.value)}><option value="">Escolher da mídia…</option>{media.filter(asset=>asset.kind==='image').map(asset=><option value={asset.url} key={asset.id}>{asset.name}</option>)}</select></div>{stringValue&&<img className="site-cms-image-preview" src={stringValue} alt="Prévia"/>}</label>;return <label key={itemField.id}><span>{itemField.label}</span><input type={itemField.type==='url'?'url':'text'} value={stringValue} onChange={e=>updateItem(index,itemField.id,e.target.value)}/></label>})}</div></article>)}</div></div>
 }
 if(field.type==='textarea')return <label className="site-cms-field"><span>{field.label}</span>{field.help&&<small>{field.help}</small>}<textarea rows={5} value={typeof value==='string'?value:''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder}/></label>;
 if(field.type==='select')return <label className="site-cms-field"><span>{field.label}</span><select value={typeof value==='string'?value:''} onChange={e=>onChange(e.target.value)}>{(field.options||[]).map(option=><option key={option}>{option}</option>)}</select></label>;
 if(field.type==='image'){const current=typeof value==='string'?value:'';return <label className="site-cms-field"><span>{field.label}</span>{field.help&&<small>{field.help}</small>}<div className="site-cms-image-input"><input value={current} onChange={e=>onChange(e.target.value)} placeholder="URL da imagem"/><select value="" onChange={e=>e.target.value&&onChange(e.target.value)}><option value="">Escolher da mídia…</option>{media.filter(asset=>asset.kind==='image').map(asset=><option value={asset.url} key={asset.id}>{asset.name}</option>)}</select></div>{current&&<img className="site-cms-image-preview" src={current} alt="Prévia"/>}</label>}
 return <label className="site-cms-field"><span>{field.label}</span>{field.help&&<small>{field.help}</small>}<input type={field.type==='url'?'url':'text'} value={typeof value==='string'?value:''} onChange={e=>onChange(e.target.value)} placeholder={field.placeholder}/></label>
}

export function SectionEditor({section,document,onChange,onRemove}:{section:CmsSectionInstance;document:CmsDocument;onChange:(section:CmsSectionInstance)=>void;onRemove?:()=>void}){
 const definition=sectionDefinition(section.type);
 if(!definition)return <div className="site-cms-empty">Tipo de seção não reconhecido: {section.type}</div>;
 return <div className="site-cms-editor"><div className="site-cms-editor-heading"><div><span>SEÇÃO</span><h2>{section.label}</h2><p>{definition.description}</p></div><div className="site-cms-editor-tools"><label className="site-cms-visibility"><input type="checkbox" checked={section.visible} onChange={e=>onChange({...section,visible:e.target.checked})}/><span>{section.visible?'Visível':'Oculta'}</span></label>{onRemove&&<button className="site-cms-remove-section" onClick={onRemove}>Remover seção</button>}</div></div><div className="site-cms-fields">{definition.fields.map(field=><FieldEditor key={field.id} field={field} value={section.values[field.id]} media={document.media} onChange={value=>onChange({...section,values:{...section.values,[field.id]:value}})}/>)}</div></div>
}

export function SeoEditor({page,onChange,media}:{page:CmsPage;onChange:(page:CmsPage)=>void;media:CmsMediaItem[]}){
 const seo=page.seo;const set=<K extends keyof typeof seo>(key:K,value:(typeof seo)[K])=>onChange({...page,seo:{...seo,[key]:value},updatedAt:now()});
 return <div className="site-cms-editor"><div className="site-cms-editor-heading"><div><span>SEO DA PÁGINA</span><h2>Metadados</h2><p>Configurações utilizadas por buscadores e compartilhamentos.</p></div></div><div className="site-cms-form-grid"><label><span>Title</span><input value={seo.title} onChange={e=>set('title',e.target.value)}/><small>{seo.title.length}/60 caracteres</small></label><label className="is-wide"><span>Meta description</span><textarea rows={4} value={seo.description} onChange={e=>set('description',e.target.value)}/><small>{seo.description.length}/160 caracteres</small></label><label><span>OG Image</span><div className="site-cms-image-input"><input value={seo.ogImage} onChange={e=>set('ogImage',e.target.value)} placeholder="URL da imagem"/><select value="" onChange={e=>e.target.value&&set('ogImage',e.target.value)}><option value="">Escolher da mídia…</option>{media.filter(asset=>asset.kind==='image').map(asset=><option value={asset.url} key={asset.id}>{asset.name}</option>)}</select></div></label><label><span>Canonical URL</span><input value={seo.canonicalUrl} onChange={e=>set('canonicalUrl',e.target.value)}/></label><label className="site-cms-checkbox"><input type="checkbox" checked={seo.noIndex} onChange={e=>set('noIndex',e.target.checked)}/><span>Impedir indexação desta página</span></label></div></div>
}
