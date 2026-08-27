export type XlsxTable={headers:string[];rows:string[][]};

type ZipEntry={name:string;data:Uint8Array};
type ZipDirectoryEntry={name:string;method:number;compressedSize:number;uncompressedSize:number;localOffset:number};

const XLSX_MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const encoder=new TextEncoder();
const decoder=new TextDecoder();

function xml(value:string){return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function concat(chunks:Uint8Array[]){const size=chunks.reduce((sum,chunk)=>sum+chunk.length,0);const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length}return output}
function exactArrayBuffer(bytes:Uint8Array){const copy=new Uint8Array(bytes.byteLength);copy.set(bytes);return copy.buffer}
function columnName(index:number){let value=index+1;let name='';while(value>0){const remainder=(value-1)%26;name=String.fromCharCode(65+remainder)+name;value=Math.floor((value-1)/26)}return name}
function columnIndex(reference:string){const letters=reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase()??'';let value=0;for(const letter of letters)value=value*26+(letter.charCodeAt(0)-64);return Math.max(0,value-1)}
function dosDateTime(date=new Date()){const year=Math.max(1980,date.getFullYear());return{time:(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2),date:((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate()}}

const CRC_TABLE=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n+=1){let c=n;for(let k=0;k<8;k+=1)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}return table})();
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes)crc=CRC_TABLE[(crc^byte)&0xff]^(crc>>>8);return(crc^0xffffffff)>>>0}
function u16(view:DataView,offset:number,value:number){view.setUint16(offset,value,true)}
function u32(view:DataView,offset:number,value:number){view.setUint32(offset,value>>>0,true)}

function zipStore(entries:ZipEntry[]){
 const localChunks:Uint8Array[]=[];
 const centralChunks:Uint8Array[]=[];
 const stamp=dosDateTime();
 let localOffset=0;
 for(const entry of entries){
  const name=encoder.encode(entry.name);
  const crc=crc32(entry.data);
  const local=new Uint8Array(30+name.length);
  const lv=new DataView(local.buffer);
  u32(lv,0,0x04034b50);u16(lv,4,20);u16(lv,6,0x0800);u16(lv,8,0);u16(lv,10,stamp.time);u16(lv,12,stamp.date);u32(lv,14,crc);u32(lv,18,entry.data.length);u32(lv,22,entry.data.length);u16(lv,26,name.length);u16(lv,28,0);local.set(name,30);
  localChunks.push(local,entry.data);

  const central=new Uint8Array(46+name.length);
  const cv=new DataView(central.buffer);
  u32(cv,0,0x02014b50);u16(cv,4,20);u16(cv,6,20);u16(cv,8,0x0800);u16(cv,10,0);u16(cv,12,stamp.time);u16(cv,14,stamp.date);u32(cv,16,crc);u32(cv,20,entry.data.length);u32(cv,24,entry.data.length);u16(cv,28,name.length);u16(cv,30,0);u16(cv,32,0);u16(cv,34,0);u16(cv,36,0);u32(cv,38,0);u32(cv,42,localOffset);central.set(name,46);
  centralChunks.push(central);
  localOffset+=local.length+entry.data.length;
 }
 const central=concat(centralChunks);
 const eocd=new Uint8Array(22);
 const ev=new DataView(eocd.buffer);
 u32(ev,0,0x06054b50);u16(ev,4,0);u16(ev,6,0);u16(ev,8,entries.length);u16(ev,10,entries.length);u32(ev,12,central.length);u32(ev,16,localOffset);u16(ev,20,0);
 return concat([...localChunks,central,eocd]);
}

