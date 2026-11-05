#!/usr/bin/env node
// Search the local design catalog.
// Usage:
//   node find.mjs "价格卡片 光晕"            -> top matches across the five sites
//   node find.mjs "pricing glow" --limit 8
//   node find.mjs "hero" --site aceternity --json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CATALOG = path.join(ROOT, 'data', 'catalog.json');

const argv = process.argv.slice(2);
const flag = (name) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : undefined;
};
const has = (name) => argv.includes(name);
const json = has('--json');
const limit = Number(flag('--limit') || 12);
const siteFilter = flag('--site');
const query = argv.filter((a, i) => !a.startsWith('--') && !['--limit', '--site'].includes(argv[i - 1])).join(' ').trim();

if (!query) {
  console.error('usage: node find.mjs "<what you need>" [--limit N] [--site aceternity|reactbits|originkit|motionsites|aura] [--json]');
  process.exit(2);
}
if (!fs.existsSync(CATALOG)) {
  console.error(`catalog missing: ${CATALOG}\nrun: node scripts/build.mjs`);
  process.exit(2);
}

const { entries, builtAt, counts } = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));

// Chinese design vocabulary -> English slug vocabulary.
const LEXICON = {
  首屏: ['hero'], 英雄区: ['hero'], 主视觉: ['hero'],
  价格: ['pricing'], 定价: ['pricing'], 套餐: ['pricing', 'plan'],
  评价: ['testimonial'], 证言: ['testimonial'], 口碑: ['testimonial'],
  导航: ['navbar', 'nav'], 菜单: ['menu', 'nav'], 页脚: ['footer'],
  跑马灯: ['marquee', 'loop'], 无限滚动: ['marquee', 'loop', 'infinite'],
  卡片: ['card'], 按钮: ['button'], 徽章: ['badge'], 标签: ['badge', 'tag'],
  加载: ['loader', 'loading'], 骨架: ['skeleton'], 进度: ['progress'],
  鼠标: ['cursor'], 光标: ['cursor'], 跟随: ['follow', 'trail'],
  背景: ['background'], 粒子: ['particle'], 光晕: ['glow'], 发光: ['glow', 'shine'],
  玻璃: ['glass'], 毛玻璃: ['glass'], 渐变: ['gradient'], 极光: ['aurora'],
  网格: ['grid'], 点阵: ['dot', 'grid'], 波纹: ['ripple', 'wave'],
  流体: ['fluid', 'liquid'], 液态: ['liquid'], 丝绸: ['silk'], 烟雾: ['smoke'],
  隧道: ['tunnel'], 星球: ['planet', 'orb'], 星空: ['galaxy', 'star'], 星空背景: ['galaxy'],
  火焰: ['fire', 'flame'], 金属: ['metal', 'chrome'], 霓虹: ['neon'], 像素: ['pixel'],
  半调: ['halftone'], 噪点: ['noise', 'grain'], 扫描: ['scan'], 雷达: ['radar'],
  终端: ['terminal'], 故障: ['glitch'], 扭曲: ['distort', 'warp'], 磁吸: ['magnet'],
  拖拽: ['drag'], 弹簧: ['spring'], 微交互: ['micro'], 过渡: ['transition'],
  揭示: ['reveal'], 滚动: ['scroll'], 视差: ['parallax'], 堆叠: ['stack'],
  文字: ['text'], 打字机: ['type', 'typewriter'], 标题: ['heading', 'text'],
  相册: ['gallery'], 轮播: ['carousel', 'slider'], 折叠: ['accordion'], 手风琴: ['accordion'],
  侧边栏: ['sidebar'], 表单: ['form'], 输入: ['input'], 开关: ['toggle', 'switch'],
  选项卡: ['tabs'], 通知: ['notification', 'toast'], 弹窗: ['modal', 'dialog'],
  表格: ['table'], 看板: ['kanban'], 仪表盘: ['dashboard'], 登录: ['auth', 'login'],
  常见问题: ['faq'], 团队: ['team'], 统计: ['stats', 'counter'], 博客: ['blog'],
  电商: ['ecommerce', 'product'], 等待名单: ['waitlist'], 联系: ['contact'],
  集成: ['integration'], 客户: ['logo', 'client'], 视频: ['video'], 图片: ['image'],
  头像: ['avatar'], 边框: ['border'], 阴影: ['shadow'], 模糊: ['blur'],
  '3D': ['3d'], 三维: ['3d'], 球体: ['sphere', 'orb'], 立方体: ['cube'],
  头像墙: ['avatar', 'gallery'], 背景音乐: ['audio'],
  玻璃拟态: ['glassmorphism'], 新拟态: ['neumorphism'], 拟物: ['skeuomorphism'],
  勾选框: ['checkbox'], 复选框: ['checkbox'], 单选: ['radio'], 开关按钮: ['toggle', 'switch'],
  提示框: ['tooltip'], 图案: ['pattern'], 纹理: ['texture'], 毛玻璃卡片: ['glass', 'card'],
  作品集: ['portfolio'], 代理: ['agency'], 安全: ['security'], 金融: ['finance'],
  极简: ['minimal'], 复古: ['retro', '8-bit'], 未来: ['future', 'futuristic'],
};

