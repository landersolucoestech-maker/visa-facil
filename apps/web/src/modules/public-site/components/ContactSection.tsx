import { useState, type FormEvent } from 'react';
import { ApiClientError, isBackendConfigured } from '../../../shared/apiClient';
import { createPublicLeadPayload, submitPublicLead } from '../services/publicLeadService';
import { cmsList, cmsText, itemBool, itemText, usePageSection } from '../content/SiteContentContext';
import { MAX_PUBLIC_FORM_FIELDS, safePublicFieldName, safePublicFieldType, safePublicSelectOptions } from '../content/publicFormSafety';

export function ContactSection({sectionId='contact'}:{sectionId?:string}) {
  const section=usePageSection(sectionId);const values=section?.values||{};const assurances=cmsList(values.assurances);const fields=cmsList(values.formFields);
  const backendConfigured=isBackendConfigured();
  const usedNames=new Set<string>(['consent']);
  const safeFields=fields.slice(0,MAX_PUBLIC_FORM_FIELDS).map((item,index)=>({item,index,name:safePublicFieldName(itemText(item,'name'),index,usedNames),type:safePublicFieldType(itemText(item,'type','text'))}));
  const [submitting,setSubmitting]=useState(false);
  const [feedback,setFeedback]=useState(backendConfigured?'':'Envio online indisponível enquanto a API backend não estiver configurada.');
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(!backendConfigured)return;
    const form=event.currentTarget;
    setSubmitting(true);setFeedback('Enviando…');
    try{
      await submitPublicLead(createPublicLeadPayload(form));
      form.reset();setFeedback('Solicitação recebida com sucesso.');
    }catch(error){
      setFeedback(error instanceof ApiClientError?error.message:'Não foi possível enviar a solicitação. Tente novamente.');
    }finally{setSubmitting(false)}
  };
  return <section className="section contact" id="diagnostico"><div className="container contact__card reveal"><div className="contact__copy"><span className="kicker kicker--light">{cmsText(values.kicker)}</span><h2>{cmsText(values.title)}</h2><p>{cmsText(values.description)}</p><div className="contact__assurances">{assurances.map((item,index)=><span key={index}>✓ {itemText(item,'text')}</span>)}</div></div><form className="contact__form" data-form="" onSubmit={submit}>{safeFields.map(({item,index,name,type})=>{const label=itemText(item,'label').trim()||`Campo ${index+1}`;const placeholder=itemText(item,'placeholder');const required=itemBool(item,'required');const full=type==='textarea';if(type==='select'){const options=safePublicSelectOptions(itemText(item,'options'));return <div className={`field${full?' field--full':''}`} key={name}><label htmlFor={name}>{label}</label><select id={name} name={name} required={required} disabled={!backendConfigured||submitting}><option value="">{placeholder||'Selecione'}</option>{options.map((option,optionIndex)=><option key={`${name}-${optionIndex}`} value={option}>{option}</option>)}</select></div>}if(type==='textarea')return <div className="field field--full" key={name}><label htmlFor={name}>{label}</label><textarea id={name} name={name} rows={4} placeholder={placeholder} required={required} disabled={!backendConfigured||submitting}></textarea></div>;return <div className="field" key={name}><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} placeholder={placeholder} required={required} disabled={!backendConfigured||submitting}/></div>})}<label className="consent field--full"><input type="checkbox" name="consent" required disabled={!backendConfigured||submitting}/><span>{cmsText(values.consentText)}</span></label><button className="btn btn--coral btn--large field--full" type="submit" disabled={!backendConfigured||submitting}>{submitting?'Enviando…':cmsText(values.submitLabel,'Enviar para análise')} <span>→</span></button><p className="form-feedback field--full" data-form-feedback="" role="status">{feedback}</p></form></div></section>
}
