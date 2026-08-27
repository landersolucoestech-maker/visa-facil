import { Component, type ErrorInfo, type ReactNode } from 'react';
import './global-error-boundary.css';

type Props={children:ReactNode};
type State={failed:boolean};

function basePath(){return import.meta.env.BASE_URL.replace(/\/$/,'')}
function href(path:string){return `${basePath()}${path}`||path}

export class GlobalErrorBoundary extends Component<Props,State>{
 state:State={failed:false};

 static getDerivedStateFromError():State{return{failed:true}}

 componentDidCatch(error:Error,info:ErrorInfo){
  if(import.meta.env.DEV)console.error('Visa Fácil UI error boundary',error,info);
 }

 private reload=()=>window.location.reload();
 private workspaces=()=>{window.location.href=href('/workspaces')};

 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="global-error-boundary" role="alert">
   <section className="global-error-boundary__card">
    <span className="global-error-boundary__mark" aria-hidden="true">VF</span>
    <small>VISA FÁCIL · PROTÓTIPO</small>
    <h1>Não foi possível carregar esta área.</h1>
    <p>A interface encontrou um erro inesperado. Seus dados locais não serão apagados por esta tela.</p>
    <div className="global-error-boundary__actions">
     <button type="button" onClick={this.reload}>Tentar novamente</button>
     <button type="button" className="is-secondary" onClick={this.workspaces}>Voltar aos workspaces</button>
    </div>
   </section>
  </main>;
 }
}

export default GlobalErrorBoundary;
