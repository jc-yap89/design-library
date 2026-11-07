#!/usr/bin/env node
// Resident-designer reminder hook for Claude Code (SessionStart / UserPromptSubmit).
// Reads the hook payload from stdin, prints one short reminder as additional context.
// Read-only and fail-silent: it never writes files and never blocks the conversation.
import fs from 'node:fs';
import path from 'node:path';

const UI_WORDS = new RegExp(
  [
    '界面', '页面', '样式', '组件', '按钮', '布局', '间距', '配色', '颜色', '字体', '圆角',
    '动效', '动画', '交互', '响应式', '暗色', '主题', '视觉', '流光', '质感', '悬停', '设计',
    '\\bui\\b', '\\bux\\b', '\\bcss\\b', 'tailwind', 'button', 'hover', 'animation', 'layout',
    'component', 'style', 'theme', 'responsive', 'design', 'modal', 'navbar', 'sidebar',
  ].join('|'),
  'i',
);

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function openBacklogCount(dir) {
  try {
    const text = fs.readFileSync(path.join(dir, 'backlog.md'), 'utf8');
    return (text.match(/^\s*- \[ \] /gm) || []).length;
  } catch {
    return null;
  }
}

try {
  const payload = JSON.parse(readStdin() || '{}');
  const event = payload.hook_event_name || process.argv[2] || '';
  const cwd = payload.cwd || process.cwd();
  const dir = path.join(cwd, '.design-library');
  const resident = fs.existsSync(dir);
  const prompt = String(payload.prompt || '');

  const wanted =
    event === 'SessionStart' || (event === 'UserPromptSubmit' && (resident || UI_WORDS.test(prompt)));
  if (!wanted) process.exit(0);

  const open = resident ? openBacklogCount(dir) : null;
  const tail = resident
    ? `项目记录在 .design-library/${open === null ? '' : `，未完成待办 ${open} 条`}。`
    : '项目暂无 .design-library/，首次有需求或审计发现时再创建。';
  const message =
    '[design-library 常驻设计师] 本轮若涉及界面或交互：按 references/resident-designer.md 走 审计→记录→优化→复用；' +
    '小改直接做，大改先确认；用户明确偏好优先。' +
    tail;

  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: message } }) + '\n',
  );
} catch {
  // never block the conversation
}
process.exit(0);
