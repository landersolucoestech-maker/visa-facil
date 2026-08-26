export type ContractStatus=
 | 'draft'
 | 'review'
 | 'awaiting_signature'
 | 'signed'
 | 'active'
 | 'expired'
 | 'terminated'
 | 'cancelled';

export type ContractSignatureState='not_sent'|'pending'|'partially_signed'|'signed'|'rejected'|'expired'|'cancelled';
export type ContractSignerStatus='pending'|'signed'|'rejected'|'expired';
export type ContractVariableType='text'|'textarea'|'number'|'date'|'currency'|'email'|'cpf'|'passport';
export type ContractAuditEventType='created'|'updated'|'status_changed'|'signature_sent'|'signature_event'|'cancelled';

export type ContractParty={
 id:string;
 role:'client'|'representative'|'witness'|'other';
 source:'crm'|'manual';
 crmRecordId?:string;
 name:string;
 cpf:string;
 rg:string;
 passportNumber:string;
 email:string;
 phone:string;
};

export type ContractSigner={
 id:string;
 name:string;
 email:string;
 role:string;
 required:boolean;
 order:number;
 status:ContractSignerStatus;
 signedAt?:string;
};

export type ContractVersion={
 id:string;
 label:string;
 content:string;
 note:string;
 createdAt:string;
};

export type ContractAuditEvent={
 id:string;
 type:ContractAuditEventType;
 label:string;
 detail?:string;
 createdAt:string;
};

export type ContractRecord={
 id:string;
 title:string;
 templateId:string;
 status:ContractStatus;
 clientId?:string;
 serviceDescription:string;
 destination:string;
 visaType:string;
 value:number;
 startDate:string;
 endDate:string;
 notes:string;
 parties:ContractParty[];
 signers:ContractSigner[];
 variableValues:Record<string,string>;
 templateSnapshot:string;
 documentContent:string;
 signatureProvider:'autentique'|null;
 signatureState:ContractSignatureState;
 externalDocumentId?:string;
 signedAt?:string;
 versions:ContractVersion[];
 audit:ContractAuditEvent[];
 createdAt:string;
 updatedAt:string;
};

export type ContractTemplate={
 id:string;
 name:string;
 description:string;
 content:string;
 active:boolean;
 createdAt:string;
 updatedAt:string;
};

export type ContractVariableDefinition={
 id:string;
 group:string;
 field:string;
 placeholder:string;
 label:string;
 type:ContractVariableType;
 required:boolean;
 description:string;
 createdAt:string;
 updatedAt:string;
};

export type ContractEditorDraft={
 title:string;
 templateId:string;
 status:'draft'|'review';
 clientId:string;
 serviceDescription:string;
 destination:string;
 visaType:string;
 value:number;
 startDate:string;
 endDate:string;
 notes:string;
 parties:ContractParty[];
 signers:ContractSigner[];
 variableValues:Record<string,string>;
};

export const CONTRACT_STATUS_LABEL:Record<ContractStatus,string>={
 draft:'Rascunho',
 review:'Em revisão',
 awaiting_signature:'Aguardando assinatura',
 signed:'Assinado',
 active:'Vigente',
 expired:'Expirado',
 terminated:'Rescindido',
 cancelled:'Cancelado',
};

export const CONTRACT_SIGNATURE_LABEL:Record<ContractSignatureState,string>={
 not_sent:'Não enviado',
 pending:'Aguardando assinatura',
 partially_signed:'Parcialmente assinado',
 signed:'Assinado',
 rejected:'Rejeitado',
 expired:'Expirado',
 cancelled:'Cancelado',
};
