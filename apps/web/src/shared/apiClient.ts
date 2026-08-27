import { buildApiEndpoint, normalizeApiBaseUrl } from './apiBaseUrl';
import { readBoundedJsonResponse, ResponseBodyLimitError } from './boundedJsonResponse';

export type ApiErrorDetails={
  code:string;
  message:string;
  requestId?:string;
  retryable:boolean;
  status:number;
};

export class ApiClientError extends Error{
  readonly details:ApiErrorDetails;
  constructor(details:ApiErrorDetails){super(details.message);this.name='ApiClientError';this.details=details}
}

export function getApiBaseUrl():string|null{
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL,import.meta.env.DEV);
}

export function isBackendConfigured(){return getApiBaseUrl()!==null}

function endpoint(path:string){
  const base=getApiBaseUrl();
  if(!base)throw new ApiClientError({code:'BACKEND_NOT_CONFIGURED',message:'A API backend não está configurada neste ambiente.',retryable:false,status:0});
  const target=buildApiEndpoint(base,path);
  if(!target)throw new ApiClientError({code:'INVALID_API_PATH',message:'O caminho solicitado para a API é inválido.',retryable:false,status:0});
  return target;
}

function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}

async function toError(response:Response):Promise<ApiClientError>{
  let code='API_REQUEST_FAILED';
  let message=`A API respondeu com HTTP ${response.status}.`;
  let requestId=response.headers.get('x-request-id')||undefined;
  let retryable=response.status===408||response.status===429||response.status>=500;
  try{
    const payload:unknown=await readBoundedJsonResponse(response);
    if(isRecord(payload)){
      if(typeof payload.code==='string')code=payload.code;
      if(typeof payload.message==='string')message=payload.message;
      if(typeof payload.requestId==='string')requestId=payload.requestId;
      if(typeof payload.retryable==='boolean')retryable=payload.retryable;
      if(isRecord(payload.error)){
        if(typeof payload.error.code==='string')code=payload.error.code;
        if(typeof payload.error.message==='string')message=payload.error.message;
      }
    }
  }catch{ /* oversized, malformed or non-JSON error body: keep the HTTP fallback */ }
  return new ApiClientError({code,message,requestId,retryable,status:response.status});
}

export async function apiRequest<T>(path:string,init:RequestInit,validate:(value:unknown)=>value is T):Promise<T>{
  let response:Response;
  try{
    response=await fetch(endpoint(path),{
      ...init,
      credentials:'include',
      headers:{Accept:'application/json',...(init.body?{'Content-Type':'application/json'}:{}),...init.headers},
    });
  }catch(error){
    if(error instanceof ApiClientError)throw error;
    throw new ApiClientError({code:'NETWORK_ERROR',message:'Não foi possível alcançar a API backend.',retryable:true,status:0});
  }
  if(!response.ok)throw await toError(response);
  let payload:unknown;
  try{payload=await readBoundedJsonResponse(response)}catch(error){
    if(error instanceof ResponseBodyLimitError)throw new ApiClientError({code:'API_RESPONSE_TOO_LARGE',message:'A resposta da API excedeu o limite de tamanho permitido.',retryable:false,status:response.status});
    throw new ApiClientError({code:'INVALID_API_RESPONSE',message:'A API retornou JSON inválido ou ilegível.',retryable:false,status:response.status});
  }
  if(!validate(payload))throw new ApiClientError({code:'INVALID_API_RESPONSE',message:'A API retornou um contrato de dados inválido.',retryable:false,status:response.status});
  return payload;
}
