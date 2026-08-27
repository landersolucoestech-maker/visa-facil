import { useState } from 'react';
import type { FinanceRecord } from './types';
import { parseOfxTransactions, validateOfxFile } from './ofx';
import { applyFinanceRules } from './financeConfigStore';

type Props = {
  existingIds: string[];
  close: () => void;
  imported: (records: FinanceRecord[]) => void;
};

function UploadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function OfxImportModal({ existingIds, close, imported }: Props) {
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = (selected?: File) => {
    setError('');
    if (!selected) { setFile(undefined); return; }
    const validationError = validateOfxFile(selected);
    if (validationError) { setFile(undefined); setError(validationError); return; }
    setFile(selected);
  };

  const submit = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    try {
      const parsed = parseOfxTransactions(await file.text());
      if (!parsed.records.length) {
        setError(parsed.rejected ? 'Nenhuma movimentação válida pôde ser importada deste OFX.' : 'O arquivo não contém movimentações bancárias OFX reconhecíveis.');
        return;
      }

      const existing = new Set(existingIds);
      const fresh = parsed.records.filter((record) => !existing.has(record.id)).map(applyFinanceRules);
      if (!fresh.length) {
        setError('Todas as movimentações deste arquivo já foram importadas nesta sessão.');
        return;
      }
      imported(fresh);
    } catch (failure) {
      setError(failure instanceof Error&&failure.message.startsWith('O arquivo OFX excede')?failure.message:'Não foi possível ler o arquivo OFX. Verifique se o arquivo está íntegro e tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="finance-modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <div className="finance-ofx-modal finance-transaction-ofx-modal" role="dialog" aria-modal="true" aria-labelledby="finance-ofx-title">
      <header><div><span>IMPORTAR OFX</span><h2 id="finance-ofx-title">Importar extrato bancário</h2><p>As movimentações válidas serão adicionadas à lista atual de Transações.</p></div><button type="button" onClick={close} aria-label="Fechar">×</button></header>
      <div className="finance-ofx-body">
        <label className="finance-ofx-drop"><input type="file" accept=".ofx,application/x-ofx" onChange={(event) => choose(event.target.files?.[0])}/><UploadIcon /><strong>{file ? file.name : 'Selecionar arquivo OFX'}</strong><span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Arquivos .OFX · máximo de 5 MB'}</span></label>
        <p className="finance-config-note">Entradas são importadas como receitas recebidas e saídas como despesas pagas. As regras financeiras ativas desta sessão são aplicadas pela descrição; sem correspondência, é usada a primeira categoria ativa compatível.</p>
        {error && <p className="finance-inline-error" role="alert">{error}</p>}
      </div>
      <footer><button className="crm-btn-secondary" type="button" onClick={close}>Cancelar</button><button className="crm-btn-primary" type="button" disabled={!file || busy} onClick={submit}>{busy ? 'Lendo arquivo…' : 'Importar'}</button></footer>
    </div>
  </div>;
}

export default OfxImportModal;