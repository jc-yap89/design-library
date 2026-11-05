#!/usr/bin/env node
// Build the local design catalog from the five sites' sitemaps.
// Usage: node build.mjs [--out data/catalog.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : path.join(ROOT, 'data', 'catalog.json');

const UA = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

async function locs(url) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const txt = await res.text();
  return [...txt.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
}

function titleize(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b3d\b/gi, '3D')
    .replace(/\bascii\b/gi, 'ASCII')
    .replace(/\bai\b/gi, 'AI')
    .replace(/\bcrt\b/gi, 'CRT')
    .replace(/\bui\b/gi, 'UI')
    .replace(/\bglb\b/gi, 'GLB');
}

function tokens(slug) {
  return slug.split(/[-_/]+/).filter(Boolean).map((t) => t.toLowerCase());
}

const SITE_LABEL = {
  aceternity: 'Aceternity UI',
  reactbits: 'React Bits',
  originkit: 'Originkit',
  motionsites: 'MotionSites',
  aura: 'Aura',
};

const entries = [];
const seen = new Set();

function add(site, category, slug, url, extra = []) {
  if (!slug || seen.has(url)) return;
  seen.add(url);
  entries.push({
    site,
    category,
    name: titleize(slug),
    slug,
    url,
    tags: [...new Set([...tokens(slug), ...extra, category, site])],
  });
}

// --- Aceternity UI ---
{
  const base = 'https://ui.aceternity.com';
  const map = { components: 'component', blocks: 'block', templates: 'template', pages: 'page' };
  for (const u of await locs(`${base}/sitemap.xml`)) {
    const p = new URL(u).pathname.replace(/\/$/, '');
    const m = p.match(/^\/(components|blocks|templates|pages)\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/i);
    if (!m) continue;
    const kind = map[m[1].toLowerCase()];
    const parent = m[2].toLowerCase();
    const child = m[3]?.toLowerCase();
    if (child) {
      // /blocks/hero-sections/centered-around-testimonials -> one block inside a category
      add('aceternity', kind, child, `${base}${p}`, [...tokens(parent), 'section']);
    } else {
      // /blocks/pricing-sections -> category hub; /components/3d-card-effect -> one component
      const isHub = kind === 'block';
      add('aceternity', isHub ? 'block-hub' : kind, parent, `${base}${p}`, isHub ? ['hub', 'category'] : []);
    }
  }
}

// --- React Bits ---
{
  const base = 'https://reactbits.dev';
  const map = {
    'text-animations': 'text',
    animations: 'animation',
    components: 'component',
    backgrounds: 'background',
    micro: 'micro',
  };
  for (const u of await locs(`${base}/sitemap.xml`)) {
    const p = new URL(u).pathname.replace(/\/$/, '');
    const m = p.match(/^\/(text-animations|animations|components|backgrounds|micro)\/([a-z0-9-]+)$/i);
    if (m) add('reactbits', map[m[1].toLowerCase()], m[2].toLowerCase(), `${base}${p}`);
  }
}

// --- Originkit ---
{
  const base = 'https://www.originkit.dev';
  for (const u of await locs(`${base}/sitemap.xml`)) {
    const p = new URL(u).pathname.replace(/\/$/, '');
    const m = p.match(/^\/(components|sections)\/([a-z0-9-]+)$/i);
    if (m) {
      add('originkit', m[1].toLowerCase() === 'sections' ? 'section' : 'component', m[2].toLowerCase(), `${base}${p}`);
      continue;
    }
    const hub = p.match(/^\/sections\/category\/([a-z0-9-]+)$/i);
    if (hub) add('originkit', 'section-hub', `${hub[1].toLowerCase()}`, `${base}${p}`, ['section', 'hub', 'category']);
  }
}

