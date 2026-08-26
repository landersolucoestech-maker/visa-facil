import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const webRoot = resolve(root, 'apps/web');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const vite = await createServer({ root: webRoot, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });
after(async () => { await vite.close(); });
const settingsDomain = await vite.ssrLoadModule('/src/modules/attendance/attendanceSettings.ts');
const attendanceDomain = await vite.ssrLoadModule('/src/modules/attendance/attendanceDomain.ts');

function memoryStorage(initial = new Map(), throwOnSet = false) { const values = new Map(initial); return { getItem:(key)=>values.has(key)?values.get(key):null, setItem:(key,value)=>{if(throwOnSet)throw new Error('quota');values.set(key,String(value));}, removeItem:(key)=>values.delete(key), clear:()=>values.clear() }; }
function withSessionStorage(storage, callback) { const previous=globalThis.sessionStorage; globalThis.sessionStorage=storage; try{return callback();} finally{if(previous===undefined)delete globalThis.sessionStorage;else globalThis.sessionStorage=previous;} }

test('VisaChat atendimento settings mirror the reference automation structure', () => {
  const settings = settingsDomain.getDefaultVisaChatSettings();
  assert.equal(settingsDomain.isVisaChatSettings(settings), true);
  assert.equal(settings.version, 2);
  for (const key of ['enabled','welcome_message','main_menu_message','menu_options','templates','required_fields','optional_fields','invalid_option_message','absence_message','out_of_hours_message','closing_message','return_to_menu_rule','escalation_rules','notification_channels','supervisor_user_id','manager_user_id']) assert.ok(Object.hasOwn(settings,key), `missing ${key}`);
  for (const removed of ['general','businessHours','automaticMessages','menu','queues','routing','slaPolicies','tags','priorities','notifications','channels']) assert.equal(Object.hasOwn(settings,removed), false, `unexpected ${removed}`);
  assert.ok(settings.menu_options.length >= 5);
  assert.ok(settings.escalation_rules.length >= 2);
  assert.ok(settings.templates.length >= settings.menu_options.length);
});

test('VisaChat settings recover from corrupt storage and quota failures', () => {
  withSessionStorage(memoryStorage(new Map([[settingsDomain.VISACHAT_SETTINGS_STORAGE_KEY,'{bad-json']])),()=>assert.equal(settingsDomain.isVisaChatSettings(settingsDomain.getVisaChatSettings()),true));
  withSessionStorage(memoryStorage(new Map(),true),()=>assert.doesNotThrow(()=>settingsDomain.saveVisaChatSettings(settingsDomain.getDefaultVisaChatSettings())));
});

test('VisaChat internal domain still supports direct, group and channel without phone identities', () => {
  const base={id:'team-settings-test',kind:'team',customer:'Equipe',handle:'Administrador · Consultor',email:'',channel:'Equipe',status:'Ativo',assignee:'Administrador',queue:'Equipe',protocol:'INT-SETTINGS',tags:['Interno'],lastMessage:'Olá',lastMessageAt:'10:00',updatedAt:'2026-08-26T10:00:00-03:00',participantIds:['u-1','u-2'],unread:0,crmType:'Equipe',service:'',destination:'',visaType:'',messages:[{id:'msg-1',sender:'agent',author:'Administrador',body:'Olá',time:'10:00',visibility:'internal'}]};
  for(const teamType of ['direct','group','channel']) assert.equal(attendanceDomain.isAttendanceConversation({...base,teamType,...(teamType==='channel'?{channelSlug:'geral'}:{})}),true);
});

test('Only atendimento configuration changed; chat surface keeps its existing structured features', () => {
  const app=read('apps/web/src/modules/attendance/AttendanceApp.tsx');
  const panel=read('apps/web/src/modules/attendance/AttendanceSettingsPanel.tsx');
  for(const token of ['TEAM_CONVERSATION_TYPES','Conversa direta','Grupo','Canal','Nota interna','Resposta rápida']) assert.ok(app.includes(token),`AttendanceApp missing ${token}`);
  for(const token of ['Mensagens','Menu e filas','Escalonamento','Templates','Fluxo inicial','Mensagens de exceção e encerramento','Menu principal de triagem','Retorno ao menu principal','Responsáveis padrão','Regras de escalonamento','Questionários por serviço','Campos obrigatórios','Mensagem Automática','Salvar configuração','Testar escalonamento']) assert.ok(panel.includes(token),`settings panel missing ${token}`);
  for(const extra of ['Configurações gerais','Horários de atendimento','Roteamento e SLA','Canais de atendimento','Notificações</']) assert.equal(panel.includes(extra),false,`unexpected extra settings section ${extra}`);
});
