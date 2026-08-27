const SAFE_LINK_PROTOCOLS=new Set(['http:','https:','mailto:','tel:']);
const SAFE_IMAGE_PROTOCOLS=new Set(['http:','https:']);
const SAFE_RASTER_DATA_IMAGE=/^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i;
const CONTROL_CHARACTERS=/[\u0000-\u001f\u007f]/;
const URL_BASE='https://cms.local.invalid/';
const URL_BASE_ORIGIN=new URL(URL_BASE).origin;

function hasExplicitScheme(value:string){return/^[a-z][a-z0-9+.-]*:/i.test(value)}
function unsafeRelativePrefix(value:string){return value.startsWith('//')||value.startsWith('\\')}

export function cmsHref(value:string|undefined,fallback='#'){
 const href=(value??'').trim();
 if(!href||CONTROL_CHARACTERS.test(href)||unsafeRelativePrefix(href))return fallback;
 if(href.startsWith('#'))return href;
 try{
  const parsed=new URL(href,URL_BASE);
  if(!SAFE_LINK_PROTOCOLS.has(parsed.protocol))return fallback;
  if(hasExplicitScheme(href))return href;
  return parsed.origin===URL_BASE_ORIGIN?href:fallback;
 }catch{return fallback}
}

export function cmsImageSrc(value:string|undefined,fallback=''){
 const src=(value??'').trim();
 if(!src||CONTROL_CHARACTERS.test(src)||unsafeRelativePrefix(src))return fallback;
 if(SAFE_RASTER_DATA_IMAGE.test(src))return src;
 try{
  const parsed=new URL(src,URL_BASE);
  if(!SAFE_IMAGE_PROTOCOLS.has(parsed.protocol))return fallback;
  if(hasExplicitScheme(src))return src;
  return parsed.origin===URL_BASE_ORIGIN?src:fallback;
 }catch{return fallback}
}

export function cmsTarget(value:string|undefined){return value==='_blank'?'_blank':'_self'}
