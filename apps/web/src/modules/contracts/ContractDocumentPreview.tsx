import type { ReactNode } from 'react';
import { isContractPlaceholder } from './contractTemplateEngine';

function renderLine(line:string,index:number):ReactNode{
 const parts=line.split(/(\{\{[A-Z][A-Z0-9_]*\.[A-Z][A-Z0-9_]*\}\})/g);
 return <div className="contracts-document-line" key={`${index}-${line.slice(0,18)}`}>{parts.map((part,partIndex)=>isContractPlaceholder(part)?<mark className="contracts-unresolved" key={`${index}-${partIndex}`}>{part}</mark>:<span key={`${index}-${partIndex}`}>{part||' '}</span>)}</div>;
}

export function ContractDocumentPreview({content,emptyText='Selecione um template para visualizar o documento.'}:{content:string;emptyText?:string}){
 return <div className="contracts-paper" aria-label="Prévia do contrato">{content.trim()?content.split('\n').map(renderLine):<div className="contracts-paper-empty">{emptyText}</div>}</div>;
}
