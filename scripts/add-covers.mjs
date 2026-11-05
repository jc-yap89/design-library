#!/usr/bin/env node
// Attach a preview image to catalog entries that actually have one.
//
// Only three sites expose a usable still image today:
//   Originkit   -> cdn.originkit.dev/components/<slug>-poster.jpg   (pattern, real render)
//   React Bits  -> reactbits.dev/og/<path>.jpg                      (pattern, branded demo card)
//   Aceternity  -> og:image on the page, a real component screenshot (needs a fetch)
// Uiverse elements are live CSS with no still, and the newer shadcn sites only
// ship generated title cards, which do not help judge style. They are skipped.
//
// Usage: node add-covers.mjs [--site originkit,reactbits,aceternity] [--concurrency 6]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const CATALOG = path.join(ROOT, 'data', 'catalog.json')
const OUT = path.join(ROOT, 'data', 'covers.json')

const argOf = (n) => {
  const i = process.argv.indexOf(n)
  return i > -1 ? process.argv[i + 1] : undefined
}
const SITES = (argOf('--site') || 'originkit,reactbits,aceternity,animata').split(',')
const CONCURRENCY = Number(argOf('--concurrency') || 6)

const UA = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
}

const { entries } = JSON.parse(fs.readFileSync(CATALOG, 'utf8'))
const targets = entries.filter((e) => SITES.includes(e.site))
console.log(`${targets.length} entries across ${SITES.join(', ')}`)

async function head(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: UA })
    return res.ok
  } catch {
    return false
  }
}

async function ogImage(url) {
  try {
    const res = await fetch(url, { headers: UA })
    if (!res.ok) return null
    const html = await res.text()
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    return m ? m[1].replace(/&amp;/g, '&') : null
  } catch {
    return null
  }
}

async function coverFor(entry) {
  if (entry.site === 'originkit') {
    const base = 'https://cdn.originkit.dev/components'
    for (const suffix of ['-poster.jpg', '-gallery-poster.jpg', '-gallery.png']) {
      const url = `${base}/${entry.slug}${suffix}`
      if (await head(url)) return url
    }
    return null
  }
  if (entry.site === 'reactbits') {
    const p = new URL(entry.url).pathname.replace(/\/$/, '')
    const url = `https://reactbits.dev/og${p}.jpg`
    return (await head(url)) ? url : null
  }
  if (entry.site === 'aceternity' || entry.site === 'animata') {
    return ogImage(entry.url)
  }
  return null
}

const covers = {}
let done = 0
let found = 0

async function worker(queue) {
  while (queue.length) {
    const entry = queue.shift()
    try {
      const img = await coverFor(entry)
      if (img) {
        covers[entry.url] = img
        found++
      }
    } catch {
      // keep going; a missing cover is not an error
    }
    done++
    if (done % 100 === 0) console.log(`  ${done}/${targets.length} (${found} covers)`)
  }
}

const queue = [...targets]
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)))

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).covers || {} : {}
const merged = { ...previous, ...covers }
fs.writeFileSync(
  OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), count: Object.keys(merged).length, covers: merged }, null, 1),
  'utf8'
)
console.log(`ok ${found}/${targets.length} found this run, ${Object.keys(merged).length} total -> ${OUT}`)
