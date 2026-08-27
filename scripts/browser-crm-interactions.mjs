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

 await navigate('/crm/marketing/calendario');
 await clickButton('Novo Conteúdo');
 await waitFor(`!!document.querySelector('.marketing-content-modal[role="dialog"]')`,'marketing content dialog');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('.marketing-content-modal label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='Campanha vinculada');const select=label?.querySelector('select');return !!select&&!select.disabled&&select.options.length>1})()`,'marketing content links to canonical local campaigns');
 await assertBrowser(`!document.querySelector('.marketing-content-modal')?.textContent?.includes('Nenhuma persistência compartilhada')`,'marketing content no longer claims local campaigns lack shared persistence');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('.marketing-content-modal label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='Conta integrada');return label?.querySelector('select')?.disabled===true})()`,'external marketing account remains blocked without backend');

 await navigate('/crm/atendimentos');
 await clickButton('Nova conversa');
 await waitFor(`!!document.querySelector('#visachat-new-conversation')`,'VisaChat new conversation dialog');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('#visachat-new-conversation label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='Contato / Lead do CRM');const select=label?.querySelector('select');return !!select&&select.options.length>1})()`,'VisaChat uses canonical CRM record selector');
 await assertBrowser(`document.querySelector('#visachat-new-conversation')?.textContent?.includes('mensagens externas só podem ser marcadas como entregues quando o canal estiver realmente integrado')`,'VisaChat keeps external delivery limitation explicit');

 await navigate('/crm/financeiro/transacoes');
 await clickButton('Nova transação');
 await waitFor(`!!document.querySelector('.finance-transaction-form-modal[role="dialog"]')`,'finance transaction dialog');
 await assertBrowser(`[...document.querySelectorAll('.finance-transaction-form-modal label > span')].some(item=>item.textContent?.trim()==='Cliente / contato relacionado')`,'finance transaction canonical CRM relationship field');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('.finance-transaction-form-modal label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='Cliente / contato relacionado');const select=label?.querySelector('select');return !!select&&select.options.length>1&&!label.querySelector('input')})()`,'finance transaction relationship uses a selector instead of free text');
 await assertBrowser(`[...document.querySelectorAll('.finance-transaction-form-modal label > span')].some(item=>item.textContent?.trim()==='Categoria')`,'finance transaction category field remains present');

 await navigate('/crm/contratos');
 await clickButton('Novo Contrato');
 await waitFor(`!!document.querySelector('.contracts-editor[role="dialog"]')`,'contract editor dialog');
 await assertBrowser(`['Template','Partes','Variáveis','Documento','Signatários','Revisão'].every(label=>[...document.querySelectorAll('.contracts-editor-steps nav button span')].some(item=>item.textContent?.trim()===label))`,'contract six-step wizard');
 await assertBrowser(`document.querySelector('.contracts-editor')?.textContent?.includes('Os dados ficam somente na sessão atual até existir persistência backend.')`,'contract editor keeps local persistence limitation explicit');
 await assertBrowser(`document.querySelectorAll('.contracts-template-picker button').length>0`,'contract editor exposes active templates as canonical classification');

 await navigate('/crm/relatorios');
 await assertBrowser(`document.body.textContent?.includes('Importação e exportação dos datasets operacionais e de configuração exclusivamente em XLSX.')`,'reports remains XLSX-only');
 await assertBrowser(`![...document.querySelectorAll('.reports-entity-actions button')].some(item=>item.textContent?.includes('CSV'))`,'reports exposes no CSV actions');
 await clickButton('Importar XLSX');
 await waitFor(`!!document.querySelector('.reports-import-modal[role="dialog"]')`,'reports XLSX import dialog');
 await assertBrowser(`document.querySelector('.reports-import-modal input[type="file"]')?.accept.includes('.xlsx')`,'reports import accepts XLSX');
 await assertBrowser(`document.querySelectorAll('.reports-import-columns b').length>5`,'reports import exposes complete modal schema');
 await assertBrowser(`document.querySelector('.reports-import-modal')?.textContent?.includes('Baixar template XLSX completo')`,'reports complete XLSX template action');

 await navigate('/crm/configuracoes');
 await clickButton('Automações');
 await waitFor(`document.body.textContent?.includes('Canais de Notificação')`,'automation notification channels');
 await assertBrowser(`(()=>{const tile=[...document.querySelectorAll('.settings-channel-grid>div')].find(item=>item.querySelector('strong')?.textContent?.trim()==='SMS');const toggle=tile?.querySelector('button.settings-toggle');return !!toggle&&!toggle.disabled})()`,'SMS can be modeled as a future notification preference');
 await assertBrowser(`document.body.textContent?.includes('não disparam e-mails, SMS, push, backups ou jobs')`,'SMS preference remains non-executable without backend');

 await clickButton('Integrações');
 await waitFor(`document.body.textContent?.includes('Telefonia e SMS')`,'telephony and SMS integration row');
 await assertBrowser(`document.body.textContent?.includes('Camada de integração agnóstica para conexão com operadoras de telefonia e provedores de comunicação via internet')`,'telephony architecture description');
 await assertBrowser(`document.body.textContent?.includes('Vivo')&&document.body.textContent?.includes('TIM')&&document.body.textContent?.includes('Claro')`,'traditional telephony provider targets');
 await assertBrowser(`document.body.textContent?.includes('Twilio')&&document.body.textContent?.includes('Dialpad')&&document.body.textContent?.includes('RingCentral')`,'IP communication provider targets');
 await assertBrowser(`document.body.textContent?.includes('Recebimento e envio de mensagens')&&document.body.textContent?.includes('Histórico de comunicação')`,'telephony resource presentation');
 await assertBrowser(`document.body.textContent?.includes('Backend necessário')`,'integrations remain truthful while backend is absent');

 await waitFor(`document.body.textContent?.includes('Facebook · Instagram · Messenger · Meta Ads')`,'unified Meta provider hierarchy');
 await assertBrowser(`(()=>{const names=[...document.querySelectorAll('.settings-integration-copy>strong')].map(item=>item.textContent?.trim());return names.filter(name=>name==='Meta').length===1&&!names.includes('Facebook')&&!names.includes('Instagram')&&!names.includes('Messenger')&&!names.includes('Meta Ads')})()`,'Meta products are not independent integration rows');
 await assertBrowser(`document.body.textContent?.includes('Autorização: fluxo oficial Meta via OAuth')`,'Meta official OAuth label');
 await assertBrowser(`document.body.textContent?.includes('A conexão deverá centralizar atendimento, mensagens, gestão de conteúdo, interações sociais, publicidade e métricas')`,'Meta operational description');
 await assertBrowser(`document.body.textContent?.includes('Páginas e perfis')&&document.body.textContent?.includes('Campanhas e anúncios')`,'Meta requested capabilities');

 await waitFor(`document.body.textContent?.includes('YouTube · Google Ads · Google Calendar')`,'unified Google provider hierarchy');
 await assertBrowser(`(()=>{const names=[...document.querySelectorAll('.settings-integration-copy>strong')].map(item=>item.textContent?.trim());return names.filter(name=>name==='Google').length===1&&!names.includes('YouTube')&&!names.includes('Google Ads')&&!names.includes('Google Calendar')})()`,'Google services are not independent integration rows');
 await assertBrowser(`document.body.textContent?.includes('Autorização: fluxo oficial Google via OAuth')`,'Google official OAuth label');
 await assertBrowser(`[...document.querySelectorAll('.settings-integration-service h4')].some(item=>item.textContent?.trim()==='YouTube')`,'YouTube service section');
 await assertBrowser(`[...document.querySelectorAll('.settings-integration-service h4')].some(item=>item.textContent?.trim()==='Google Ads')`,'Google Ads service section');
 await assertBrowser(`[...document.querySelectorAll('.settings-integration-service h4')].some(item=>item.textContent?.trim()==='Google Calendar')`,'Google Calendar service section');
 await assertBrowser(`document.body.textContent?.includes('Inventário de YouTube quando aplicável')&&document.body.textContent?.includes('Sincronização bidirecional')`,'Google service capability details');
 await assertBrowser(`document.body.textContent?.includes('Social, Conteúdo & Publicidade')`,'consolidated social content and advertising category');

 await assertBrowser(`document.body.textContent?.includes('A integração deverá utilizar exclusivamente recursos oficialmente disponibilizados e autorizados pelo TikTok.')`,'TikTok official-only integration disclosure');
 await assertBrowser(`document.body.textContent?.includes('Campanhas e anúncios quando autorizados')`,'TikTok conditional advertising capability');

 console.log('CRM browser interaction smoke passed.');
}finally{
 socket.close();
 browser.kill('SIGTERM');
 await Promise.race([browserExit,sleep(2500)]);
 await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:100});
}