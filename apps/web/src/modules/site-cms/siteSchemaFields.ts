import type { CmsFieldDefinition } from './types';

export const text=(id:string,label:string,defaultValue:string,help?:string):CmsFieldDefinition=>({id,label,type:'text',defaultValue,help});
export const textarea=(id:string,label:string,defaultValue:string,help?:string):CmsFieldDefinition=>({id,label,type:'textarea',defaultValue,help});
export const url=(id:string,label:string,defaultValue:string):CmsFieldDefinition=>({id,label,type:'url',defaultValue});
export const image=(id:string,label:string,defaultValue:string,help?:string):CmsFieldDefinition=>({id,label,type:'image',defaultValue,help});
export const select=(id:string,label:string,defaultValue:string,options:string[]):CmsFieldDefinition=>({id,label,type:'select',defaultValue,options});
export const repeater=(id:string,label:string,defaultValue:Array<Record<string,string|boolean>>,itemFields:CmsFieldDefinition['itemFields'],help?:string):CmsFieldDefinition=>({id,label,type:'repeater',defaultValue,help,itemFields});

export const navFields:NonNullable<CmsFieldDefinition['itemFields']>=[
  {id:'label',label:'Texto',type:'text'},
  {id:'url',label:'Destino',type:'url'},
  {id:'target',label:'Abrir em',type:'select',options:['_self','_blank']},
];
export const cardFields:NonNullable<CmsFieldDefinition['itemFields']>=[
  {id:'anchor',label:'Âncora',type:'text'},
  {id:'label',label:'Categoria',type:'text'},
  {id:'title',label:'Título',type:'text'},
  {id:'description',label:'Descrição',type:'textarea'},
  {id:'image',label:'Imagem',type:'image'},
  {id:'alt',label:'Texto alternativo',type:'text'},
  {id:'bullets',label:'Itens (um por linha)',type:'textarea'},
  {id:'ctaLabel',label:'Texto do CTA',type:'text'},
  {id:'ctaUrl',label:'Link do CTA',type:'url'},
  {id:'ctaTarget',label:'Abrir em',type:'select',options:['_self','_blank']},
];
export const titleDescriptionFields:NonNullable<CmsFieldDefinition['itemFields']>=[
  {id:'title',label:'Título',type:'text'},
  {id:'description',label:'Descrição',type:'textarea'},
];

