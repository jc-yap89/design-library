#!/usr/bin/env node
// Resident-designer reminder hook for Claude Code (SessionStart / UserPromptSubmit).
// Always-on: every session start and every prompt gets a reminder. Prompts that look UI-related, or
// projects that already have a .design-library/ directory (searched upward from cwd), get the full
// line; everything else gets a short one. Read-only and fail-silent: never writes files, never blocks.
import fs from 'node:fs';
import path from 'node:path';

const UI_WORDS = new RegExp(
  [
    // zh: UI objects and properties
    '界面', '页面', '样式', '组件', '按钮', '布局', '间距', '留白', '配色', '颜色', '字体', '字号', '字太', '圆角', '阴影', '边框',
    '图标', '弹窗', '表单', '导航', '菜单', '列表', '卡片', '主题', '前端', '移动端', '手机端', '响应式', '对齐', '错位',
    // zh: motion and interaction
    '动效', '动画', '过渡', '交互', '悬停', '点击', '点不', '反馈', '卡顿', '闪烁', '滚动', '加载', '骨架', '流光', '质感', '渐变',
    // zh: modes and judgements
    '暗黑', '暗色', '夜间', '深色', '浅色', '好看', '难看', '太丑', '美观', '视觉',
    // en
    '\\bui\\b', '\\bux\\b', '\\bcss\\b', 'tailwind', 'frontend', 'front-end', 'design system', 'dark mode', 'light mode',
    'button', 'hover', 'animation', 'transition', 'layout', 'component', 'stylesheet', 'theme', 'responsive',
    'modal', 'dropdown', 'tooltip', 'toast', 'navbar', 'sidebar', 'icon', 'font', 'padding', 'margin',
    'mobile', 'scroll', 'skeleton', 'spinner', 'snappy', 'jank', 'flicker', 'sluggish',
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

// Walk up from start to the filesystem root looking for a .design-library directory.
export function findResident(start) {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, '.design-library');
    try {
      if (fs.statSync(candidate).isDirectory()) return candidate;
    } catch {
      // not here; keep climbing
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
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

export function buildMessage({ event, cwd, prompt }) {
  const dir = findResident(cwd);
  const full = event === 'SessionStart' || Boolean(dir) || UI_WORDS.test(prompt);
  if (!full) return '[design-library 常驻设计师] 若本轮涉及界面或交互，按 references/resident-designer.md 处理。';
  const open = dir ? openBacklogCount(dir) : null;
  const tail = dir
    ? `项目记录在 ${dir}${open === null ? '' : `，未完成待办 ${open} 条`}。`
    : '项目暂无 .design-library/，首次有需求或审计发现时再创建。';
  return (
    '[design-library 常驻设计师] 本轮若涉及界面或交互：按 references/resident-designer.md 走 审计→记录→优化→复用；' +
    '小改直接做，大改先确认；用户明确偏好优先。' +
    tail
  );
}

// Run as a hook only when executed directly, so the helpers stay importable.
if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const payload = JSON.parse(readStdin() || '{}');
    const event = payload.hook_event_name || process.argv[2] || '';
    if (event === 'SessionStart' || event === 'UserPromptSubmit') {
      const message = buildMessage({ event, cwd: payload.cwd || process.cwd(), prompt: String(payload.prompt || '') });
      process.stdout.write(
        JSON.stringify({ hookSpecificOutput: { hookEventName: event, additionalContext: message } }) + '\n',
      );
    }
  } catch {
    // never block the conversation
  }
  process.exit(0);
}
