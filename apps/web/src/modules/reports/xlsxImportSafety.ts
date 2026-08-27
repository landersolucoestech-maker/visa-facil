const MAX_XLSX_FILE_BYTES=10*1024*1024;
const MAX_ZIP_ENTRIES=256;
const MAX_ENTRY_UNCOMPRESSED_BYTES=16*1024*1024;
const MAX_TOTAL_UNCOMPRESSED_BYTES=32*1024*1024;
const MAX_COMPRESSION_RATIO=120;

function findEocd(bytes:Uint8Array){
 const minimum=Math.max(0,bytes.length-65557);
 for(let offset=bytes.length-22;offset>=minimum;offset-=1){
  if(bytes[offset]===0x50&&bytes[offset+1]===0x4b&&bytes[offset+2]===0x05&&bytes[offset+3]===0x06)return offset;
 }
 return -1;
}

export function assertSafeXlsxArchive(bytes:Uint8Array){
 if(bytes.byteLength>MAX_XLSX_FILE_BYTES)throw new Error('O arquivo XLSX excede o limite de 10 MB.');
 const eocd=findEocd(bytes);
 if(eocd<0)throw new Error('O arquivo XLSX possui estrutura ZIP inválida.');
 const end=new DataView(bytes.buffer,bytes.byteOffset+eocd,22);
 const diskEntries=end.getUint16(8,true);
 const entries=end.getUint16(10,true);
 const directorySize=end.getUint32(12,true);
 const directoryOffset=end.getUint32(16,true);
 if(entries!==diskEntries||entries>MAX_ZIP_ENTRIES)throw new Error('O XLSX possui entradas ZIP demais ou usa um formato não suportado.');
 if(directoryOffset>bytes.length||directorySize>bytes.length-directoryOffset||directoryOffset+directorySize>eocd)throw new Error('O diretório ZIP do XLSX está fora dos limites do arquivo.');
 let offset=directoryOffset;
 let totalUncompressed=0;
 const names=new Set<string>();
 for(let index=0;index<entries;index+=1){
  if(offset>bytes.length-46||bytes[offset]!==0x50||bytes[offset+1]!==0x4b||bytes[offset+2]!==0x01||bytes[offset+3]!==0x02)throw new Error('O diretório ZIP do XLSX é inválido.');
  const view=new DataView(bytes.buffer,bytes.byteOffset+offset,46);
  const compressedSize=view.getUint32(20,true);
  const uncompressedSize=view.getUint32(24,true);
  const nameLength=view.getUint16(28,true);
  const extraLength=view.getUint16(30,true);
  const commentLength=view.getUint16(32,true);
  const localOffset=view.getUint32(42,true);
  const next=offset+46+nameLength+extraLength+commentLength;
  if(next>directoryOffset+directorySize||next>bytes.length||localOffset>bytes.length-30)throw new Error('O XLSX possui metadados ZIP fora dos limites.');
  if(uncompressedSize>MAX_ENTRY_UNCOMPRESSED_BYTES)throw new Error('O XLSX contém uma entrada descompactada acima do limite suportado.');
  totalUncompressed+=uncompressedSize;
  if(totalUncompressed>MAX_TOTAL_UNCOMPRESSED_BYTES)throw new Error('O XLSX excede o limite total de dados descompactados.');
  if(compressedSize===0&&uncompressedSize>0)throw new Error('O XLSX possui uma entrada compactada inconsistente.');
  if(compressedSize>0&&uncompressedSize/compressedSize>MAX_COMPRESSION_RATIO)throw new Error('O XLSX possui taxa de compactação excessiva.');
  const name=new TextDecoder().decode(bytes.slice(offset+46,offset+46+nameLength)).replace(/^\/+/, '');
  if(!name||name.includes('\\')||name.split('/').some(part=>part==='..'||part==='.')||names.has(name))throw new Error('O XLSX possui nomes de entrada ZIP inválidos ou duplicados.');
  names.add(name);
  offset=next;
 }
 if(offset!==directoryOffset+directorySize)throw new Error('O diretório ZIP do XLSX possui tamanho inconsistente.');
}

export async function assertSafeXlsxFile(file:File){
 if(file.size>MAX_XLSX_FILE_BYTES)throw new Error('O arquivo XLSX excede o limite de 10 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 assertSafeXlsxArchive(bytes);
}