// --- Open-source shadcn-style libraries (docs pages double as component pages) ---
const DOC_BLOCKLIST = new Set([
  'changelog', 'contributing', 'setup', 'installation', 'introduction', 'cli', 'mcp',
  'theming', 'styles', 'faq', 'pro', 'templates', 'agents', 'license', 'credits',
  'resources', 'blog', 'docs', 'llms', 'story', 'home', 'legacy',
])

async function docsSite({ site, sitemap, base, mode, fixedCategory }) {
  let urls = []
  try {
    urls = await locs(sitemap)
  } catch {
    console.warn(`skip ${site}: sitemap unavailable`)
    return
  }
  for (const u of urls) {
    const p = new URL(u).pathname.replace(/\/$/, '')
    let m
    let category
    if (mode === 'typed') {
      m = p.match(/^\/docs\/(components|templates)\/([a-z0-9-]+)$/i)
      if (!m) continue
      category = m[1].toLowerCase() === 'templates' ? 'template' : 'component'
      add(site, category, m[2].toLowerCase(), `${base}${p}`)
    } else if (mode === 'flat') {
      m = p.match(/^\/docs\/components\/([a-z0-9-]+)$/i)
      if (!m) continue
      add(site, fixedCategory, m[1].toLowerCase(), `${base}${p}`)
    } else {
      m = p.match(/^\/docs\/([a-z-]+)\/([a-z0-9-]+)$/i)
      if (!m) continue
      const cat = m[1].toLowerCase()
      if (DOC_BLOCKLIST.has(cat)) continue
      add(site, cat, m[2].toLowerCase(), `${base}${p}`)
    }
  }
}

await docsSite({
  site: 'magicui',
  sitemap: 'https://magicui.design/sitemap.xml',
  base: 'https://magicui.design',
  mode: 'typed',
})
await docsSite({
  site: 'kokonutui',
  sitemap: 'https://kokonutui.com/sitemap.xml',
  base: 'https://kokonutui.com',
  mode: 'categorized',
})
await docsSite({
  site: 'animata',
  sitemap: 'https://animata.design/sitemap.xml',
  base: 'https://animata.design',
  mode: 'categorized',
})
await docsSite({
  site: 'eldoraui',
  sitemap: 'https://eldoraui.site/sitemap.xml',
  base: 'https://www.eldoraui.site',
  mode: 'flat',
  fixedCategory: 'component',
})
await docsSite({
  site: 'cultui',
  sitemap: 'https://www.cult-ui.com/sitemap.xml',
  base: 'https://www.cult-ui.com',
  mode: 'flat',
  fixedCategory: 'component',
})

// --- Aura + MotionSites: no stable per-asset URLs, keep curated entry points ---
const manual = [
  ['motionsites', 'prompts', 'motion-prompts', 'https://motionsites.ai/', ['prompt', 'library', 'hero', 'landing', 'section', '500']],
  ['motionsites', 'prompts', 'animated-backgrounds', 'https://motionsites.ai/backgrounds', ['background', 'video', 'loop', 'animated']],
  ['motionsites', 'prompts', 'sections', 'https://motionsites.ai/sections', ['section', 'hero', 'pricing', 'footer']],
  ['motionsites', 'prompts', '3d-websites', 'https://motionsites.ai/3d-websites', ['3d', 'webgl', 'website']],
  ['motionsites', 'prompts', 'templates', 'https://motionsites.ai/templates', ['template', 'lovable', 'landing']],
  ['motionsites', 'tooling', 'mcp', 'https://motionsites.ai/mcp', ['mcp', 'agent', 'cursor', 'claude']],
  ['aura', 'builder', 'aura-create', 'https://www.aura.build/create', ['builder', 'generate', 'landing', 'html', 'figma', 'ai']],
  ['aura', 'components', 'aura-components', 'https://www.aura.build/components', ['component', 'html', 'tailwind', 'free']],
  ['aura', 'templates', 'aura-templates', 'https://www.aura.build/browse', ['template', 'landing', 'browse']],
  ['aura', 'components', 'aura-mobile', 'https://www.aura.build/browse/components/mobile', ['mobile', 'app', 'component']],
  ['aura', 'components', 'aura-animation', 'https://www.aura.build/browse/components/animation', ['animation', 'component']],
  ['aura', 'tooling', 'aura-mcp', 'https://www.aura.build/mcp', ['mcp', 'agent', 'design']],
  ['aura', 'builder', 'aura-design-md', 'https://www.aura.build/design-systems', ['design', 'system', 'tokens', 'design.md']],
];
for (const [site, category, slug, url, tags] of manual) {
  if (seen.has(url)) continue;
  seen.add(url);
  entries.push({ site, category, name: titleize(slug), slug, url, tags: [...new Set([...tags, category, site])] });
}

