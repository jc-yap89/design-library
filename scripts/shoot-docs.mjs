#!/usr/bin/env node
// Screenshot the live preview pane of shadcn-style docs pages (Magic UI,
// Cult UI, Kokonut UI, Eldora UI) so these sites get real previews instead of
// their generated title cards.
//
// Usage: node shoot-docs.mjs [--workers 3] [--limit 20] [--force]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT_DIR = path.join(ROOT, 'data', 'covers', 'docs')
const COVERS = path.join(ROOT, 'data', 'covers.json')
const CDP = 'http://127.0.0.1:9222'
const SITES = ['magicui', 'cultui', 'kokonutui', 'eldoraui']

const argOf = (n) => {
  const i = process.argv.indexOf(n)
  return i > -1 ? process.argv[i + 1] : undefined
}
const WORKERS = Number(argOf('--workers') || 3)
const LIMIT = Number(argOf('--limit') || 0)
const FORCE = process.argv.includes('--force')

const { entries } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'))
fs.mkdirSync(OUT_DIR, { recursive: true })

const todo = []
const seen = new Set()
for (const e of entries) {
  if (!SITES.includes(e.site)) continue
  if (seen.has(e.url)) continue
  seen.add(e.url)
  const file = `${e.site}_${e.slug}.jpg`
  const dest = path.join(OUT_DIR, file)
  if (!FORCE && fs.existsSync(dest)) continue
  todo.push({ entry: e, dest, rel: `covers/docs/${file}` })
}
const slice = LIMIT ? todo.slice(0, LIMIT) : todo
console.log(`${slice.length} docs pages to shoot (${todo.length} pending, ${WORKERS} workers)`)

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
  await send('Runtime.enable')
  // 0.8 keeps the 1280px layout but writes ~550px-wide files.
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 0.8, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  return { send, close: async () => { ws.close(); await fetch(`${CDP}/json/close/${target.id}`) } }
}

const FIND_PREVIEW = `(() => {
  const els = [...document.querySelectorAll('[class*=preview],[class*=demo],[data-preview]')];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 320 && r.height > 180) {
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
    }
  }
  return null;
})()`

const results = {}
let done = 0
const started = Date.now()

async function worker(chunk) {
  const cdp = await connect()
  for (const job of chunk) {
    try {
      await cdp.send('Page.navigate', { url: job.entry.url })
      await new Promise((r) => setTimeout(r, 3600))
      const box = (await cdp.send('Runtime.evaluate', { expression: FIND_PREVIEW, returnByValue: true })).result.value
      const clip = box
        ? { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.w, 1100), height: Math.min(box.h, 1000), scale: 1 }
        : { x: 250, y: 380, width: 700, height: 470, scale: 1 }
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 70,
        captureBeyondViewport: true,
        clip,
      })
      fs.writeFileSync(job.dest, Buffer.from(shot.data, 'base64'))
      results[job.entry.url] = job.rel
    } catch (err) {
      console.error(`fail ${job.entry.url}: ${err.message}`)
    }
    done++
    if (done % 25 === 0) {
      const rate = (done / ((Date.now() - started) / 1000)).toFixed(2)
      console.log(`  ${done}/${slice.length}  ${rate}/s`)
    }
  }
  await cdp.close()
}

const chunks = Array.from({ length: WORKERS }, () => [])
slice.forEach((job, i) => chunks[i % WORKERS].push(job))
await Promise.all(chunks.map((c) => worker(c)))

const prev = fs.existsSync(COVERS) ? JSON.parse(fs.readFileSync(COVERS, 'utf8')).covers || {} : {}
const merged = { ...prev, ...results }
fs.writeFileSync(
  COVERS,
  JSON.stringify({ generatedAt: new Date().toISOString(), count: Object.keys(merged).length, covers: merged }, null, 1),
  'utf8'
)
console.log(`ok ${Object.keys(results).length} shot, ${Object.keys(merged).length} total covers`)
