const DEFAULT_MAX_JSON_BYTES=2*1024*1024;
const decoder=new TextDecoder('utf-8',{fatal:true});

export class ResponseBodyLimitError extends Error{
 constructor(){super('A resposta da API excedeu o limite de tamanho permitido.');this.name='ResponseBodyLimitError'}
}

function join(chunks:Uint8Array[],size:number){const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.byteLength}return output}

export async function readBoundedJsonResponse(response:Response,maxBytes=DEFAULT_MAX_JSON_BYTES):Promise<unknown>{
 if(!Number.isInteger(maxBytes)||maxBytes<=0)throw new Error('O limite da resposta JSON é inválido.');
 const declared=response.headers.get('content-length');
 if(declared){const size=Number(declared);if(Number.isFinite(size)&&size>maxBytes)throw new ResponseBodyLimitError()}
 if(!response.body){
  const text=await response.text();
  if(new TextEncoder().encode(text).byteLength>maxBytes)throw new ResponseBodyLimitError();
  return JSON.parse(text);
 }
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   const chunk=value instanceof Uint8Array?value:new Uint8Array(value);
   total+=chunk.byteLength;
   if(total>maxBytes){await reader.cancel();throw new ResponseBodyLimitError()}
   chunks.push(chunk);
  }
 }finally{reader.releaseLock()}
 const text=decoder.decode(join(chunks,total));
 return JSON.parse(text);
}
