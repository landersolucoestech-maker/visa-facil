import type { OfficialAuthorizationProvider } from './integrationContract';

const OFFICIAL_AUTH_HOSTS:Record<OfficialAuthorizationProvider,readonly string[]>={
 meta:['www.facebook.com','business.facebook.com'],
 google:['accounts.google.com'],
 tiktok:['www.tiktok.com'],
};

const CONTROL_OR_BACKSLASH=/[\u0000-\u001f\u007f\\]/;

export function officialAuthorizationUrl(provider:OfficialAuthorizationProvider,value:string):string|null{
 const candidate=value.trim();
 if(!candidate||CONTROL_OR_BACKSLASH.test(candidate))return null;
 try{
  const url=new URL(candidate);
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  if(!OFFICIAL_AUTH_HOSTS[provider].includes(url.hostname))return null;
  return url.toString();
 }catch{return null}
}

export function isOfficialAuthorizationUrl(provider:OfficialAuthorizationProvider,value:string){
 return officialAuthorizationUrl(provider,value)!==null;
}
