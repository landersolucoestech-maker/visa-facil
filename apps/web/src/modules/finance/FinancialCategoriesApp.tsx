import { useState } from 'react';
import './finance-config.css';
import { getFinanceCategories, saveFinanceCategories, type FinanceCategory } from './financeConfigStore';
import type { FinanceType } from './types';

type Mode='create'|'view'|'edit';
function base(){return import.meta.env.BASE_URL.replace(/\/$/,'')}
function href(path:string){return `${base()}${path}`||path}

function CategoryModal({mode,item,onClose,onSave,existing}:{mode:Mode;item?:FinanceCategory;onClose:()=>void;onSave:(value:Omit<FinanceCategory,'id'>)=>void;existing:FinanceCategory[]}){
 const [name,setName]=useState(item?.name??'');
 const [type,setType]=useState<FinanceType>(item?.type??'Receita');
 const [active,setActive]=useState(item?.active??true);
 const duplicate=existing.some(category=>category.id!==item?.id&&category.name.trim().toLocaleLowerCase('pt-BR')===name.trim().toLocaleLowerCase('pt-BR'));
 if(mode==='view'&&item)return <div className="finance-modal-backdrop" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><div className="finance-view-modal"><header><div><span>CATEGORIA FINANCEIRA</span><h2>{item.name}</h2><p>Configuração válida nesta sessão</p></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header><section className="finance-view-body"><div className="finance-view-grid"><div><span>Nome</span><strong>{item.name}</strong></div><div><span>Tipo</span><strong>{item.type}</strong></div><div><span>Status</span><strong>{item.active?'Ativa':'Inativa'}</strong></div></div></section><footer><button className="crm-btn-secondary" type="button" onClick={onClose}>Fechar</button></footer></div></div>;
 return <div className="finance-modal-backdrop" onMouseDown={event=>event.currentTarget===event.target&&onClose()}><div className="finance-form-modal"><header><div><span>{mode==='create'?'CRIAR CATEGORIA':'EDITAR CATEGORIA'}</span><h2>{mode==='create'?'Nova categoria financeira':'Editar categoria financeira'}</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header><form onSubmit={event=>{event.preventDefault();const clean=name.trim();if(clean&&!duplicate)onSave({name:clean,type,active})}}><div className="finance-form-grid"><label><span>Nome</span><input value={name} onChange={event=>setName(event.target.value)} required/></label><label><span>Tipo</span><select value={type} onChange={event=>setType(event.target.value as FinanceType)}><option>Receita</option><option>Despesa</option></select></label><label><span>Status</span><select value={active?'Ativa':'Inativa'} onChange={event=>setActive(event.target.value==='Ativa')}><option>Ativa</option><option>Inativa</option></select></label></div>{duplicate&&<p className="finance-config-note" role="alert">Já existe uma categoria com esse nome.</p>}<footer><button type="button" className="crm-btn-secondary" onClick={onClose}>Cancelar</button><button type="submit" className="crm-btn-primary" disabled={!name.trim()||duplicate}>Salvar</button></footer></form></div></div>;
}

export function FinancialCategoriesApp(){
 const [items,setItems]=useState<FinanceCategory[]>(()=>getFinanceCategories());
 const [modal,setModal]=useState<{mode:Mode;item?:FinanceCategory}>();
 const [menu,setMenu]=useState<string>();
 const commit=(next:FinanceCategory[])=>{setItems(next);saveFinanceCategories(next)};
 const save=(value:Omit<FinanceCategory,'id'>)=>{const next=modal?.item?items.map(item=>item.id===modal.item!.id?{...item,...value}:item):[{id:crypto.randomUUID(),...value},...items];commit(next);setModal(undefined)};
 const remove=(item:FinanceCategory)=>{setMenu(undefined);if(window.confirm(`Excluir a categoria “${item.name}”?`))commit(items.filter(candidate=>candidate.id!==item.id))};
 return <div className="crm-shell finance-shell"><div className="crm-workspace"><header className="crm-topbar"><div><small>VISA FÁCIL · CRM · FINANCEIRO</small><h1>Categorias Financeiras</h1><p>Fonte canônica de categorias utilizada pelas transações e regras nesta sessão.</p></div><div className="crm-topbar-actions finance-header-actions"><a className="finance-header-nav-button" href={href('/crm/financeiro')}>← Transações</a><button className="crm-topbar-primary" type="button" onClick={()=>setModal({mode:'create'})}>+ Criar</button></div></header><main className="finance-content"><section className="finance-config-card"><div className="finance-simple-table"><div className="finance-simple-head finance-simple-head--actions"><span>Categoria</span><span>Tipo</span><span>Status</span><span>Ações</span></div>{items.map(item=><div className="finance-simple-row finance-simple-row--actions" key={item.id}><strong>{item.name}</strong><span>{item.type}</span><b className={item.active?'is-active':''}>{item.active?'Ativa':'Inativa'}</b><div className="finance-row-actions"><button className="finance-actions-trigger" type="button" aria-label={`Ações de ${item.name}`} onClick={()=>setMenu(menu===item.id?undefined:item.id)}>⋮</button>{menu===item.id&&<div className="finance-actions-menu"><button type="button" onClick={()=>{setMenu(undefined);setModal({mode:'view',item})}}>Ver</button><button type="button" onClick={()=>{setMenu(undefined);setModal({mode:'edit',item})}}>Editar</button><button type="button" className="is-danger" onClick={()=>remove(item)}>Excluir</button></div>}</div></div>)}</div><p className="finance-config-note">As alterações persistem apenas nesta sessão do navegador. Elas não são enviadas para servidor porque este repositório não possui backend financeiro.</p></section></main>{modal&&<CategoryModal mode={modal.mode} item={modal.item} existing={items} onClose={()=>setModal(undefined)} onSave={save}/>}</div></div>;
}

export default FinancialCategoriesApp;
