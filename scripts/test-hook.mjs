#!/usr/bin/env node
// Self-test for resident-hook.mjs. Run: node scripts/test-hook.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'resident-hook.mjs');
const run = (payload, raw) =>
  spawnSync(process.execPath, [HOOK], { input: raw ?? JSON.stringify(payload), encoding: 'utf8' });
const message = (payload) => {
  const r = run(payload);
  assert.equal(r.status, 0, 'hook must always exit 0');
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : null;
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resident-hook-'));
const plain = path.join(tmp, 'plain');
const app = path.join(tmp, 'app');
const deep = path.join(app, 'src', 'deep');
fs.mkdirSync(plain, { recursive: true });
fs.mkdirSync(deep, { recursive: true });
fs.mkdirSync(path.join(app, '.design-library'));
fs.writeFileSync(path.join(app, '.design-library', 'backlog.md'), '- [ ] UI-001 a\n- [x] UI-002 b\n- [ ] UI-003 c\n');

let passed = 0;
const test = (name, fn) => {
  fn();
  passed += 1;
  console.log(`ok  ${name}`);
};

test('session start always reminds (full)', () => {
  const m = message({ hook_event_name: 'SessionStart', cwd: plain });
  assert.match(m, /审计→记录→优化→复用/);
});
test('every prompt reminds, even backend ones (short form)', () => {
  const m = message({ hook_event_name: 'UserPromptSubmit', cwd: plain, prompt: '修一下数据库迁移' });
  assert.ok(m && m.includes('常驻设计师'));
  assert.doesNotMatch(m, /审计→记录→优化→复用/);
});
for (const prompt of ['这个页面太丑了', '点击没有反馈', '加个暗黑模式', '对齐有点歪', '字太小了', '移动端错位', 'make the modal feel snappier']) {
  test(`colloquial UI prompt gets the full line: ${prompt}`, () => {
    const m = message({ hook_event_name: 'UserPromptSubmit', cwd: plain, prompt });
    assert.match(m, /审计→记录→优化→复用/);
  });
}
for (const prompt of ['帮我设计一下数据库表结构', 'refactor the auth design doc']) {
  test(`non-UI "design" prompt stays short: ${prompt}`, () => {
    const m = message({ hook_event_name: 'UserPromptSubmit', cwd: plain, prompt });
    assert.doesNotMatch(m, /审计→记录→优化→复用/);
  });
}
test('finds .design-library from a deep subfolder and counts open items', () => {
  const m = message({ hook_event_name: 'UserPromptSubmit', cwd: deep, prompt: '修一下数据库迁移' });
  assert.match(m, /未完成待办 2 条/);
  assert.match(m, /审计→记录→优化→复用/);
});
test('unknown events stay silent', () => {
  assert.equal(message({ hook_event_name: 'Stop', cwd: plain }), null);
});
test('garbage and empty stdin are silent and exit 0', () => {
  assert.equal(run(null, 'not json').stdout, '');
  assert.equal(run(null, '').stdout, '');
  assert.equal(run(null, 'not json').status, 0);
});
test('hook never writes into the project', () => {
  const before = fs.readdirSync(plain).length;
  message({ hook_event_name: 'UserPromptSubmit', cwd: plain, prompt: '改一下按钮样式' });
  assert.equal(fs.readdirSync(plain).length, before);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed`);
