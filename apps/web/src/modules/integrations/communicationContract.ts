export type CommunicationProviderClass='telecom-carrier'|'cloud-communications'|'custom';
export type CommunicationChannel='sms'|'voice';
export type CommunicationEndpointKind='physical-line'|'virtual-number'|'sender-id';
export type CommunicationConnectionState='unconfigured'|'pending'|'connected'|'degraded'|'disconnected'|'error';
export type CommunicationDirection='inbound'|'outbound';
export type CommunicationDeliveryStatus='queued'|'submitted'|'sent'|'delivered'|'undelivered'|'failed'|'received'|'read'|'unknown';
export type CommunicationCapability=
 |'sms-outbound'
 |'sms-inbound'
 |'voice-outbound'
 |'voice-inbound'
 |'physical-lines'
 |'virtual-numbers'
 |'sender-ids'
 |'delivery-status'
 |'webhooks';

/**
 * Provider keys intentionally remain strings instead of a closed union.
 * Adding another carrier/CPaaS/UCaaS adapter must not require changing the
 * communication domain model or the records already persisted by a backend.
 */
export type CommunicationProviderKey=string;

export type CommunicationProviderDefinition={
 key:CommunicationProviderKey;
 name:string;
 providerClass:CommunicationProviderClass;
 channels:CommunicationChannel[];
 targetCapabilities:CommunicationCapability[];
 connectionStrategy:'carrier-contract'|'provider-api'|'provider-oauth'|'hybrid'|'provider-specific';
 configurationHints:string[];
 availability:'provider-dependent';
};

/**
 * Catalog entries describe adapter targets only. They do not mean that an API,
 * commercial plan, number type or capability is currently contracted or live.
 * Exact availability is resolved server-side by the selected provider adapter.
 */
