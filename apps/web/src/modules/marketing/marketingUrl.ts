const CONTROL_OR_BACKSLASH=/[\u0000-\u001f\u007f\\]/;

export function isSafeMarketingDestinationUrl(value:string){
 const candidate=value.trim();
 if(!candidate||CONTROL_OR_BACKSLASH.test(candidate))return false;
 try{
  const url=new URL(candidate);
  return (url.protocol==='https:'||url.protocol==='http:')&&!url.username&&!url.password;
 }catch{return false}
}
