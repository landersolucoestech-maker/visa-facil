import { apiRequest } from '../../shared/apiClient';
import { INTEGRATION_REGISTRY, isIntegrationRuntimeStatus, type IntegrationId, type IntegrationRuntimeStatus } from './integrationContract';

export type IntegrationListResponse={items:IntegrationRuntimeStatus[]};
export type IntegrationActionResponse={integration:IntegrationRuntimeStatus;authorizationUrl?:string};

function isRecord(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function isListResponse(value:unknown):value is IntegrationListResponse{return isRecord(value)&&Array.isArray(value.items)&&value.items.every(isIntegrationRuntimeStatus)}
function isActionResponse(value:unknown):value is IntegrationActionResponse{return isRecord(value)&&isIntegrationRuntimeStatus(value.integration)&&(value.authorizationUrl===undefined||typeof value.authorizationUrl==='string')}
function path(id:IntegrationId,action?:string){return `/v1/integrations/${encodeURIComponent(id)}${action?`/${action}`:''}`}

export async function getIntegrationStatuses(signal?:AbortSignal){
  const response=await apiRequest('/v1/integrations',{method:'GET',signal},isListResponse);
  const byId=new Map(response.items.map(item=>[item.id,item]));
  return INTEGRATION_REGISTRY.map(definition=>byId.get(definition.id)??{id:definition.id,state:'unconfigured' as const});
}

export function connectIntegration(id:IntegrationId){return apiRequest(path(id,'connect'),{method:'POST',body:JSON.stringify({})},isActionResponse)}
export function disconnectIntegration(id:IntegrationId){return apiRequest(path(id,'disconnect'),{method:'POST',body:JSON.stringify({})},isActionResponse)}
export function syncIntegration(id:IntegrationId){return apiRequest(path(id,'sync'),{method:'POST',body:JSON.stringify({})},isActionResponse)}
