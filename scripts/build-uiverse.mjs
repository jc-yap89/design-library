#!/usr/bin/env node
// Build the full Uiverse element index from the official galaxy repo.
// uiverse.io itself returns 403 to non-browser clients; the repo has the same
// elements as self-contained HTML files with tags in a first-line comment.
//
// Usage: node build-uiverse.mjs [--repo <dir>] [--out data/uiverse-elements.json]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const argOf = (name) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}
const REPO = argOf('--repo') || path.join(os.tmpdir(), 'galaxy')
const OUT = argOf('--out') || path.join(ROOT, 'data', 'uiverse-elements.json')

if (!fs.existsSync(path.join(REPO, 'README.md'))) {
  console.log('cloning uiverse-io/galaxy ...')
  execFileSync('git', ['clone', '--depth', '1', '--quiet', 'https://github.com/uiverse-io/galaxy.git', REPO], {
    stdio: 'inherit',
  })
}

const CATS = {
  Buttons: 'Button',
  Cards: 'Card',
  Checkboxes: 'Checkbox',
  Forms: 'Form',
  Inputs: 'Input',
  Notifications: 'Notification',
  Patterns: 'Pattern',
  'Radio-buttons': 'Radio',
  'Toggle-switches': 'Switch',
  Tooltips: 'Tooltip',
  loaders: 'Loader',
}

// A tag is useless for search when every word in it only describes the category
// or is pure filler. "1,200 loaders tagged loader" would drown every other result,
// and the category hubs already cover those queries.
const FILLER = new Set(
  (
    'button buttons btn card cards loader loading switch checkbox radio input form tooltip ' +
    'pattern notification alert ui css html tailwind tailwindcss animated animation animate ' +
    'hover click effect effects modern minimal minimalist minimalistic simple clean cool awesome ' +
    'nice neat beautiful elegant dark light rounded round square rectangular rectangle shadow ' +
    'box-shadow border bordered outline outlined center centered horizontal vertical compact ' +
    'small large big basic easy interface control action active option item lines bar dot dots ' +
    'circle circular circles smooth smoothly transition custom creative style design bright ' +
    'color colorful colorful transparent space text title label placeholder content background ' +
    'icon icons svg image images media symbol geometric abstract web website app component ' +
    'template templates free css3 html5 hoverme hover-effect interactive cool-checkbox'
  ).split(/\s+/)
)

function cleanTags(raw) {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, ' '))
    .filter(Boolean)
}

function isFiller(tag) {
  const words = tag.split(' ').filter(Boolean)
  if (!words.length) return true
  return words.every((w) => FILLER.has(w) || w.length < 2)
}

function titleize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

const entries = []
const seen = new Set()
let dropped = 0

for (const [dir, singular] of Object.entries(CATS)) {
  const full = path.join(REPO, dir)
  if (!fs.existsSync(full)) continue
  for (const file of fs.readdirSync(full)) {
    if (!file.endsWith('.html')) continue
    const base = file.slice(0, -5)
    const sep = base.indexOf('_')
    if (sep < 1) continue
    const author = base.slice(0, sep)
    const slug = base.slice(sep + 1)
    const url = `https://uiverse.io/${author}/${slug}`
    if (seen.has(url)) continue

    let txt = ''
    try {
      txt = fs.readFileSync(path.join(full, file), 'utf8')
    } catch {
      continue
    }
    const m = txt.match(/From Uiverse\.io by\s+.+?\s*-\s*Tags:\s*([^*]*?)\s*\*\//i)
    const raw = m ? cleanTags(m[1]) : []
    const distinctive = [...new Set(raw.filter((t) => !isFiller(t)))]

    // No distinctive tag means the element can only be found by browsing the
    // category page, so leave it out instead of padding the index with noise.
    if (!distinctive.length) {
      dropped++
      continue
    }

    seen.add(url)
    const primary = titleize(distinctive[0])
    const name = primary.toLowerCase().endsWith(singular.toLowerCase()) ? primary : `${primary} ${singular}`
    entries.push({
      site: 'uiverse',
      category: dir.toLowerCase(),
      name,
      slug,
      url,
      tags: [...new Set([...distinctive, singular.toLowerCase(), dir.toLowerCase(), 'uiverse'])],
    })
  }
}

entries.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(
  OUT,
  JSON.stringify({ builtAt: new Date().toISOString(), count: entries.length, dropped, entries }, null, 1),
  'utf8'
)
console.log(`ok ${entries.length} elements (${dropped} skipped: no distinctive tag) -> ${OUT}`)
