#!/usr/bin/env node
// Render every Uiverse element locally and store a JPEG preview.
//
// uiverse.io blocks automations, but the galaxy repo ships each element as a
// self-contained HTML + <style>. So we render those files in headless Edge:
// no site access, no Cloudflare, and dozens per second.
//
// Usage: node shoot-uiverse.mjs [--workers 3] [--limit 50] [--force]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const REPO = path.join(os.tmpdir(), 'galaxy')
const OUT_DIR = path.join(ROOT, 'data', 'covers', 'uiverse')
const COVERS = path.join(ROOT, 'data', 'covers.json')
const CDP = 'http://127.0.0.1:9222'

const argOf = (n) => {
  const i = process.argv.indexOf(n)
  return i > -1 ? process.argv[i + 1] : undefined
}
const WORKERS = Number(argOf('--workers') || 4)
const LIMIT = Number(argOf('--limit') || 0)
const FORCE = process.argv.includes('--force')

const DIRS = {
  buttons: 'Buttons',
  cards: 'Cards',
  checkboxes: 'Checkboxes',
  forms: 'Forms',
  inputs: 'Inputs',
  notifications: 'Notifications',
  patterns: 'Patterns',
  'radio-buttons': 'Radio-buttons',
  'toggle-switches': 'Toggle-switches',
  tooltips: 'Tooltips',
  loaders: 'loaders',
}

const W = 480
const H = 300
const PAD = 22

const { entries } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'uiverse-elements.json'), 'utf8'))
fs.mkdirSync(OUT_DIR, { recursive: true })

// Elements pick their own palette: white-text buttons vanish on cream, dark
// buttons vanish on near-black. Guess the page tone from text/shape colours.
function pickBg(css) {
  let light = 0
  let dark = 0
  for (const m of css.matchAll(/(?<!-)color:\s*([^;}]+)/gi)) {
    const c = m[1].toLowerCase()
    if (/(#fff|#ffffff|white|255,\s*255,\s*255)/.test(c)) light++
    else if (/(#000|#000000|black|0,\s*0,\s*0)/.test(c)) dark++
  }
  for (const m of css.matchAll(/fill=["']([^"']+)/gi)) {
    const c = m[1].toLowerCase()
    if (/(#fff|white)/.test(c)) light++
    else if (/(#000|black)/.test(c)) dark++
  }
  return light > dark ? '#0b0b0f' : '#f3f1ec'
}

function wrapper(html, bg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;overflow:hidden}
  body{display:grid;place-items:center;background:${bg};font-family:system-ui,sans-serif}
  .stage{display:grid;place-items:center;padding:${PAD}px;transform-origin:center}
  </style></head><body><div class="stage">${html}</div></body></html>`
}

const todo = []
for (const e of entries) {
  const author = e.url.split('/')[3]
  const src = path.join(REPO, DIRS[e.category] || e.category, `${author}_${e.slug}.html`)
  const file = `${author}_${e.slug}.jpg`
  const dest = path.join(OUT_DIR, file)
  if (!fs.existsSync(src)) continue
  if (!FORCE && fs.existsSync(dest)) continue
  todo.push({ entry: e, src, dest, rel: `covers/uiverse/${file}` })
}
const slice = LIMIT ? todo.slice(0, LIMIT) : todo
console.log(`${slice.length} to render (${todo.length} pending, ${WORKERS} workers)`)

async function connect() {
  const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
    }
  })
  await new Promise((r) => ws.addEventListener('open', r))
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      pending.set(mid, { resolve, reject })
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
  return { send, ws, target, close: async () => { ws.close(); await fetch(`${CDP}/json/close/${target.id}`) } }
}

const results = {}
let done = 0
const started = Date.now()

async function worker(chunk, index) {
  const cdp = await connect()
  const tmp = path.join(os.tmpdir(), `uiv-render-${index}.html`)
  for (const job of chunk) {
    try {
      const raw = fs.readFileSync(job.src, 'utf8')
      const bg = pickBg(raw)
      fs.writeFileSync(tmp, wrapper(raw, bg), 'utf8')
      await cdp.send('Page.navigate', { url: `file:///${tmp.replace(/\\/g, '/')}` })
      await new Promise((r) => setTimeout(r, 150))
      await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('.stage > *');
          if (!el) return;
          const r = el.getBoundingClientRect();
          const fit = Math.min((${W} - ${PAD * 2}) / Math.max(r.width, 1), (${H} - ${PAD * 2}) / Math.max(r.height, 1));
          const s = Math.min(2.5, fit);
          document.querySelector('.stage').style.transform = 'scale(' + s + ')';
        })()`,
      })
      await new Promise((r) => setTimeout(r, 60))
      const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
      fs.writeFileSync(job.dest, Buffer.from(shot.data, 'base64'))
      results[job.entry.url] = job.rel
    } catch (err) {
      console.error(`fail ${job.entry.url}: ${err.message}`)
    }
    done++
    if (done % 100 === 0) {
      const rate = (done / ((Date.now() - started) / 1000)).toFixed(1)
      console.log(`  ${done}/${slice.length}  ${rate}/s`)
    }
  }
  await cdp.close()
}

const chunks = Array.from({ length: WORKERS }, () => [])
slice.forEach((job, i) => chunks[i % WORKERS].push(job))
await Promise.all(chunks.map((c, i) => worker(c, i)))

const prev = fs.existsSync(COVERS) ? JSON.parse(fs.readFileSync(COVERS, 'utf8')).covers || {} : {}
const merged = { ...prev, ...results }
fs.writeFileSync(
  COVERS,
  JSON.stringify({ generatedAt: new Date().toISOString(), count: Object.keys(merged).length, covers: merged }, null, 1),
  'utf8'
)
console.log(`ok ${Object.keys(results).length} rendered, ${Object.keys(merged).length} total covers`)
