import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome=process.env.CHROME_BIN;
const baseUrl=(process.env.CMS_SMOKE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
if(!chrome)throw new Error('CHROME_BIN is required for the Site CMS interaction smoke.');

const port=9533+Math.floor(Math.random()*1500);
const profile=await mkdtemp(join(tmpdir(),'visa-facil-cms-chrome-'));
const browser=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore'});
const browserExit=new Promise(resolve=>browser.once('exit',resolve));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

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
 const waiter=pending.get(message.id);if(!waiter)return;
 pending.delete(message.id);
 if(message.error)waiter.reject(new Error(message.error.message));else waiter.resolve(message.result);
});
function command(method,params={}){const id=++messageId;socket.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}))}
async function evaluate(expression){const result=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Browser evaluation failed.');return result.result?.value}
async function waitFor(expression,label,attempts=60){for(let attempt=0;attempt<attempts;attempt+=1){if(await evaluate(`Boolean(${expression})`))return;await sleep(100)}throw new Error(`Timed out waiting for ${label}.`)}
async function assertBrowser(expression,label){if(!await evaluate(`Boolean(${expression})`))throw new Error(`Browser assertion failed: ${label}`)}
async function navigate(path){await command('Page.navigate',{url:`${baseUrl}${path}`});await waitFor(`document.readyState==='complete'&&!!document.querySelector('.site-cms-workspace')`,`Site CMS workspace ${path}`)}
async function clickButton(text){const clicked=await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(item=>item.textContent?.trim().includes(${JSON.stringify(text)})&&!item.disabled);if(!button)return false;button.click();return true})()`);if(!clicked)throw new Error(`Could not find enabled button containing “${text}”.`)}
async function setLabelControl(labelText,value,scope='document'){
 const ok=await evaluate(`(()=>{const root=${scope};const label=[...root.querySelectorAll('label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()===${JSON.stringify(labelText)});const control=label?.querySelector('input,select,textarea');if(!control)return false;if(control instanceof HTMLSelectElement){control.value=${JSON.stringify(value)};control.dispatchEvent(new Event('change',{bubbles:true}));return true}const proto=control instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;if(setter)setter.call(control,${JSON.stringify(value)});else control.value=${JSON.stringify(value)};control.dispatchEvent(new Event('input',{bubbles:true}));control.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
 if(!ok)throw new Error(`Could not set control “${labelText}”.`);
}

try{
 await command('Page.enable');
 await command('Runtime.enable');

 await navigate('/site-admin/pages');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('.site-cms-page-settings label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='URL / slug');const input=label?.querySelector('input');return input?.value==='/'&&input.disabled===true})()`,'home slug remains locked to root');

 await clickButton('+ Nova página');
 await waitFor(`!!document.querySelector('#site-cms-new-page-dialog[role="dialog"]')`,'new page dialog');
 await setLabelControl('Nome','Sobre Europa',`document.querySelector('#site-cms-new-page-dialog')`);
 await clickButton('Criar página');
 await waitFor(`!document.querySelector('#site-cms-new-page-dialog')`,'new page dialog close');
 await assertBrowser(`(()=>{const label=[...document.querySelectorAll('.site-cms-page-settings label')].find(item=>item.querySelector(':scope > span')?.textContent?.trim()==='URL / slug');return label?.querySelector('input')?.value==='/sobre-europa'})()`,'new page receives canonical generated slug');

 await setLabelControl('Status','scheduled',`document.querySelector('.site-cms-page-settings')`);
 await waitFor(`document.querySelector('.site-cms-page-settings [role="alert"]')?.textContent?.includes('data e horário válidos')`,'invalid schedule warning');
 await clickButton('Publicar localmente');
 await waitFor(`document.querySelector('.site-cms-toast')?.textContent?.includes('Publicação bloqueada')`,'publication block toast');

 await setLabelControl('Agendar para','2026-12-31T12:00',`document.querySelector('.site-cms-page-settings')`);
 await waitFor(`!document.querySelector('.site-cms-page-settings [role="alert"]')`,'valid schedule clears warning');
 await clickButton('Publicar localmente');
 await waitFor(`document.querySelector('.site-cms-toast')?.textContent?.includes('Conteúdo publicado localmente')`,'valid local publication');

 await navigate('/site-admin/media');
 await setLabelControl('URL externa','javascript:alert(1)');
 await clickButton('Adicionar URL');
 await waitFor(`document.querySelector('.site-cms-media-message')?.textContent?.includes('http:// ou https://')`,'unsafe external media URL rejection');
 await assertBrowser(`document.querySelectorAll('.site-cms-media-card').length===0`,'unsafe URL is not inserted into media library');

 console.log('Site CMS browser interaction smoke passed.');
}finally{
 socket.close();
 browser.kill('SIGTERM');
 await Promise.race([browserExit,sleep(2500)]);
 await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:100});
}
