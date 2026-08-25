import { apiRequest } from '../../../shared/apiClient';

export type PublicLeadPayload={
  source:'public-site';
  page:string;
  fields:Record<string,string|boolean>;
};
export type PublicLeadResponse={leadId:string;receivedAt:string};

function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isLeadResponse(value:unknown):value is PublicLeadResponse{return isRecord(value)&&typeof value.leadId==='string'&&value.leadId.trim().length>0&&typeof value.receivedAt==='string'&&Number.isFinite(Date.parse(value.receivedAt))}

function normalizeForm(form:HTMLFormElement):Record<string,string|boolean>{
  const data=new FormData(form);
  const fields:Record<string,string|boolean>={};
  for(const [key,raw] of data.entries()){
    if(typeof raw!=='string')continue;
    const cleanKey=key.trim().slice(0,80);
    if(!cleanKey)continue;
    fields[cleanKey]=raw.trim().slice(0,4000);
  }
  const consent=form.querySelector<HTMLInputElement>('input[name="consent"]');
  fields.consent=Boolean(consent?.checked);
  return fields;
}

export function createPublicLeadPayload(form:HTMLFormElement):PublicLeadPayload{
  return {source:'public-site',page:window.location.pathname,fields:normalizeForm(form)};
}

export function submitPublicLead(payload:PublicLeadPayload){
  return apiRequest('/v1/public/leads',{method:'POST',body:JSON.stringify(payload)},isLeadResponse);
}
