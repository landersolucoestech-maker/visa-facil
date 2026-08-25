import test from 'node:test';
import assert from 'node:assert/strict';
import { readSessionRecords, writeSessionRecords } from '../../apps/web/src/shared/sessionRecords.ts';

function memoryStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key),
    clear:()=>values.clear(),
  };
}

function withSessionStorage(initial,callback){
  const previous=globalThis.sessionStorage;
  globalThis.sessionStorage=memoryStorage(initial);
  try{return callback(globalThis.sessionStorage)}
  finally{
    if(previous===undefined)delete globalThis.sessionStorage;
    else globalThis.sessionStorage=previous;
  }
}

const valid=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)&&typeof value.id==='string'&&value.id.length>0&&typeof value.name==='string'&&value.name.length>0;
const fallback=()=>[{id:'seed-1',name:'Seed'}];

test('session record store is safe outside the browser and clones fallback data',()=>{
  const previous=globalThis.sessionStorage;
  delete globalThis.sessionStorage;
  try{
    const first=readSessionRecords('test.records',fallback,valid);
    first[0].name='Mutated';
    const second=readSessionRecords('test.records',fallback,valid);
    assert.equal(second[0].name,'Seed');
  }finally{if(previous!==undefined)globalThis.sessionStorage=previous}
});

test('session record store persists and reads a valid canonical set',()=>withSessionStorage({},storage=>{
  const written=writeSessionRecords('test.records',[{id:'one',name:'One'},{id:'two',name:'Two'}],valid);
  assert.equal(written.length,2);
  assert.equal(JSON.parse(storage.getItem('test.records')).length,2);
  assert.deepEqual(readSessionRecords('test.records',fallback,valid),written);
}));

test('corrupt session JSON is replaced by the validated fallback',()=>withSessionStorage({'test.records':'{broken'},storage=>{
  const records=readSessionRecords('test.records',fallback,valid);
  assert.deepEqual(records,fallback());
  assert.deepEqual(JSON.parse(storage.getItem('test.records')),fallback());
}));

test('duplicate ids or invalid records in storage are rejected as a whole',()=>withSessionStorage({'test.records':JSON.stringify([{id:'dup',name:'One'},{id:'dup',name:'Two'}])},()=>{
  assert.deepEqual(readSessionRecords('test.records',fallback,valid),fallback());
}));

test('invalid writes cannot corrupt the canonical session set',()=>withSessionStorage({},storage=>{
  writeSessionRecords('test.records',[{id:'one',name:'One'}],valid);
  assert.throws(()=>writeSessionRecords('test.records',[{id:'dup',name:'One'},{id:'dup',name:'Two'}],valid));
  assert.throws(()=>writeSessionRecords('test.records',[{id:'bad',name:''}],valid));
  assert.deepEqual(JSON.parse(storage.getItem('test.records')),[{id:'one',name:'One'}]);
}));
