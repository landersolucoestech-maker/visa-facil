import { useState } from 'react';
import { Card, Field, Toggle, base, StatusBadge } from './settingsShared';

export function PublicRegistrationTab(){
 const [enabled,setEnabled]=useState(true);const [slug,setSlug]=useState('visa-facil');const link=`${window.location.origin}${base()}/cadastro/${slug}`;const [copied,setCopied]=useState(false);
 const copy=async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setCopied(false)}};
 return <Card title="Cadastro Público" description="Gere e compartilhe o link público de cadastro de clientes vinculado a este workspace." icon="◎">
  <div className="settings-setting-row settings-public-toggle"><div><strong>Cadastro público ativo</strong><p>Quando desativado, o link público fica indisponível.</p></div><Toggle checked={enabled} onChange={setEnabled}/></div>
  <div className="settings-public-link"><Field label="Link público"><div className="settings-inline-input"><input readOnly value={link}/><button className="settings-btn settings-btn-outline" onClick={copy}>⧉ {copied?'Copiado':'Copiar'}</button></div></Field></div>
  <div className="settings-public-metrics">{[['Acessos','0'],['Conversões','0'],['Cadastros recebidos','0']].map(([l,v])=><article key={l}><span>{l}</span><strong>{v}</strong></article>)}</div>
  <div className="settings-public-actions"><button className="settings-btn settings-btn-outline" onClick={()=>setSlug('visa-facil')}>↻ Gerar link</button><button className="settings-btn settings-btn-outline" onClick={()=>setSlug(`visa-facil-${Math.floor(Math.random()*900+100)}`)}>⟳ Regenerar slug</button>{enabled&&<button className="settings-btn settings-btn-danger" onClick={()=>setEnabled(false)}>▰ Revogar link</button>}</div>
 </Card>;
}

export function BillingTab(){
 const invoices=[{id:'VF-2026-008',date:'10/08/2026',amount:'R$ 249,00',status:'Pago'},{id:'VF-2026-007',date:'10/07/2026',amount:'R$ 249,00',status:'Pago'},{id:'VF-2026-006',date:'10/06/2026',amount:'R$ 249,00',status:'Pago'}];
 const plans=[{name:'Essencial',price:'R$ 149/mês',features:['CRM e atendimento','Agenda e tarefas','Relatórios básicos']},{name:'Professional',price:'R$ 249/mês',features:['Tudo do Essencial','Marketing e automações','Financeiro completo'],current:true},{name:'Business',price:'R$ 449/mês',features:['Tudo do Professional','Mais usuários','Suporte prioritário']}];
 return <div className="settings-billing-stack">
  <div className="settings-billing-grid"><Card title="Plano Atual" icon="♛"><div className="settings-plan-current"><div><strong>Professional</strong><StatusBadge status="Conectado"/></div><div className="settings-divider"/><p><span>Próxima renovação</span><b>10/09/2026</b></p><button className="settings-btn settings-btn-outline settings-full">▤ Gerenciar Assinatura</button></div></Card><Card title="Uso de Assentos" icon="♙"><div className="settings-seat-use"><div><strong>2</strong><span>/ 5 assentos</span><b>40% utilizado</b></div><div className="settings-progress"><i style={{width:'40%'}}/></div><p>3 assentos disponíveis</p><button className="settings-btn settings-btn-outline settings-full">+ Adicionar Assentos</button></div></Card></div>
  <Card title="Método de Pagamento" description="Cartão guardado para cobranças automáticas" icon="▤"><div className="settings-payment-row"><span className="settings-card-brand">VISA</span><div><strong>•••• •••• •••• 4242</strong><p>Expira 12/2027</p></div><span className="settings-pill">Principal</span><button className="settings-btn settings-btn-ghost">Alterar</button></div></Card>
  <Card title="Histórico de Faturas" description="Faturas dos últimos 12 meses" icon="▧"><div className="settings-invoice-table"><div className="settings-invoice-head"><span>Fatura</span><span>Data</span><span>Valor</span><span>Status</span><span/></div>{invoices.map(inv=><div className="settings-invoice-row" key={inv.id}><code>{inv.id}</code><span>{inv.date}</span><strong>{inv.amount}</strong><b>{inv.status}</b><button className="settings-btn settings-btn-ghost">⇩ Baixar</button></div>)}</div></Card>
  <Card title="Planos Disponíveis" description="Compare os planos e faça upgrade quando estiver pronto" icon="↗"><div className="settings-plans-grid">{plans.map(plan=><article className={plan.current?'is-current':''} key={plan.name}>{plan.current&&<span className="settings-current-plan">Plano Atual</span>}<h3>{plan.name}</h3><strong>{plan.price}</strong><ul>{plan.features.map(f=><li key={f}>✓ {f}</li>)}</ul><button disabled={plan.current} className={`settings-btn ${plan.current?'settings-btn-outline':'settings-btn-primary'} settings-full`}>{plan.current?'Plano Atual':'Fazer Upgrade'}</button></article>)}</div></Card>
 </div>;
}

