# design-library

An Agent Skill for AI product experience and front-end component discovery. The GitHub-ready skill folder has `SKILL.md` at its root. The ZIP has a single top-level `design-library/` folder; extract it, then place that folder under your agent's skill directory. For Codex-style skills, use `.agents/skills/design-library`.

## Install from GitHub with Codex

Requires Node.js 22.20 or later and npm/npx available in your PATH.

```bash
npx -y skills add jc-yap89/design-library --skill design-library --global --agent codex --yes
```

The command runs the Skills CLI through `npx`. `--agent codex` targets Codex, and `--global` installs the skill for the current user at `~/.agents/skills/design-library`, making it available across projects instead of adding it to one project's repository. `--yes` skips confirmation prompts.

## Use the scripts

Run commands from the extracted skill directory:

```sh
node scripts/find.mjs "价格卡片 光晕" --limit 8
node scripts/find.mjs "torch" --site uiverse --json
node scripts/gallery.mjs "hero" --limit 12
node scripts/find.mjs "card" --no-fx   # hide entries tagged glow/gradient/neon/glass...
```

Node.js 18 or later is recommended for the skill scripts. Search and gallery use Node.js built-ins; no npm install is required.

The catalog contains 3,788 metadata entries. This package carries 1,462 configured remote preview URLs. It omits the 2,269 local screenshot cache files present in the canonical workspace; gallery uses configured remote preview URLs or local image files that exist, without checking remote availability first. Generated HTML embeds local image files when present and does not depend on the skill directory remaining in place.

On design tasks, map each applicable explicit preference to a few task-specific choices and observable checks before implementation, then verify the rendered or working result. Preserve its strength and scope, keep subjective style separate from hard requirements, and verify ordinary and reduced motion independently; see `references/preference-memory.md`. The package includes only an empty JSON template; when the skill is invoked and receives concrete design feedback, the agent may create the private per-user file at `~/.agents/state/design-library/preferences.json`. The private state stays outside this package.

`references/ui-anti-slop.md` is a condensed Chinese adaptation of [heydamir/unslop](https://github.com/heydamir/unslop) (CC BY 4.0, by Damir Sokolovsky): a checklist of "AI-generated look" tells with fixes, used to screen components pulled from the catalog and to check the result before delivery. It does not set style direction; that stays with the other design skills. See `THIRD_PARTY_NOTICES.md` for attribution.

The skill acts as a resident UI/UX designer: audit, record, optimize, reuse (`references/resident-designer.md`). It keeps project notes in `.design-library/` (a UI backlog and a snippet library) created on first use. An optional hook, `scripts/resident-hook.mjs` with the settings in `templates/hooks.settings.json` (Claude Code format), reminds the agent on session start and on UI-related prompts; it is read-only and fails silently.

Optional build and screenshot scripts are included for maintainers. They may need network access, Git, and browser tooling. Rebuilding screenshots with `shoot-uiverse.mjs` or `shoot-docs.mjs` requires a dedicated CDP browser at `127.0.0.1:9222`. Local generated preview images under `data/covers/` are intentionally excluded from this public package.

ZIP installation is manual: extract `design-library/` into the agent's skill directory.
