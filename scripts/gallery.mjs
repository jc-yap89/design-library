#!/usr/bin/env node
// Visual contact sheet for a query: renders the top matches with their preview
// images so you can judge style before opening any page.
//
// Usage: node gallery.mjs "glass card" [--site uiverse] [--limit 24] [--no-fx] [--out file.html]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

const argv = process.argv.slice(2)
const argOf = (n) => {
  const i = argv.indexOf(n)
  return i > -1 ? argv[i + 1] : undefined
}
const has = (n) => argv.includes(n)
const limit = Number(argOf('--limit') || 24)
const site = argOf('--site')
const query = argv.filter((a, i) => !a.startsWith('--') && !['--limit', '--site', '--out'].includes(argv[i - 1])).join(' ').trim()

if (!query) {
  console.error('usage: node gallery.mjs "<query>" [--site <site>] [--limit N] [--no-fx]')
  process.exit(2)
}

// Pull a wider slice, then keep the previews: a covered entry ranked 30th is more
// useful on a visual sheet than an uncovered one ranked 5th.
const fetchLimit = Math.max(limit * 5, 60)
const args = [path.join(HERE, 'find.mjs'), query, '--limit', String(fetchLimit), '--json']
if (site) args.push('--site', site)
if (has('--no-fx')) args.push('--no-fx')
const raw = execFileSync(process.execPath, args, { encoding: 'utf8' })
const { results } = JSON.parse(raw)

const coversFile = path.join(ROOT, 'data', 'covers.json')
const rawCovers = fs.existsSync(coversFile) ? JSON.parse(fs.readFileSync(coversFile, 'utf8')).covers : {}

// Covers are remote URLs or paths relative to data/. Inline local files so the
// exported HTML remains usable after the skill directory moves or is removed.
const dataRoot = path.join(ROOT, 'data')
const toPreview = (asset) => {
  if (typeof asset !== 'string') return undefined
  if (/^https?:/i.test(asset)) return asset

  const file = path.resolve(dataRoot, asset)
  const relative = path.relative(dataRoot, file)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) || !fs.existsSync(file)) return undefined

  const mime = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' })[path.extname(file).toLowerCase()]
  if (!mime) return undefined
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`
}

const covers = new Map(results.map((result) => [result.url, toPreview(rawCovers[result.url])]))

// Cards with a preview come first: an empty tile tells you nothing about style.
// Then rotate by site, so the sheet compares sources instead of showing ten
// Animata cards in a row.
const ordered = [...results].sort((a, b) => (covers.get(b.url) ? 1 : 0) - (covers.get(a.url) ? 1 : 0))
const covered = ordered.filter((r) => covers.get(r.url))
const rest = ordered.filter((r) => !covers.get(r.url))

const bySite = new Map()
for (const r of covered) {
  if (!bySite.has(r.site)) bySite.set(r.site, [])
  bySite.get(r.site).push(r)
}
const shown = []
while (shown.length < limit && bySite.size) {
  for (const [site, list] of [...bySite]) {
    const item = list.shift()
    if (item) shown.push(item)
    if (!list.length) bySite.delete(site)
    if (shown.length >= limit) break
  }
}
if (shown.length < limit) shown.push(...rest.slice(0, limit - shown.length))

const withPreview = shown.filter((r) => covers.get(r.url)).length

const SITE_LABEL = {
  uiverse: 'Uiverse',
  magicui: 'Magic UI',
  animata: 'Animata',
  cultui: 'Cult UI',
  kokonutui: 'Kokonut UI',
  eldoraui: 'Eldora UI',
  aceternity: 'Aceternity',
  reactbits: 'React Bits',
  originkit: 'Originkit',
  motionsites: 'MotionSites',
  aura: 'Aura',
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const cards = shown
  .map((r) => {
    const img = covers.get(r.url)
    const media = img
      ? `<img src="${esc(img)}" alt="${esc(r.name)}" loading="lazy" onerror="this.parentNode.classList.add('noimg');this.remove()">`
      : ''
    return `<a class="card${img ? '' : ' noimg'}" href="${esc(r.url)}" target="_blank" rel="noreferrer">
      <div class="media">${media}</div>
      <div class="meta">
        <span class="site">${esc(SITE_LABEL[r.site] || r.site)}</span>
        <h3>${esc(r.name)}</h3>
        <span class="cat">${esc(r.category)}</span>${r.fx && r.fx.length ? `<span class="fx" title="名称或标签含装饰效果词，取用前对照去 AI 感判据">fx · ${esc(r.fx.join(', '))}</span>` : ''}
      </div>
    </a>`
  })
  .join('\n')

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(query)} — design library</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; background:#08080b; color:#e7e7ea; font:14px/1.5 ui-sans-serif,system-ui,"Segoe UI","Microsoft YaHei",sans-serif; }
  header { position:sticky; top:0; z-index:5; display:flex; align-items:baseline; gap:14px; padding:18px 28px; background:rgba(8,8,11,.82); backdrop-filter:blur(12px); border-bottom:1px solid #1b1b21; }
  header h1 { margin:0; font-size:16px; font-weight:600; letter-spacing:-.01em; }
  header .q { color:#8b8b96; font-size:13px; }
  header .n { margin-left:auto; color:#6b6b76; font-size:12px; }
  main { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; padding:22px 28px 60px; }
  .card { display:flex; flex-direction:column; border:1px solid #1d1d24; border-radius:14px; overflow:hidden; background:#0d0d12; text-decoration:none; color:inherit; transition:.18s ease; }
  .card:hover { border-color:#3a3a48; transform:translateY(-2px); }
  .media { aspect-ratio:16/10; background:linear-gradient(135deg,#171722,#0e0e14); overflow:hidden; }
  .media img { width:100%; height:100%; object-fit:contain; display:block; background:#0d0d12; }
  .noimg .media { display:grid; place-items:center; }
  .noimg .media::after { content:"no preview"; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#4a4a58; }
  .meta { padding:11px 13px 13px; display:flex; flex-direction:column; gap:3px; }
  .site { font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#7c7c8a; }
  h3 { margin:0; font-size:14px; font-weight:500; letter-spacing:-.01em; color:#f2f2f5; }
  .cat { font-size:11px; color:#5f5f6c; }
  .fx { font-size:11px; color:#b08a3e; }
</style></head>
<body>
<header><h1>design library</h1><span class="q">${esc(query)}</span><span class="n">${shown.length} 个候选 · ${withPreview} 个有预览</span></header>
<main>${cards}</main>
</body></html>`

const out = argOf('--out') || path.join(os.tmpdir(), 'design-gallery', `${query.replace(/[^\w\u4e00-\u9fa5]+/g, '-')}.html`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, html, 'utf8')
console.log(`${shown.length} shown (${withPreview} with preview) -> ${out}`)
