import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isValidPublicFieldName, isValidPublicFieldType, safePublicFieldName, safePublicFieldType } from '../../apps/web/src/modules/public-site/content/publicFormSafety.ts';

const contact=readFileSync(resolve(process.cwd(),'apps/web/src/modules/public-site/components/ContactSection.tsx'),'utf8');

test('public form field types are limited to the CMS-supported controls',()=>{
 assert.equal(safePublicFieldType('email'),'email');
 assert.equal(safePublicFieldType('SELECT'),'select');
 assert.equal(safePublicFieldType('file'),'text');
 assert.equal(safePublicFieldType('hidden'),'text');
 assert.equal(isValidPublicFieldType('textarea'),true);
 assert.equal(isValidPublicFieldType('submit'),false);
});

test('public form field names reject reserved invalid and duplicate identities',()=>{
 assert.equal(isValidPublicFieldName('nome'),true);
 assert.equal(isValidPublicFieldName('consent'),false);
 assert.equal(isValidPublicFieldName('nome completo'),false);
 const used=new Set(['consent']);
 assert.equal(safePublicFieldName('email',0,used),'email');
 assert.equal(safePublicFieldName('email',1,used),'email-2');
 assert.equal(safePublicFieldName('consent',2,used),'field-3');
});

test('public contact rendering never trusts CMS field name or input type directly',()=>{
 assert.ok(contact.includes('safePublicFieldName'));
 assert.ok(contact.includes('safePublicFieldType'));
 assert.ok(contact.includes('safeFields.map'));
 assert.equal(contact.includes("const type=itemText(item,'type','text')"),false);
});
