import raw from '../../../mocks/settings/settings.dev.json';
import { isMockDataEnabled } from '../../../shared/runtimeFlags';
import type { AutomationKey, Company, Role, UserRecord } from '../settingsShared';

const AUTOMATION_KEYS:AutomationKey[]=['email','push','newLead','leadFollowup','financeMovement','weeklyFinance','weeklyReport','criticalAlerts','operational','backup'];
const USER_STATUSES=new Set<UserRecord['status']>(['Ativo','Inativo','Pendente']);
function isObject(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isString(value:unknown):value is string{return typeof value==='string'}
function isCompany(value:unknown):value is Company{return isObject(value)&&['companyName','fantasyName','cnpj','address','phone','responsible','slug'].every(key=>isString(value[key]))}
function isAutomations(value:unknown):value is Record<AutomationKey,boolean>{return isObject(value)&&AUTOMATION_KEYS.every(key=>typeof value[key]==='boolean')}
function isUser(value:unknown):value is UserRecord{return isObject(value)&&isString(value.id)&&isString(value.name)&&isString(value.email)&&isString(value.role)&&typeof value.status==='string'&&USER_STATUSES.has(value.status as UserRecord['status'])}
function isRole(value:unknown):value is Role{return isObject(value)&&isString(value.id)&&isString(value.name)&&isString(value.description)&&Array.isArray(value.permissions)&&value.permissions.every(isString)&&(value.system===undefined||typeof value.system==='boolean')}
function source(){const clone:unknown=structuredClone(raw);return isObject(clone)?clone:undefined}

export function getSettingsCompanyMock():Company|undefined{if(!isMockDataEnabled())return;const fixture=source();return fixture&&isCompany(fixture.company)?fixture.company:undefined}
export function getSettingsAutomationMock():Record<AutomationKey,boolean>|undefined{if(!isMockDataEnabled())return;const fixture=source();return fixture&&isAutomations(fixture.automations)?fixture.automations:undefined}
export function getSettingsUserMocks():UserRecord[]{if(!isMockDataEnabled())return[];const fixture=source();return fixture&&Array.isArray(fixture.users)?fixture.users.filter(isUser):[]}
export function getSettingsRoleMocks():Role[]{if(!isMockDataEnabled())return[];const fixture=source();return fixture&&Array.isArray(fixture.roles)?fixture.roles.filter(isRole):[]}