function cellXml(value:string,row:number,column:number,header=false){const reference=`${columnName(column)}${row}`;const style=header?' s="1"':'';return `<c r="${reference}" t="inlineStr"${style}><is><t xml:space="preserve">${xml(value)}</t></is></c>`}
function worksheetXml(headers:string[],rows:string[][]){
 const widthCount=headers.length;
 const endColumn=columnName(Math.max(0,widthCount-1));
 const lastRow=Math.max(1,rows.length+1);
 const cols=headers.map((header,index)=>`<col min="${index+1}" max="${index+1}" width="${Math.min(38,Math.max(14,header.length+4))}" customWidth="1"/>`).join('');
 const headerRow=`<row r="1" ht="22" customHeight="1">${headers.map((value,index)=>cellXml(value,1,index,true)).join('')}</row>`;
 const dataRows=rows.map((row,rowIndex)=>`<row r="${rowIndex+2}">${headers.map((_,columnIndex)=>cellXml(String(row[columnIndex]??''),rowIndex+2,columnIndex)).join('')}</row>`).join('');
 return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${headerRow}${dataRows}</sheetData><autoFilter ref="A1:${endColumn}${lastRow}"/></worksheet>`;
}
function stylesXml(){return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF102A59"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`}

export function createXlsxBlob(sheetName:string,headers:string[],rows:string[][]){
 if(headers.length===0)throw new Error('O XLSX precisa ter ao menos uma coluna.');
 const safeSheet=(sheetName.replace(/[\\/*?:\[\]]/g,' ').trim()||'Dados').slice(0,31);
 const entries:ZipEntry[]=[
  {name:'[Content_Types].xml',data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`)},
  {name:'_rels/.rels',data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)},
  {name:'xl/workbook.xml',data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(safeSheet)}" sheetId="1" r:id="rId1"/></sheets></workbook>`)},
  {name:'xl/_rels/workbook.xml.rels',data:encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`)},
  {name:'xl/styles.xml',data:encoder.encode(stylesXml())},
  {name:'xl/worksheets/sheet1.xml',data:encoder.encode(worksheetXml(headers,rows))},
 ];
 return new Blob([exactArrayBuffer(zipStore(entries))],{type:XLSX_MIME});
}

function findEocd(bytes:Uint8Array){const minimum=Math.max(0,bytes.length-65557);for(let offset=bytes.length-22;offset>=minimum;offset-=1){if(bytes[offset]===0x50&&bytes[offset+1]===0x4b&&bytes[offset+2]===0x05&&bytes[offset+3]===0x06)return offset}throw new Error('O arquivo XLSX possui estrutura ZIP inválida.')}
function readDirectory(bytes:Uint8Array){
 const eocd=findEocd(bytes);const ev=new DataView(bytes.buffer,bytes.byteOffset+eocd,22);const count=ev.getUint16(10,true);const directoryOffset=ev.getUint32(16,true);const entries:ZipDirectoryEntry[]=[];let offset=directoryOffset;
 for(let index=0;index<count;index+=1){
  if(bytes[offset]!==0x50||bytes[offset+1]!==0x4b||bytes[offset+2]!==0x01||bytes[offset+3]!==0x02)throw new Error('O arquivo XLSX possui diretório ZIP inválido.');
  const view=new DataView(bytes.buffer,bytes.byteOffset+offset,46);const method=view.getUint16(10,true);const compressedSize=view.getUint32(20,true);const uncompressedSize=view.getUint32(24,true);const nameLength=view.getUint16(28,true);const extraLength=view.getUint16(30,true);const commentLength=view.getUint16(32,true);const localOffset=view.getUint32(42,true);const name=decoder.decode(bytes.slice(offset+46,offset+46+nameLength));entries.push({name,method,compressedSize,uncompressedSize,localOffset});offset+=46+nameLength+extraLength+commentLength;
 }
 return entries;
}
async function inflateRaw(data:Uint8Array){
 if(typeof DecompressionStream==='undefined')throw new Error('Este navegador não oferece descompactação necessária para ler XLSX.');
 const stream=new Blob([exactArrayBuffer(data)]).stream().pipeThrough(new DecompressionStream('deflate-raw' as never));
 return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function unzip(bytes:Uint8Array){
 const files=new Map<string,Uint8Array>();
 for(const entry of readDirectory(bytes)){
  const offset=entry.localOffset;
  if(bytes[offset]!==0x50||bytes[offset+1]!==0x4b||bytes[offset+2]!==0x03||bytes[offset+3]!==0x04)throw new Error('O arquivo XLSX possui entrada ZIP inválida.');
  const view=new DataView(bytes.buffer,bytes.byteOffset+offset,30);const nameLength=view.getUint16(26,true);const extraLength=view.getUint16(28,true);const start=offset+30+nameLength+extraLength;const compressed=bytes.slice(start,start+entry.compressedSize);let data:Uint8Array;if(entry.method===0)data=compressed;else if(entry.method===8)data=await inflateRaw(compressed);else throw new Error(`O XLSX usa um método de compactação não suportado (${entry.method}).`);if(data.length!==entry.uncompressedSize)throw new Error('O XLSX possui uma entrada corrompida.');files.set(entry.name.replace(/^\//,''),data);
 }
 return files;
}
function parseXml(content:string,label:string){const document=new DOMParser().parseFromString(content,'application/xml');if(document.getElementsByTagName('parsererror').length)throw new Error(`O XLSX contém XML inválido em ${label}.`);return document}
function zipPath(base:string,target:string){if(target.startsWith('/'))return target.replace(/^\//,'');const parts=[...base.split('/').filter(Boolean),...target.split('/')];const resolved:string[]=[];for(const part of parts){if(part==='.'||!part)continue;if(part==='..')resolved.pop();else resolved.push(part)}return resolved.join('/')}
function textNodes(element:Element,tag:string){return Array.from(element.getElementsByTagName(tag)).map(node=>node.textContent??'').join('')}
function sheetTarget(files:Map<string,Uint8Array>){
 const workbookBytes=files.get('xl/workbook.xml');const relBytes=files.get('xl/_rels/workbook.xml.rels');if(!workbookBytes||!relBytes)return'xl/worksheets/sheet1.xml';
 const workbook=parseXml(decoder.decode(workbookBytes),'workbook.xml');const sheet=workbook.getElementsByTagName('sheet')[0];const relationId=sheet?.getAttribute('r:id')||sheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');if(!relationId)return'xl/worksheets/sheet1.xml';
 const rels=parseXml(decoder.decode(relBytes),'workbook.xml.rels');const relation=Array.from(rels.getElementsByTagName('Relationship')).find(item=>item.getAttribute('Id')===relationId);const target=relation?.getAttribute('Target');return target?zipPath('xl',target):'xl/worksheets/sheet1.xml';
}
function sharedStrings(files:Map<string,Uint8Array>){const bytes=files.get('xl/sharedStrings.xml');if(!bytes)return[];const document=parseXml(decoder.decode(bytes),'sharedStrings.xml');return Array.from(document.getElementsByTagName('si')).map(item=>textNodes(item,'t'))}
function cellValue(cell:Element,shared:string[]){const type=cell.getAttribute('t')??'';if(type==='inlineStr')return textNodes(cell,'t');const raw=cell.getElementsByTagName('v')[0]?.textContent??'';if(type==='s')return shared[Number(raw)]??'';if(type==='b')return raw==='1'?'TRUE':'FALSE';return raw}

export async function readXlsxFile(file:File):Promise<XlsxTable>{
 const bytes=new Uint8Array(await file.arrayBuffer());const files=await unzip(bytes);const target=sheetTarget(files);const sheetBytes=files.get(target);if(!sheetBytes)throw new Error('O XLSX não possui uma planilha legível.');const document=parseXml(decoder.decode(sheetBytes),target);const shared=sharedStrings(files);const matrix:string[][]=[];
 for(const row of Array.from(document.getElementsByTagName('row'))){const rowNumber=Math.max(1,Number(row.getAttribute('r')||matrix.length+1));const values:string[]=[];for(const cell of Array.from(row.getElementsByTagName('c'))){const ref=cell.getAttribute('r')||'A1';values[columnIndex(ref)]=cellValue(cell,shared)}matrix[rowNumber-1]=values}
 const headers=(matrix[0]??[]).map(value=>String(value??'').trim());const rows=matrix.slice(1).map(row=>headers.map((_,index)=>String(row?.[index]??'').trim())).filter(row=>row.some(value=>value.length>0));return{headers,rows};
}
