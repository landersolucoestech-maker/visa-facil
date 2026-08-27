import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome=process.env.CHROME_BIN;
const baseUrl=(process.env.CRM_SMOKE_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
if(!chrome)throw new Error('CHROME_BIN is required for the row-action browser smoke.');

const port=11333+Math.floor(Math.random()*2000);
const profile=await mkdtemp(join(tmpdir(),'visa-facil-row-actions-'));
const browser=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--window-size=1600,1200',
  `--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank',
],{stdio:'ignore'});
const browserExit=new Promise(resolve=>browser.once('exit',resolve));
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

async function devtoolsPage(){
  let lastError;
  for(let attempt=0;attempt<50;attempt+=1){
    try{
      const response=await fetch(`http://127.0.0.1:${port}/json/list`);
      if(response.ok){
        const pages=await response.json();
        const page=pages.find(item=>item.type==='page'&&item.webSocketDebuggerUrl);
        if(page)return page;
      }
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
async function waitFor(expression,label,attempts=60){
  for(let attempt=0;attempt<attempts;attempt+=1){
    if(await evaluate(`Boolean(${expression})`))return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}
async function navigate(path){
  await command('Page.navigate',{url:`${baseUrl}${path}`});
  await waitFor(`document.readyState==='complete' && !!document.querySelector('.crm-workspace')`,`workspace ${path}`);
}

const checks=[
  {label:'CRM',path:'/crm/relacionamento',trigger:'.crm-actions-trigger',menu:'.crm-actions-menu',scroller:'.crm-directory-table'},
  {label:'Tarefas',path:'/crm/tarefas',trigger:'.tasks-actions-trigger',menu:'.tasks-actions-menu',scroller:'.tasks-table-scroll'},
  {label:'Contratos',path:'/crm/contratos',trigger:'.contracts-actions-trigger',menu:'.contracts-actions-dropdown',scroller:'.contracts-table-wrap'},
  {label:'Transações',path:'/crm/financeiro/transacoes',trigger:'.finance-actions-trigger',menu:'.finance-actions-menu',scroller:'.finance-transactions-card'},
  {label:'Faturamento',path:'/crm/financeiro/invoices',trigger:'.invoice-action-trigger',menu:'.invoice-actions-menu',scroller:'.invoice-table-scroll'},
];

function metricsExpression(selector){
  return `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;return {scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight,clientWidth:el.clientWidth,clientHeight:el.clientHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight}})()`;
}

try{
  await command('Page.enable');
  await command('Runtime.enable');
  const supportsAnchor=await evaluate(`CSS.supports('anchor-name: --vf-row-action-smoke')`);
  if(!supportsAnchor)throw new Error('Browser runner does not support CSS Anchor Positioning required by the row-action overflow gate.');

  for(const check of checks){
    await navigate(check.path);
    await waitFor(`!!document.querySelector(${JSON.stringify(check.trigger)})`,`${check.label} action trigger`);
    const before=await evaluate(metricsExpression(check.scroller));
    if(!before)throw new Error(`${check.label}: scroll container not found.`);

    const clicked=await evaluate(`(()=>{const trigger=document.querySelector(${JSON.stringify(check.trigger)});if(!(trigger instanceof HTMLButtonElement))return false;trigger.click();return true})()`);
    if(!clicked)throw new Error(`${check.label}: action trigger could not be clicked.`);
    await waitFor(`!!document.querySelector(${JSON.stringify(check.menu)})`,`${check.label} action menu`);
    await sleep(80);

    const result=await evaluate(`(()=>{
      const trigger=document.querySelector(${JSON.stringify(check.trigger)});
      const menu=document.querySelector(${JSON.stringify(check.menu)});
      const scroller=document.querySelector(${JSON.stringify(check.scroller)});
      if(!(trigger instanceof HTMLElement)||!(menu instanceof HTMLElement)||!(scroller instanceof HTMLElement))return null;
      const item=menu.querySelector('button');
      if(!(item instanceof HTMLButtonElement))return null;
      const t=trigger.getBoundingClientRect();
      const m=menu.getBoundingClientRect();
      const itemStyle=getComputedStyle(item);
      return {
        position:getComputedStyle(menu).position,
        down:m.top>=t.bottom-1,
        left:m.left<t.left&&m.right<=t.right+1,
        itemTextAlign:itemStyle.textAlign,
        itemJustifyContent:itemStyle.justifyContent,
        menuTop:m.top,triggerBottom:t.bottom,menuLeft:m.left,triggerLeft:t.left,menuRight:m.right,triggerRight:t.right,
        scrollWidth:scroller.scrollWidth,scrollHeight:scroller.scrollHeight,
        documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,
      };
    })()`);
    if(!result)throw new Error(`${check.label}: could not measure action menu.`);
    if(result.position!=='fixed')throw new Error(`${check.label}: action menu must be fixed to escape table overflow; got ${result.position}.`);
    if(!result.down)throw new Error(`${check.label}: action menu opened upward instead of downward (${result.menuTop} < ${result.triggerBottom}).`);
    if(!result.left)throw new Error(`${check.label}: action menu did not extend to the left of its trigger.`);
    if(result.itemTextAlign!=='left')throw new Error(`${check.label}: action menu text must align left; got ${result.itemTextAlign}.`);
    if(result.itemJustifyContent!=='flex-start')throw new Error(`${check.label}: action menu content must start at the left edge; got ${result.itemJustifyContent}.`);
    if(result.scrollWidth!==before.scrollWidth||result.scrollHeight!==before.scrollHeight){
      throw new Error(`${check.label}: opening the action menu changed the table scroll area (${before.scrollWidth}x${before.scrollHeight} -> ${result.scrollWidth}x${result.scrollHeight}).`);
    }
    if(result.documentWidth!==before.documentWidth||result.documentHeight!==before.documentHeight){
      throw new Error(`${check.label}: opening the action menu changed document scroll dimensions.`);
    }
  }

  await navigate('/crm/marketing/briefings');
  await waitFor(`!!document.querySelector('.marketing-action-trigger')`,'Marketing briefing action trigger');
  const marketingClicked=await evaluate(`(()=>{const trigger=document.querySelector('.marketing-action-trigger');if(!(trigger instanceof HTMLButtonElement))return false;trigger.click();return true})()`);
  if(!marketingClicked)throw new Error('Marketing briefings: action trigger could not be clicked.');
  await waitFor(`!!document.querySelector('.marketing-actions-menu')`,'Marketing briefing action menu');
  const marketingAlignment=await evaluate(`(()=>{const item=document.querySelector('.marketing-actions-menu button');if(!(item instanceof HTMLButtonElement))return null;const style=getComputedStyle(item);return {textAlign:style.textAlign,justifyContent:style.justifyContent}})()`);
  if(!marketingAlignment||marketingAlignment.textAlign!=='left'||marketingAlignment.justifyContent!=='flex-start'){
    throw new Error(`Marketing briefings: action menu labels must align left; got ${JSON.stringify(marketingAlignment)}.`);
  }

  console.log('Row action dropdown placement and left-alignment browser smoke passed.');
}finally{
  try{socket.close()}catch{}
  browser.kill('SIGTERM');
  await Promise.race([browserExit,sleep(2000)]);
  await rm(profile,{recursive:true,force:true});
}
