const SAFE_PUBLIC_FIELD_TYPES=new Set(['text','tel','email','select','textarea'] as const);
const SAFE_PUBLIC_FIELD_NAME=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const RESERVED_PUBLIC_FIELD_NAMES=new Set(['consent']);

export const MAX_PUBLIC_FORM_FIELDS=30;
export const MAX_PUBLIC_SELECT_OPTIONS=100;
export type PublicFormFieldType='text'|'tel'|'email'|'select'|'textarea';

export function safePublicFieldType(value:string|undefined):PublicFormFieldType{
 const type=(value??'').trim().toLowerCase();
 return SAFE_PUBLIC_FIELD_TYPES.has(type as PublicFormFieldType)?type as PublicFormFieldType:'text';
}

export function safePublicFieldName(value:string|undefined,index:number,usedNames:Set<string>){
 const raw=(value??'').trim();
 const candidate=SAFE_PUBLIC_FIELD_NAME.test(raw)&&!RESERVED_PUBLIC_FIELD_NAMES.has(raw.toLowerCase())?raw:`field-${index+1}`;
 const base=candidate.slice(0,72)||`field-${index+1}`;
 let name=base;let suffix=2;
 while(usedNames.has(name.toLowerCase())||RESERVED_PUBLIC_FIELD_NAMES.has(name.toLowerCase())){name=`${base}-${suffix++}`.slice(0,80)}
 usedNames.add(name.toLowerCase());
 return name;
}

export function safePublicSelectOptions(value:string|undefined){return(value??'').split('\n').map(option=>option.trim()).filter(Boolean).slice(0,MAX_PUBLIC_SELECT_OPTIONS)}
export function isValidPublicFieldName(value:unknown){return typeof value==='string'&&SAFE_PUBLIC_FIELD_NAME.test(value.trim())&&!RESERVED_PUBLIC_FIELD_NAMES.has(value.trim().toLowerCase())}
export function isValidPublicFieldType(value:unknown){return typeof value==='string'&&SAFE_PUBLIC_FIELD_TYPES.has(value.trim().toLowerCase() as PublicFormFieldType)}
