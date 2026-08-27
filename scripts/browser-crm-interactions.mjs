import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome=process.env.CHROME_BIN;
const baseUrl=(process.env.CRM_SMOKE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
if(!chrome)throw new Error('CHROME_BIN is required for the CRM interaction smoke.');

const port=9333+Math.floor(Math.random()*2000);
const profile=await mkdtemp(join(tmpdir(),'visa-facil-chrome-'));
const browser=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore'});
const browserExit=new Promise(resolve=>browser.once('exit',resolve));

const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function devtoolsPage(){
 let lastError;
 for(let attempt=0;attempt<50;attempt+=1){
  try{
   const response=await fetch(`http://127.0.0.1:${port}/json/list`);
   if(response.ok){const pages=await response.json();const page=pages.find(item=>item.type==='page'&&item.webSocketDebuggerUrl);if(page)return page}
  }catch(error){lastError=error}
  await sleep(100);
 }
 throw lastError??new Error('Chrome DevTools endpoint did not become ready.');
}

const page=await devtoolsPage();
const socket=new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
let messageId=0;
const pending=new Map();
socket.addEventListener('message',event=>{
 const message=JSON.parse(String(event.data));
 if(!message.id)return;
 const waiter=pending.get(message.id);
 if(!waiter)return;
 pending.delete(message.id);
 if(message.error)waiter.reject(new Error(message.error.message));else waiter.resolve(message.result);
});
function command(method,params={}){
 const id=++messageId;
 socket.send(JSON.stringify({id,method,params}));
 return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
}
async function evaluate(expression){
 const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Browser evaluation failed.');
 return result.result?.value;
}
async function navigate(path){
 await command('Page.navigate',{url:`${baseUrl}${path}`});
 await waitFor(`document.readyState==='complete' && !!document.querySelector('.crm-workspace')`,`workspace ${path}`);
}
async function waitFor(expression,label,attempts=60){
 for(let attempt=0;attempt<attempts;attempt+=1){
  if(await evaluate(`Boolean(${expression})`))return;
  await sleep(100);
 }
 throw new Error(`Timed out waiting for ${label}.`);
}
async function assertBrowser(expression,label){
 const ok=await evaluate(`Boolean(${expression})`);
 if(!ok)throw new Error(`Browser assertion failed: ${label}`);
}
async function clickButton(text){
 const clicked=await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(item=>item.textContent?.trim().includes(${JSON.stringify(text)})&&!item.disabled);if(!button)return false;button.click();return true})()`);
 if(!clicked)throw new Error(`Could not find enabled button containing “${text}”.`);
}

try{
 await command('Page.enable');
 await command('Runtime.enable');

 await navigate('/crm/marketing/briefings');
 await clickButton('Novo briefing');
 await waitFor(`!!document.querySelector('[role="dialog"]')`,'briefing dialog');
 await assertBrowser(`[...document.querySelectorAll('[role="dialog"] h2')].some(item=>item.textContent?.includes('Criar briefing'))`,'briefing create dialog title');
 await assertBrowser(`[...document.querySelectorAll('[role="dialog"] label > span')].some(item=>item.textContent?.trim()==='Responsável')`,'briefing canonical owner field');

 await navigate('/crm/marketing/tarefas');
 await clickButton('Nova tarefa');
 await waitFor(`!!document.querySelector('[role="dialog"]')`,'marketing task dialog');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('[role="dialog"] label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='Área');const select=label?.querySelector('select');return select?.disabled===true&&select.value==='Marketing'})()`,'marketing task area locked to Marketing');
 await assertBrowser(`[...document.querySelectorAll('[role="dialog"] label > span')].some(item=>item.textContent?.trim()==='Contato / Lead relacionado')`,'marketing tasks retain canonical CRM relationship selector');

 await navigate('/crm/atendimentos');
 await clickButton('Nova conversa');
 await waitFor(`!!document.querySelector('#visachat-new-conversation')`,'VisaChat new conversation dialog');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('#visachat-new-conversation label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='Contato / Lead do CRM');const select=label?.querySelector('select');return !!select&&select.options.length>1})()`,'VisaChat uses canonical CRM record selector');
 await assertBrowser(`document.querySelector('#visachat-new-conversation')?.textContent?.includes('mensagens externas só podem ser marcadas como entregues quando o canal estiver realmente integrado')`,'VisaChat keeps external delivery limitation explicit');

 await navigate('/crm/configuracoes');
 await clickButton('Integrações');
 await waitFor(`document.body.textContent?.includes('Telefonia e SMS')`,'telephony and SMS integration row');
 await assertBrowser(`document.body.textContent?.includes('Vivo')&&document.body.textContent?.includes('TIM')&&document.body.textContent?.includes('Claro')`,'traditional telephony provider targets');
 await assertBrowser(`document.body.textContent?.includes('Twilio')&&document.body.textContent?.includes('Dialpad')&&document.body.textContent?.includes('RingCentral')`,'IP communication provider targets');
 await assertBrowser(`document.body.textContent?.includes('Backend necessário')`,'telephony integration remains truthful while backend is absent');
 await waitFor(`document.body.textContent?.includes('Produtos / canais: Facebook · Instagram · Messenger · Meta Ads')`,'unified Meta provider hierarchy');
 await assertBrowser(`(()=>{const names=[...document.querySelectorAll('.settings-integration-copy>strong')].map(item=>item.textContent?.trim());return names.filter(name=>name==='Meta').length===1&&!names.includes('Facebook')&&!names.includes('Instagram')})()`,'Facebook and Instagram are not independent integration rows');
 await assertBrowser(`document.body.textContent?.includes('Autorização: fluxo oficial Meta')`,'Meta official authorization label');
 await assertBrowser(`document.body.textContent?.includes('Meta App ID, Meta App Secret, OAuth, tokens, webhook, Graph API e estado geral pertencem ao provider Meta')`,'Meta shared technical configuration disclosure');

 console.log('CRM browser interaction smoke passed.');
}finally{
 socket.close();
 browser.kill('SIGTERM');
 await Promise.race([browserExit,sleep(2500)]);
 await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:100});
}
