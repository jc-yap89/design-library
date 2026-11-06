# Design preference memory

This workflow runs only when `design-library` is invoked. The agent reads and updates the file while doing the design task; there is no background chat monitor or separate service.

## Read and apply

At the start of a design task, read `~/.agents/state/design-library/preferences.json` if it exists. Use global entries and entries for the current project. If the file is absent, continue without preference memory and do not create it yet.

Resolve conflicts in this order: the current request and required project constraints, an applicable explicit project preference, an applicable explicit global preference, a relevant inferred preference as a light tilt, then a neutral default. “Project” and “global” here mean explicit entries; inferred entries never override a clear current direction or explicit preference. Apply a project entry only when its recorded target fits the current page, component, or output. Preserve limits such as “this time”, “this page”, or “this component” in the existing `preference` and `evidence.summary` fields, and do not extend them to unrelated screens or components. A project storage location alone does not make a preference apply to every screen. Preferences are not absolute bans; a task can still explore a new direction. If helpful, briefly explain which saved preference influenced a choice.

## Record feedback

When the user gives concrete, design-related feedback during a skill invocation, update the file without asking whether to save it. Create the parent folders and initialize from [`templates/preferences.json`](../templates/preferences.json) only when there is feedback worth keeping. If the feedback is only about the current project or version, keep it under that project. Language such as “这次圆角太大” is project-scoped; language such as “以后都少用动效” is a global preference.

Record only the smallest useful design summary. Each preference entry belongs in either `global_preferences` or `projects[project_key].preferences`. Store a project as `{ "preferences": [] }` under a short, stable key already available from the current project context; do not put unrelated or sensitive business details in the key. Each entry contains:

- `id`: a short unique identifier within that scope.
- `topic`: one design dimension, such as corner radius, motion, typography, color, density, or layout.
- `preference`: the current direction in a short phrase.
- `basis`: `explicit` or `inferred`.
- `confidence`: a number from `0` to `1`.
- `updated_at`: ISO 8601 timestamp with time zone.
- `evidence`: brief design-only summaries, each with `observed_at`, `basis`, and `summary`. Add `project_key` when evidence from a project supports a global inference.

Use `explicit` when the user directly states a preference. Do not treat silence, lack of objection, or the agent's own assessment as positive feedback. Choosing a version is only weak inferred evidence when the options differ on a clearly identifiable design dimension; record only that dimension, with low confidence (about `0.35`–`0.55`). Do not infer that the user likes every element in the selected version.

Keep a one-off comment project-scoped even when it is clear. A global preference can be recorded directly when the user says it applies broadly. A repeated pattern may become a global inferred preference only after at least three consistent observations across separate design tasks and at least two projects, with no newer contradiction. Mark it `inferred`, keep the short evidence summaries and relevant project keys, and use moderate confidence (no higher than `0.75`). Carry forward the shared target qualifiers in `preference`; several comments about one page or component can support a tilt for that kind of target, not unrelated pages or every element. Never search old chats to manufacture evidence; use only summaries already in this file and feedback from the current task.

When new feedback corrects an existing preference, update the value and timestamp and make the new feedback authoritative. Keep only the evidence needed to explain the current preference. A project-specific instruction does not rewrite the global preference.

## View, change, and forget

When asked to view preferences, read the current file and summarize the applicable entries, their scope, whether each is explicit or inferred, and confidence. When asked to change one, edit that entry and record the new concise evidence. Do not ask for confirmation before making these requested updates.

When asked to forget a preference, remove its value and supporting evidence. Add or update a minimal entry in `forget_markers` containing only `scope`, `topic`, optional `project_key`, and `forgotten_at`; `scope` is `global`, `project`, or `all`. This marker prevents pre-forget evidence still present elsewhere in the file from recreating the preference; it must not contain the forgotten value or its old evidence. Ignore evidence at or before the marker time. A new direct statement after that time can start a fresh preference; keep the marker so old evidence stays excluded. “Forget all” removes all preference entries and evidence, then uses `scope: "all"` and `topic: "*"` to exclude any pre-reset evidence.

## Privacy and writes

Store only short design summaries, not full chats, credentials, private business text, or unrelated personal details. The public skill package must contain only the empty template, never the user's private state. If writing fails, tell the user that the feedback was not persisted. In a multi-agent task, name one writer; that writer rereads the latest file, merges its change, and preserves other entries before saving.

The JSON shape is:

```json
{
  "schema_version": 1,
  "global_preferences": [],
  "projects": {},
  "forget_markers": []
}
```
