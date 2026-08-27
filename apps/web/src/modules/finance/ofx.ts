import type { FinanceRecord } from './types';

const MAX_OFX_BYTES = 5 * 1024 * 1024;
const MAX_OFX_SOURCE_CHARS = 5 * 1024 * 1024;
const MAX_OFX_TRANSACTIONS = 10_000;
const MAX_OFX_FIELD_CHARS = 4_000;

export type OfxParseResult = {
  records: FinanceRecord[];
  rejected: number;
};

export function validateOfxFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.ofx')) return 'Selecione um arquivo com extensão .ofx.';
  if (file.size === 0) return 'O arquivo OFX está vazio.';
  if (file.size > MAX_OFX_BYTES) return 'O arquivo OFX excede o limite de 5 MB.';
  return null;
}

function decodeOfxText(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim()
    .slice(0, MAX_OFX_FIELD_CHARS);
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>(?:\\s*)?([^<\\r\\n]*)`, 'i'));
  return match ? decodeOfxText(match[1]) : '';
}

function normalizeDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return '';
  const [, year, month, day] = match;
  const candidate = `${year}-${month}-${day}`;
  const parsed = new Date(`${candidate}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  if (parsed.toISOString().slice(0, 10) !== candidate) return '';
  return candidate;
}

function normalizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
}

function transactionBlocks(source: string) {
  const blocks:string[]=[];
  for(const match of source.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|$))/gi)){
    if(blocks.length>=MAX_OFX_TRANSACTIONS)throw new Error(`O arquivo OFX excede o limite de ${MAX_OFX_TRANSACTIONS} movimentações.`);
    blocks.push(match[1]);
  }
  return blocks;
}

export function parseOfxTransactions(source: string): OfxParseResult {
  if(source.length>MAX_OFX_SOURCE_CHARS)throw new Error('O conteúdo OFX excede o limite de processamento de 5 MB.');
  if (!source.trim() || !/<OFX[>\s]/i.test(source)) return { records: [], rejected: 0 };

  const records: FinanceRecord[] = [];
  const seenIds = new Set<string>();
  let rejected = 0;

  transactionBlocks(source).forEach((block, index) => {
    const rawAmount = tagValue(block, 'TRNAMT').replace(',', '.');
    const signedAmount = Number(rawAmount);
    const date = normalizeDate(tagValue(block, 'DTPOSTED'));
    if (!Number.isFinite(signedAmount) || signedAmount === 0 || !date) {
      rejected += 1;
      return;
    }

    const fitId = tagValue(block, 'FITID');
    const fallbackId = `${date}-${signedAmount}-${index + 1}`;
    const id = `ofx-${normalizeId(fitId || fallbackId)}`;
    if (!id || seenIds.has(id)) {
      rejected += 1;
      return;
    }
    seenIds.add(id);

    const name = tagValue(block, 'NAME');
    const memo = tagValue(block, 'MEMO');
    const transactionType = tagValue(block, 'TRNTYPE');
    const description = (name || memo || transactionType || 'Movimentação OFX').slice(0,MAX_OFX_FIELD_CHARS);
    const type = signedAmount > 0 ? 'Receita' : 'Despesa';

    records.push({
      id,
      description,
      type,
      category: 'Outros',
      amount: Math.abs(signedAmount),
      date,
      dueDate: date,
      status: type === 'Receita' ? 'Recebido' : 'Pago',
      paymentMethod: 'OFX',
      relatedName: '',
      notes: [
        'Importado de extrato OFX.',
        transactionType ? `Tipo bancário: ${transactionType}.` : '',
        memo && memo !== description ? `Memo: ${memo}` : '',
      ].filter(Boolean).join(' ').slice(0,MAX_OFX_FIELD_CHARS),
    });
  });

  return { records, rejected };
}