// --- Uiverse: element codenames are random, so index category + tag hubs ---
{
  const base = 'https://uiverse.io';
  const cats = [
    ['buttons', 'Buttons', ['button', 'cta', 'btn', 'click']],
    ['checkboxes', 'Checkboxes', ['checkbox', 'check', 'tick']],
    ['switches', 'Toggle Switches', ['switch', 'toggle', 'on-off']],
    ['cards', 'Cards', ['card', 'tile']],
    ['loaders', 'Loaders', ['loader', 'loading', 'spinner', 'waiting']],
    ['inputs', 'Inputs', ['input', 'field', 'textbox']],
    ['radio-buttons', 'Radio Buttons', ['radio', 'option', 'choice']],
    ['forms', 'Forms', ['form', 'login', 'signup', 'contact']],
    ['patterns', 'Patterns', ['pattern', 'texture', 'background']],
    ['tooltips', 'Tooltips', ['tooltip', 'hint', 'popover']],
  ];
  for (const [slug, name, extra] of cats) {
    const url = `${base}/${slug}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({
      site: 'uiverse',
      category: 'elements',
      name,
      slug,
      url,
      tags: [...new Set([...tokens(slug), ...extra, 'uiverse', 'element', 'css', 'tailwind', 'free', 'mit'])],
    });
  }

  const styleTags = [
    'glassmorphism',
    'neumorphism',
    'skeuomorphism',
    '3d',
    'neon',
    'retro',
    'gradient',
    'glow',
    'glossy',
    'futuristic',
    'material design',
    'flat',
    'realistic',
    'monochrome',
    'animated',
    'hover',
    'loading',
    'spinner',
    'toggle',
    'tooltip',
    'shadow',
  ];
  for (const t of styleTags) {
    const url = `${base}/tags/${encodeURIComponent(t)}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({
      site: 'uiverse',
      category: 'tag',
      name: `${titleize(t)} Elements`,
      slug: t.replace(/\s+/g, '-'),
      url,
      tags: [...new Set([...tokens(t), 'uiverse', 'tag', 'style', 'free', 'mit'])],
    });
  }
}

// Full Uiverse element index (built by build-uiverse.mjs from the galaxy repo).
// Kept as a separate file because it is regenerated on its own schedule.
const uiverseFile = path.join(ROOT, 'data', 'uiverse-elements.json')
if (fs.existsSync(uiverseFile)) {
  const { entries: elements } = JSON.parse(fs.readFileSync(uiverseFile, 'utf8'))
  for (const e of elements) {
    if (seen.has(e.url)) continue
    seen.add(e.url)
    entries.push(e)
  }
}

const order = ['uiverse', 'magicui', 'animata', 'cultui', 'kokonutui', 'eldoraui', 'aceternity', 'reactbits', 'originkit', 'motionsites', 'aura'];
entries.sort((a, b) => order.indexOf(a.site) - order.indexOf(b.site) || a.name.localeCompare(b.name));

const counts = {};
for (const e of entries) counts[e.site] = (counts[e.site] || 0) + 1;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify({ builtAt: new Date().toISOString(), counts, entries }, null, 1),
  'utf8'
);
console.log(`ok ${entries.length} entries -> ${OUT}`);
console.log(counts);
