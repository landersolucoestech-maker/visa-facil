import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source=readFileSync(resolve(process.cwd(),'apps/web/src/modules/agenda/AgendaApp.tsx'),'utf8');
const root=readFileSync(resolve(process.cwd(),'apps/web/src/RootApplication.tsx'),'utf8');

test('day and week agenda grids expand to include events outside the default business hours',()=>{
  assert.ok(source.includes('function visibleHours(events:AgendaEvent[]'));
  assert.ok(source.includes('Math.min(defaultStart,...eventHours)'));
  assert.ok(source.includes('Math.max(defaultEnd,...eventHours)'));
  assert.ok(source.includes('const hours=visibleHours(dayEvents)'));
  assert.ok(source.includes('const hours=visibleHours(weekEvents)'));
});

test('events without a start time have an explicit visible row instead of disappearing',()=>{
  assert.ok(source.includes('agenda-untimed-row'));
  assert.ok(source.includes('agenda-week-untimed'));
  assert.ok(source.includes('Sem horário'));
});

test('Agenda keeps the canonical single-style lazy loader',()=>{
  assert.ok(root.includes("const AgendaApp = lazy(() => import('./modules/agenda/AgendaApp'));"));
  assert.equal(root.includes('agenda-integrity.css'),false);
});
