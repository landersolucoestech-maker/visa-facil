export type SessionRecord = { id: string };

export class SessionRecordPersistenceError extends Error {
  readonly key: string;
  constructor(key: string) {
    super(`Não foi possível persistir os dados locais de ${key}.`);
    this.name = 'SessionRecordPersistenceError';
    this.key = key;
  }
}

function clone<T>(value:T):T{return structuredClone(value)}
function storage(){return typeof sessionStorage==='undefined'?null:sessionStorage}
function uniqueIds<T extends SessionRecord>(records:T[]){return new Set(records.map(record=>record.id)).size===records.length}
function tryPersist(store:Storage,key:string,value:string){try{store.setItem(key,value);return true}catch{return false}}

export function readSessionRecords<T extends SessionRecord>(key:string,fallback:()=>T[],validate:(value:unknown)=>value is T):T[]{
 const initial=()=>clone(fallback()).filter(validate);
 const store=storage();
 if(!store)return initial();
 try{
  const raw=store.getItem(key);
  if(!raw){const next=initial();tryPersist(store,key,JSON.stringify(next));return next}
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed)||!parsed.every(validate)||!uniqueIds(parsed)){const next=initial();tryPersist(store,key,JSON.stringify(next));return next}
  return clone(parsed);
 }catch{
  const next=initial();
  tryPersist(store,key,JSON.stringify(next));
  return next;
 }
}

export function writeSessionRecords<T extends SessionRecord>(key:string,records:T[],validate:(value:unknown)=>value is T):T[]{
 const next=clone(records);
 if(!next.every(validate)||!uniqueIds(next))throw new Error(`Invalid session record set for ${key}`);
 const store=storage();
 if(store&&!tryPersist(store,key,JSON.stringify(next)))throw new SessionRecordPersistenceError(key);
 return next;
}
