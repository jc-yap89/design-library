// Flags catalog entries whose name or tags suggest decoration-heavy effects
// (gradients, glow, neon, glass, ...). A hint to look twice, not a quality
// judgement: see references/ui-anti-slop.md, section 3.
const FX = /\b(glow|glowing|gradient|aurora|neon|glass|glassmorphism|shine|shiny|sparkle|sparkles|holographic|hologram|blob|nebula|shimmer|pulse|pulsing|pulsating|glare|liquid|chrome|orb|spotlight|beam|meteor|meteors|rainbow)\b/gi

export function fxWords(entry) {
  const text = [entry.name, ...(entry.tags || [])].join(' ')
  return [...new Set((text.match(FX) || []).map((w) => w.toLowerCase()))]
}
