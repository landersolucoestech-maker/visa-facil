const CONTROL_OR_BACKSLASH=/[\u0000-\u001f\u007f\\]/;
const ABSOLUTE_SCHEME=/^[A-Za-z][A-Za-z0-9+.-]*:/;

function trimSlash(value:string){return value.replace(/\/+$/,'')}
function hasTraversal(path:string){return path.split('?')[0].split('/').some(segment=>segment==='.'||segment==='..')}

export function normalizeApiBaseUrl(raw:string|undefined,allowHttp=false):string|null{
 const value=raw?.trim();
 if(!value||CONTROL_OR_BACKSLASH.test(value))return null;
 if(value.startsWith('/')){
  if(value.startsWith('//')||value.includes('?')||value.includes('#')||hasTraversal(value))return null;
  return trimSlash(value)||'/';
 }
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'&&!(allowHttp&&url.protocol==='http:'))return null;
  if(url.username||url.password||url.search||url.hash)return null;
  return trimSlash(url.toString());
 }catch{return null}
}

export function buildApiEndpoint(base:string,path:string):string|null{
 const value=path.trim();
 if(!value||CONTROL_OR_BACKSLASH.test(value)||value.startsWith('//')||value.includes('#')||ABSOLUTE_SCHEME.test(value)||hasTraversal(value))return null;
 const clean=value.startsWith('/')?value:`/${value}`;
 if(clean.startsWith('//'))return null;
 return base==='/'?clean:`${base}${clean}`;
}
