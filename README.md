# design-library

An Agent Skill for AI product experience and front-end component discovery. The GitHub-ready skill folder has `SKILL.md` at its root. The ZIP has a single top-level `design-library/` folder; extract it, then place that folder under your agent's skill directory. For Codex-style skills, use `.agents/skills/design-library`.

Run commands from the extracted skill directory:

```sh
node scripts/find.mjs "价格卡片 光晕" --limit 8
node scripts/find.mjs "torch" --site uiverse --json
node scripts/gallery.mjs "hero" --limit 12
```

Node.js 18 or later is recommended. Search and gallery use Node.js built-ins; no npm install is required.

The catalog contains 3,788 metadata entries. This package carries 1,462 configured remote preview URLs. It omits the 2,269 local screenshot cache files present in the canonical workspace; gallery uses configured remote preview URLs or local image files that exist, without checking remote availability first. Generated HTML embeds local image files when present and does not depend on the skill directory remaining in place.

Optional build and screenshot scripts are included for maintainers. They may need network access, Git, and browser tooling. Rebuilding screenshots with `shoot-uiverse.mjs` or `shoot-docs.mjs` requires a dedicated CDP browser at `127.0.0.1:9222`. Local generated preview images under `data/covers/` are intentionally excluded from this public package.

For a repository-based install, use your platform's Agent Skills installer against the repository after it is published; the repository root contains `SKILL.md`. ZIP installation is manual: extract `design-library/` into the agent's skill directory.
