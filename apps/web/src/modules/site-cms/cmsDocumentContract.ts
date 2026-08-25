import type { CmsDocument, CmsMediaItem, CmsPage, CmsRepeaterItem, CmsSectionInstance, CmsSeo, CmsSettings, CmsStatus, CmsValue } from './types';

const VALID_PAGE_STATUSES=new Set<CmsStatus>(['draft','published','scheduled','hidden']);
const VALID_MEDIA_KINDS=new Set<CmsMediaItem['kind']>(['image','document']);

function isRecord(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value)}
function isString(value:unknown):value is string{return typeof value==='string'}
function isBoolean(value:unknown):value is boolean{return typeof value==='boolean'}
function isNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
function isRepeaterItem(value:unknown):value is CmsRepeaterItem{return isRecord(value)&&Object.values(value).every(item=>isString(item)||isBoolean(item))}
function isCmsValue(value:unknown):value is CmsValue{return isString(value)||isBoolean(value)||(Array.isArray(value)&&value.every(isRepeaterItem))}
function isSeo(value:unknown):value is CmsSeo{return isRecord(value)&&isString(value.title)&&isString(value.description)&&isString(value.ogImage)&&isString(value.canonicalUrl)&&isBoolean(value.noIndex)}
function isSection(value:unknown):value is CmsSectionInstance{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.type)&&value.type.trim().length>0&&isString(value.label)&&isBoolean(value.visible)&&isNumber(value.order)&&Number.isInteger(value.order)&&isRecord(value.values)&&Object.values(value.values).every(isCmsValue)}
function isPage(value:unknown):value is CmsPage{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.name)&&isString(value.slug)&&typeof value.status==='string'&&VALID_PAGE_STATUSES.has(value.status as CmsStatus)&&isString(value.scheduledAt)&&isString(value.updatedAt)&&isSeo(value.seo)&&Array.isArray(value.sections)&&value.sections.every(isSection)}
function isMedia(value:unknown):value is CmsMediaItem{return isRecord(value)&&isString(value.id)&&value.id.trim().length>0&&isString(value.name)&&isString(value.url)&&isString(value.alt)&&typeof value.kind==='string'&&VALID_MEDIA_KINDS.has(value.kind as CmsMediaItem['kind'])&&isString(value.createdAt)}
function isSettings(value:unknown):value is CmsSettings{return isRecord(value)&&isString(value.siteName)&&isString(value.siteUrl)&&isString(value.locale)&&isString(value.defaultOgImage)&&isString(value.organizationName)}
function hasUniqueIds<T extends {id:string}>(items:T[]){return new Set(items.map(item=>item.id)).size===items.length}

export function isCmsDocument(value:unknown):value is CmsDocument{
 if(!isRecord(value)||!isNumber(value.version)||!Number.isInteger(value.version)||value.version<1||!isString(value.updatedAt)||(value.publishedAt!==null&&!isString(value.publishedAt))||!Array.isArray(value.pages)||!value.pages.every(isPage)||!Array.isArray(value.globals)||!value.globals.every(isSection)||!Array.isArray(value.media)||!value.media.every(isMedia)||!isSettings(value.settings))return false;
 return hasUniqueIds(value.pages)&&hasUniqueIds(value.globals)&&hasUniqueIds(value.media)&&value.pages.every(page=>hasUniqueIds(page.sections));
}

export function parseCmsDocument(raw:string|null):CmsDocument|null{
 if(!raw)return null;
 try{const value:unknown=JSON.parse(raw);return isCmsDocument(value)?value:null}catch{return null}
}

export function normalizeCmsPath(path:string){return path==='/'?'/':path.replace(/\/+$/,'')||'/'}
