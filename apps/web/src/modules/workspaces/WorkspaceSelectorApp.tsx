import { getAuthSession, signOut } from '../auth/auth';
import './workspaces.css';

function basePath(){const base=import.meta.env.BASE_URL.replace(/\/$/,'');return base||''}
function go(path:string){window.location.href=`${basePath()}${path}`||path}
function BrandMark(){return <span className="workspace-brand-mark" aria-hidden="true"><i/><b/></span>}

const WORKSPACES=[
  {id:'crm',name:'CRM',eyebrow:'OPERAÇÃO & RELACIONAMENTO',description:'Gerencie leads, contatos, clientes, atendimentos, tarefas, agenda, financeiro, marketing e relatórios.',href:'/crm',icon:'◎',features:['CRM comercial','Atendimentos','Financeiro & Marketing']},
  {id:'website',name:'Site / Website',eyebrow:'CMS & CONTEÚDO',description:'Gerencie páginas, seções, copywriting, imagens, mídia, SEO, links e publicação do site institucional.',href:'/site-admin',icon:'▦',features:['Páginas & seções','Mídia & SEO','Draft, preview & publish']},
] as const;

export function WorkspaceSelectorApp(){
 const session=getAuthSession();
 return <main className="workspace-page">
  <header className="workspace-header"><a className="workspace-brand" href={`${basePath()}/`}><BrandMark/><span><strong>VISA FÁCIL</strong><small>Plataforma interna</small></span></a><div className="workspace-account"><div><strong>{session?.name||'Administrador'}</strong><small>{session?.email||'Conta interna'}</small></div><button onClick={()=>{signOut();go('/login')}}>Sair</button></div></header>
  <section className="workspace-content">
   <div className="workspace-intro"><span>ESCOLHA O AMBIENTE</span><h1>Onde você quer trabalhar agora?</h1><p>Os workspaces compartilham a mesma sessão. Você pode alternar entre eles a qualquer momento sem realizar um novo login.</p></div>
   <div className="workspace-grid">{WORKSPACES.map((workspace,index)=><button className={`workspace-card workspace-card--${workspace.id}`} key={workspace.id} onClick={()=>go(workspace.href)}><div className="workspace-card-top"><span className="workspace-index">0{index+1}</span><span className="workspace-icon">{workspace.icon}</span></div><span className="workspace-eyebrow">{workspace.eyebrow}</span><h2>{workspace.name}</h2><p>{workspace.description}</p><div className="workspace-features">{workspace.features.map(item=><span key={item}>✓ {item}</span>)}</div><div className="workspace-enter">Acessar workspace <b>→</b></div></button>)}</div>
   <div className="workspace-footnote"><span>VISA FÁCIL</span><p>Arquitetura preparada para receber novos workspaces sem alterar o fluxo de autenticação.</p></div>
  </section>
 </main>
}

export default WorkspaceSelectorApp;
