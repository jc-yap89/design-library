#!/usr/bin/env node
// Static slop audit for HTML / CSS / JSX / TSX / Vue / Svelte text, plus a contrast helper.
// Usage:
//   node audit.mjs <file> [<file> ...]       counts and line numbers for common AI-look tells
//   node audit.mjs --contrast "#fff" "#6a58ee"   WCAG contrast ratio (text needs 4.5, non-text 3)
// Counts are evidence for the audit, not a verdict: render the page before judging.
import fs from 'node:fs'

const argv = process.argv.slice(2)

function lum(hex) {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

if (argv[0] === '--contrast') {
  if (argv.length !== 3) {
    console.error('usage: node audit.mjs --contrast <fg> <bg>   (hex colors)')
    process.exit(2)
  }
  const [a, b] = [lum(argv[1]), lum(argv[2])]
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  console.log(`${ratio.toFixed(2)}:1  text>=4.5 ${ratio >= 4.5 ? 'pass' : 'fail'}  non-text>=3 ${ratio >= 3 ? 'pass' : 'fail'}`)
  process.exit(0)
}

const files = argv.filter((a) => !a.startsWith('--'))
if (!files.length) {
  console.error('usage: node audit.mjs <file> [<file> ...]  |  --contrast <fg> <bg>')
  process.exit(2)
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}]/gu
const CHECKS = [
  ['emoji in markup', (line) => (line.match(EMOJI) || []).length],
  ['hue gradients', (line) => (line.match(/(?:linear|radial|conic)-gradient|\bbg-gradient-|\bfrom-[a-z]+-\d{3}|gradient-text/g) || []).length],
  ['glow / colored shadows', (line) => (line.match(/shadow-\[[^\]]*rgba\(\s*(?!0\s*,\s*0\s*,\s*0)[^\]]*\]|box-shadow:[^;]*rgba\(\s*(?!0\s*,\s*0\s*,\s*0)[^;]*|drop-shadow-\[/g) || []).length],
  ['transition-all', (line) => (line.match(/transition-all|transition:\s*all\b/g) || []).length],
  ['hover scale on cards/buttons', (line) => (line.match(/hover:scale-/g) || []).length],
  ['looping pulse / ping', (line) => (line.match(/animate-(?:pulse|ping|bounce)/g) || []).length],
  ['heavy weights (>=700)', (line) => (line.match(/font-(?:bold|extrabold|black)|font-weight:\s*[789]00/g) || []).length],
  ['wide-tracked labels', (line) => (line.match(/tracking-\[0?\.\d+em\]|tracking-(?:wide|wider|widest)|letter-spacing:\s*0?\.[1-9]\d*em/g) || []).length],
  ['uppercase text', (line) => (line.match(/\buppercase\b|text-transform:\s*uppercase/g) || []).length],
  ['ALL-CAPS literal labels', (line) => (line.match(/>\s*(?:[^\sA-Za-z<>]{1,3}\s*)?[A-Z]{3,}(?: [A-Z]{2,})*\s*</g) || []).length],
  ['exclamation in UI text', (line) => (line.replace(/<!--.*?-->|<!doctype[^>]*>/gi, '').match(/>[^<>]*[A-Za-z0-9%)][!]+/g) || []).length],
  ['hype / greeting copy', (line) => (line.match(/Welcome back|supercharge|seamless|unlock|revolutioniz|game-chang|10,000\+|Trusted by/gi) || []).length],
  ['off-grid spacing px (not multiple of 4)', (line) => (line.match(/\b(?:h|w|mt|mb|ml|mr|pl|pr|pt|pb|p|px|py|gap|top|left|right|bottom)-\[(\d+(?:\.\d+)?)px\]/g) || []).filter((m) => Number(m.match(/(\d+(?:\.\d+)?)px/)[1]) % 4 !== 0).length],
]
const PRESENCE = [
  ['focus-visible styles', /focus-visible|focus:ring|:focus\b|focus-within/],
  ['prefers-reduced-motion', /prefers-reduced-motion|motion-reduce|motion-safe/],
  ['semantic landmarks (nav/main/button)', /<nav\b|<main\b|<button\b|role="(?:navigation|main|button)"/],
  ['aria labels', /aria-(?:label|labelledby|current)/],
]

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split('\n')
  console.log(`\n== ${file} (${lines.length} lines)`)
  for (const [name, fn] of CHECKS) {
    let total = 0
    const where = []
    lines.forEach((line, i) => {
      const n = fn(line)
      if (n) {
        total += n
        if (where.length < 6) where.push(i + 1)
      }
    })
    console.log(`${String(total).padStart(4)}  ${name}${total ? `   lines ${where.join(', ')}${where.length === 6 ? ', ...' : ''}` : ''}`)
  }
  for (const [name, rx] of PRESENCE) console.log(`${rx.test(text) ? ' yes' : '  NO'}  ${name}`)
}