const ALIAS = {
  nav: ['navbar', 'nav'], navbar: ['nav'], cta: ['button'], btn: ['button'],
  bg: ['background'], fx: ['effect'], shader: ['shader'], webgl: ['webgl'],
  typewriter: ['type'], typing: ['type'], marquee: ['marquee', 'loop'],
  testimonial: ['testimonial'], testimonials: ['testimonial'],
  faq: ['faq'], pricing: ['pricing'], hero: ['hero'], footer: ['footer'],
  login: ['auth'], signup: ['auth'], signin: ['auth'],
  glow: ['glow'], shine: ['shine', 'glow'], hover: ['hover'],
};

function expand(q) {
  const terms = new Set();
  let rest = q.toLowerCase();
  for (const [zh, en] of Object.entries(LEXICON).sort((a, b) => b[0].length - a[0].length)) {
    if (zh.length >= 2 && rest.includes(zh)) {
      en.forEach((t) => terms.add(t));
      rest = rest.split(zh).join(' ');
    }
  }
  for (const raw of rest.split(/[^a-z0-9]+/)) {
    if (!raw) continue;
    terms.add(raw);
    (ALIAS[raw] || []).forEach((t) => terms.add(t));
  }
  return [...terms].filter((t) => t.length > 1);
}

function scoreOf(entry, terms, phrase) {
  const name = entry.name.toLowerCase();
  const nameTokens = name.split(/\s+/);
  let s = 0;
  const matched = new Set();
  for (const t of terms) {
    let hit = 0;
    if (nameTokens.includes(t)) hit = 5;
    else if (t.length >= 4 && nameTokens.some((nt) => nt.length >= 4 && (nt.startsWith(t) || t.startsWith(nt)))) hit = 3;
    else if (name.includes(t)) hit = 2;
    if (hit) matched.add(t);
    s += hit;
    if (entry.tags.includes(t)) {
      s += 2;
      matched.add(t);
    }
    if (entry.category === t) s += 1;
  }
  if (phrase.length > 3 && name.includes(phrase)) s += 8;
  if (entry.site === 'motionsites' && terms.some((t) => ['prompt', 'landing', 'hero', 'template'].includes(t))) s += 1;
  return { s, coverage: matched.size };
}

const terms = expand(query);
const phrase = query.toLowerCase().replace(/\s+/g, ' ');

const scored = entries
  .filter((e) => !siteFilter || e.site === siteFilter)
  .map((e) => {
    const { s, coverage } = scoreOf(e, terms, phrase);
    return { ...e, score: s, coverage };
  })
  .filter((e) => e.score > 0)
  .sort((a, b) => b.coverage - a.coverage || b.score - a.score || a.name.length - b.name.length);

// Keep variants (Pricing 01..04) from crowding out other intents.
const seenBase = new Map();
const ranked = [];
for (const r of scored) {
  const base = r.name.toLowerCase().replace(/\s*\d+$/, '');
  const n = seenBase.get(base) || 0;
  if (n >= 2) continue;
  seenBase.set(base, n + 1);
  ranked.push(r);
  if (ranked.length >= limit) break;
}

if (json) {
  console.log(JSON.stringify({ query, terms, builtAt, counts, results: ranked }, null, 2));
  process.exit(0);
}

if (!ranked.length) {
  console.log(`no match for "${query}" (terms: ${terms.join(', ')})`);
  console.log('try fewer words, or English keywords such as hero / pricing / cursor / shader');
  process.exit(0);
}

const LABEL = {
  uiverse: 'Uiverse',
  magicui: 'Magic UI',
  animata: 'Animata',
  cultui: 'Cult UI',
  kokonutui: 'Kokonut UI',
  eldoraui: 'Eldora UI',
  aceternity: 'Aceternity UI',
  reactbits: 'React Bits',
  originkit: 'Originkit',
  motionsites: 'MotionSites',
  aura: 'Aura',
};
console.log(`query: ${query}`);
console.log(`terms: ${terms.join(', ')}`);
console.log(`index: ${entries.length} entries, built ${builtAt.slice(0, 10)}`);
console.log('');
for (const r of ranked) {
  console.log(`${String(r.score).padStart(3)}  [${LABEL[r.site]}] ${r.name}  (${r.category})`);
  console.log(`     ${r.url}`);
}
