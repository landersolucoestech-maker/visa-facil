import { SessionRecordPersistenceError, writeSessionRecords, type SessionRecord } from './sessionRecords';

export const LOCAL_PERSISTENCE_ERROR_EVENT='visa-local-persistence-error';
export type LocalPersistenceErrorDetail={key:string;message:string};

export function reportSessionPersistenceError(error:unknown,key:string){
 const detail:LocalPersistenceErrorDetail={
  key,
  message:error instanceof SessionRecordPersistenceError
   ? error.message
   : `Não foi possível persistir os dados locais de ${key}.`,
 };
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent<LocalPersistenceErrorDetail>(LOCAL_PERSISTENCE_ERROR_EVENT,{detail}));
}

export function safeWriteSessionRecords<T extends SessionRecord>(key:string,records:T[],validate:(value:unknown)=>value is T):T[]{
 try{return writeSessionRecords(key,records,validate)}
 catch(error){reportSessionPersistenceError(error,key);return structuredClone(records)}
}
