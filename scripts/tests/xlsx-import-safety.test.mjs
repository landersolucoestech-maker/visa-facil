import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeXlsxArchive } from '../../apps/web/src/modules/reports/xlsxImportSafety.ts';
import { createXlsxBlob } from '../../apps/web/src/modules/reports/xlsxWorkbook.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function findCentral(bytes){for(let i=0;i<=bytes.length-46;i+=1)if(bytes[i]===0x50&&bytes[i+1]===0x4b&&bytes[i+2]===0x01&&bytes[i+3]===0x02)return i;return-1}

test('generated XLSX passes the archive preflight',async()=>{
 const blob=createXlsxBlob('Teste',['Nome'],[['Ana']]);
 const bytes=new Uint8Array(await blob.arrayBuffer());
 assert.doesNotThrow(()=>assertSafeXlsxArchive(bytes));
});

test('XLSX preflight rejects an entry claiming excessive decompressed size',async()=>{
 const blob=createXlsxBlob('Teste',['Nome'],[['Ana']]);
 const bytes=new Uint8Array(await blob.arrayBuffer());
 const central=findCentral(bytes);
 assert.ok(central>=0);
 new DataView(bytes.buffer,bytes.byteOffset+central,46).setUint32(24,20*1024*1024,true);
 assert.throws(()=>assertSafeXlsxArchive(bytes),/entrada descompactada acima do limite/);
});

test('ReportsApp runs archive preflight before the XLSX parser',()=>{
 const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/reports/ReportsApp.tsx'),'utf8');
 const preflight=source.indexOf('await assertSafeXlsxFile(file)');
 const parse=source.indexOf('await readXlsxFile(file)');
 assert.ok(preflight>=0&&parse>preflight);
});
