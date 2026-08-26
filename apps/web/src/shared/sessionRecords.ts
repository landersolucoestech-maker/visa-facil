export type SessionRecord = { id: string };

function clone<T>(value:T):T{return structuredClone(value)}
function storage(){return typeof sessionStorage==='undefined'?null:sessionStorage}
function uniqueIds<T extends SessionRecord>(records:T[]){return new Set(records.map(record=>record.id)).size===records.length}

export function readSessionRecords<T extends SessionRecord>(key:string,fallback:()=>T[],validate:(value:unknown)=>value is T):T[]{
 const initial=()=>clone(fallback()).filter(validate);
 const store=storage();
 if(!store)return initial();
 try{
  const raw=store.getItem(key);
  if(!raw){const next=initial();try{store.setItem(key,JSON.stringify(next))}catch{}return next}
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed)||!parsed.every(validate)||!uniqueIds(parsed)){const next=initial();try{store.setItem(key,JSON.stringify(next))}catch{}return next}
  return clone(parsed);
 }catch{
  const next=initial();
  try{store.setItem(key,JSON.stringify(next))}catch{}
  return next;
 }
}

export function writeSessionRecords<T extends SessionRecord>(key:string,records:T[],validate:(value:unknown)=>value is T):T[]{
 const next=clone(records);
 if(!next.every(validate)||!uniqueIds(next))throw new Error(`Invalid session record set for ${key}`);
 const store=storage();
 if(store){try{store.setItem(key,JSON.stringify(next))}catch{}}
 return next;
}
