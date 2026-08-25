import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOfxTransactions } from '../../apps/web/src/modules/finance/ofx.ts';

const sample = `OFXHEADER:100\nDATA:OFXSGML\n<OFX>\n<BANKMSGSRSV1>\n<STMTTRNRS>\n<STMTRS>\n<BANKTRANLIST>\n<STMTTRN>\n<TRNTYPE>CREDIT\n<DTPOSTED>20260825120000[-3:BRT]\n<TRNAMT>1500.00\n<FITID>credit-001\n<NAME>CLIENTE TESTE\n<MEMO>ASSESSORIA\n</STMTTRN>\n<STMTTRN>\n<TRNTYPE>DEBIT\n<DTPOSTED>20260824120000[-3:BRT]\n<TRNAMT>-250.50\n<FITID>debit-001\n<NAME>FORNECEDOR TESTE\n</STMTTRN>\n</BANKTRANLIST>\n</STMTRS>\n</STMTTRNRS>\n</BANKMSGSRSV1>\n</OFX>`;

test('OFX parser converts bank entries into canonical finance records', () => {
  const result = parseOfxTransactions(sample);
  assert.equal(result.rejected, 0);
  assert.equal(result.records.length, 2);

  const [credit, debit] = result.records;
  assert.deepEqual(
    { type: credit.type, status: credit.status, amount: credit.amount, date: credit.date, category: credit.category, paymentMethod: credit.paymentMethod },
    { type: 'Receita', status: 'Recebido', amount: 1500, date: '2026-08-25', category: 'Outros', paymentMethod: 'OFX' },
  );
  assert.deepEqual(
    { type: debit.type, status: debit.status, amount: debit.amount, date: debit.date },
    { type: 'Despesa', status: 'Pago', amount: 250.5, date: '2026-08-24' },
  );
});

test('OFX parser rejects invalid transactions instead of fabricating records', () => {
  const invalid = `<OFX><BANKTRANLIST><STMTTRN><DTPOSTED>INVALID<TRNAMT>0<FITID>bad</STMTTRN></BANKTRANLIST></OFX>`;
  const result = parseOfxTransactions(invalid);
  assert.equal(result.records.length, 0);
  assert.equal(result.rejected, 1);
});

test('OFX parser does not accept arbitrary non-OFX text', () => {
  assert.deepEqual(parseOfxTransactions('not a bank statement'), { records: [], rejected: 0 });
});
