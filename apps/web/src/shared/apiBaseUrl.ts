const CONTROL_OR_BACKSLASH=/[\u0000-\u001f\u007f\\]/;

function trimSlash(value:string){return value.replace(/\/+$/,'')}

export function normalizeApiBaseUrl(raw:string|undefined,allowHttp=false):string|null{
 const value=raw?.trim();
 if(!value||CONTROL_OR_BACKSLASH.test(value))return null;
 if(value.startsWith('/')){
  if(value.startsWith('//')||value.includes('?')||value.includes('#'))return null;
  const segments=value.split('/');
  if(segments.includes('.')||segments.includes('..'))return null;
  return trimSlash(value)||'/';
 }
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'&&!(allowHttp&&url.protocol==='http:'))return null;
  if(url.username||url.password||url.search||url.hash)return null;
  return trimSlash(url.toString());
 }catch{return null}
}