export const COMMUNICATION_PROVIDER_CATALOG:CommunicationProviderDefinition[]=[
 {key:'vivo',name:'Vivo',providerClass:'telecom-carrier',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','physical-lines','delivery-status'],connectionStrategy:'carrier-contract',configurationHints:['Contrato/plano empresarial compatível','Linha ou número provisionado','Adapter/API/gateway disponibilizado pela operadora quando aplicável'],availability:'provider-dependent'},
 {key:'tim',name:'TIM',providerClass:'telecom-carrier',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','physical-lines','delivery-status'],connectionStrategy:'carrier-contract',configurationHints:['Contrato/plano empresarial compatível','Linha ou número provisionado','Adapter/API/gateway disponibilizado pela operadora quando aplicável'],availability:'provider-dependent'},
 {key:'claro',name:'Claro',providerClass:'telecom-carrier',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','physical-lines','delivery-status'],connectionStrategy:'carrier-contract',configurationHints:['Contrato/plano empresarial compatível','Linha ou número provisionado','Adapter/API/gateway disponibilizado pela operadora quando aplicável'],availability:'provider-dependent'},
 {key:'traditional-carrier',name:'Outra operadora de telefonia',providerClass:'telecom-carrier',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','physical-lines','delivery-status'],connectionStrategy:'provider-specific',configurationHints:['Contrato com a operadora','Linha/número/remetente','Credenciais ou gateway server-side quando fornecidos'],availability:'provider-dependent'},
 {key:'twilio',name:'Twilio',providerClass:'cloud-communications',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','virtual-numbers','sender-ids','delivery-status','webhooks'],connectionStrategy:'provider-api',configurationHints:['Conta do provedor','Referência server-side ao conjunto de credenciais','Números/remetentes e webhooks provisionados'],availability:'provider-dependent'},
 {key:'dialpad',name:'Dialpad',providerClass:'cloud-communications',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','virtual-numbers','delivery-status','webhooks'],connectionStrategy:'provider-specific',configurationHints:['Conta do provedor','Autorização/credenciais server-side conforme o adapter','Números e recursos habilitados na conta'],availability:'provider-dependent'},
 {key:'ringcentral',name:'RingCentral',providerClass:'cloud-communications',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','virtual-numbers','delivery-status','webhooks'],connectionStrategy:'provider-specific',configurationHints:['Conta do provedor','Autorização/credenciais server-side conforme o adapter','Números e recursos habilitados na conta'],availability:'provider-dependent'},
 {key:'cloud-communications',name:'Outro provedor IP/Internet',providerClass:'cloud-communications',channels:['sms','voice'],targetCapabilities:['sms-outbound','sms-inbound','voice-outbound','voice-inbound','virtual-numbers','sender-ids','delivery-status','webhooks'],connectionStrategy:'provider-specific',configurationHints:['Adapter compatível com o contrato canônico','Credenciais mantidas somente no backend','Rotas/números/remetentes provisionados'],availability:'provider-dependent'},
];

/** Secret values never belong in this browser contract. */
export type CommunicationProviderConnection={
 id:string;
 providerKey:CommunicationProviderKey;
 label:string;
 state:CommunicationConnectionState;
 credentialSetRef?:string;
 accountRef?:string;
 environment?:'sandbox'|'production';
 configuredCapabilities:CommunicationCapability[];
 lastCheckedAt?:string;
 errorCode?:string;
};

export type CommunicationEndpoint={
 id:string;
 providerConnectionId:string;
 kind:CommunicationEndpointKind;
 label:string;
 phoneNumber?:string;
 senderId?:string;
 providerEndpointRef?:string;
 channels:CommunicationChannel[];
 enabled:boolean;
};

export type CommunicationRoute={
 id:string;
 name:string;
 channel:CommunicationChannel;
 providerConnectionId:string;
 endpointId:string;
 priority:number;
 enabled:boolean;
 countryCodes?:string[];
 tags?:string[];
};

export type CommunicationRecordLink={
 crmRecordId?:string;
 attendanceConversationId?:string;
 contractId?:string;
 taskId?:string;
 invoiceId?:string;
};

export type CommunicationMessageRecord={
 id:string;
 providerKey:CommunicationProviderKey;
 providerConnectionId:string;
 providerMessageId?:string;
 routeId?:string;
 endpointId?:string;
 channel:'sms';
 direction:CommunicationDirection;
 from:string;
 to:string;
 body:string;
 status:CommunicationDeliveryStatus;
 statusReason?:string;
 link?:CommunicationRecordLink;
 createdAt:string;
 submittedAt?:string;
 sentAt?:string;
 deliveredAt?:string;
 receivedAt?:string;
 updatedAt:string;
};

export type SendSmsCommand={
 connection:CommunicationProviderConnection;
 route:CommunicationRoute;
 endpoint:CommunicationEndpoint;
 to:string;
 body:string;
 clientMessageId:string;
 link?:CommunicationRecordLink;
};
export type ProviderSendResult={providerMessageId:string;status:CommunicationDeliveryStatus;acceptedAt?:string};
export type CommunicationInboundEvent={providerMessageId:string;from:string;to:string;body:string;receivedAt:string};
export type CommunicationDeliveryEvent={providerMessageId:string;status:CommunicationDeliveryStatus;occurredAt:string;reason?:string};

/**
 * Future backend adapter boundary. SDKs and provider payloads must stay behind
 * this interface; CRM/VisaChat consume only the canonical records above.
 */
export interface CommunicationProviderAdapter{
 readonly providerKey:CommunicationProviderKey;
 sendSms(command:SendSmsCommand):Promise<ProviderSendResult>;
 listEndpoints?(connection:CommunicationProviderConnection):Promise<CommunicationEndpoint[]>;
 normalizeInboundEvent(payload:unknown,headers:Record<string,string|undefined>):CommunicationInboundEvent|null;
 normalizeDeliveryEvent(payload:unknown,headers:Record<string,string|undefined>):CommunicationDeliveryEvent|null;
}

export function communicationProviderByKey(key:string){return COMMUNICATION_PROVIDER_CATALOG.find(provider=>provider.key===key)}
export function communicationProvidersByClass(providerClass:CommunicationProviderClass){return COMMUNICATION_PROVIDER_CATALOG.filter(provider=>provider.providerClass===providerClass)}
