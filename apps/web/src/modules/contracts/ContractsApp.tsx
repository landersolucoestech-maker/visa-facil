import './contracts.css';

const READINESS=[
  {title:'Modelo de dados',state:'Aguardando referência',detail:'Entidades, campos, estados e regras serão definidos após análise do arquivo de referência.'},
  {title:'Assinatura eletrônica',state:'Arquitetura preparada',detail:'A integração prevista é o adapter Autentique através da futura API backend, sem tokens no navegador.'},
  {title:'Envio e notificações',state:'Arquitetura preparada',detail:'Comunicações poderão usar Resend através do backend quando o fluxo definitivo de contratos estiver definido.'},
  {title:'Persistência e auditoria',state:'Backend necessário',detail:'Contratos reais exigem banco persistente, histórico, autorização e trilha de auditoria server-side.'},
];

export function ContractsApp(){
 return <div className="crm-shell contracts-shell"><div className="crm-workspace">
  <header className="crm-topbar"><div><small>VISA FÁCIL · CRM · CONTRATOS</small><h1>Contratos</h1><p>Estrutura-base para gestão documental e assinatura eletrônica.</p></div></header>
  <main className="contracts-content">
   <section className="contracts-notice" aria-labelledby="contracts-reference-title"><div className="contracts-notice__icon" aria-hidden="true">▤</div><div><span>IMPLEMENTAÇÃO EM PREPARAÇÃO</span><h2 id="contracts-reference-title">A lógica definitiva depende do arquivo de referência</h2><p>Esta rota já está integrada à arquitetura, navegação e lazy loading do sistema. CRUD, campos, estados, documentos, automações e experiência operacional não serão inventados antes da análise do arquivo que servirá de referência.</p></div></section>
   <section className="contracts-grid" aria-label="Prontidão do módulo">{READINESS.map(item=><article key={item.title}><span>{item.state}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}</section>
   <section className="contracts-boundary"><div><span>LIMITE ATUAL</span><h2>Sem operação fictícia</h2></div><p>Nenhum botão de criar, enviar, assinar, cancelar ou consultar contrato é exibido enquanto não existir o contrato funcional definitivo e a camada backend necessária. O módulo será completado após a análise do arquivo de referência.</p></section>
  </main>
 </div></div>;
}

export default ContractsApp;
