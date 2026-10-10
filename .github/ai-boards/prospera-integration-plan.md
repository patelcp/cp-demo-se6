# Prospera integration plan

Status: proposed integration; no existing skill or application file has been modified.
The coordinator operations below are required interfaces, not commands installed by
this boilerplate. The launch configuration deliberately disables parallel writes.

## 1. Use the actual entry point

The local harness and the inspected upstream Prospera tree use
`.cursor/skills/skinned-demo-setup/SKILL.md`, not `skill.json` plus `instructions.md`.
The local skill and both existing applications' build skills have pre-existing edits.
Review and preserve them when implementing this plan.

Create `.cursor/skills/skinned-demo-setup/instructions.md` as the coordination
addendum below. In `SKILL.md`, insert this directly before `## Progress file (source
of truth)` so it also governs resume and setup progress writes:

```markdown
## Customer coordination preflight

Before setup, resume, progress-file creation, local writes, or Sitecore mutations,
read and follow [the coordination addendum](instructions.md). Resolve the selected
customer, canonical board, session claim and mutation scope first. If coordination
cannot be established, limit work to read-only discovery and planning.
```

Do not replace the skill with a newly invented manifest format. Preserve its inputs,
story, references, data policy, cloning limitations and existing approval semantics.

## 2. Implement the coordinator before enabling the instruction

One local supervisor serves all three agents and linked worktrees. It provides:

| Operation | Required behavior |
| --- | --- |
| Register | Validate unique customer slug, branch, paths, Sitecore scopes and ports; detect overlapping resources; publish the canonical board location. |
| Claim | Atomically create a claim directory for each resource, with one successful owner; unwind only newly acquired claims if any resource is busy. |
| Assert | Verify session UUID, process identity, assigned worktree, allowed path or Sitecore item ancestry, and live ownership. |
| Heartbeat | Supervisor refreshes only its matching session; stalled sessions become suspect, never automatically reassignable. |
| Checkpoint | Validate task IDs and expected board revision; write via temporary file plus atomic rename under ownership; increment revision. |
| Release | Verify owner token; finish checkpoint; stop/transfer child workers; release only claims owned by that session. |
| Recover | Verify old supervisor/workers stopped; reconcile in-flight remote jobs and partial board/progress writes; then release/reassign. |

Use the absolute common Git directory for untracked runtime state. Do not use the
per-worktree `.git` path, which may be a file. Store a canonical board-root locator
there. A coordinator failure or missing owner record is a blocked claim, not a free
resource. Heartbeats belong to a running supervisor, not periodic LLM replies.

Atomic creation must have exclusive semantics; checking existence then creating,
or using an operation that succeeds when the directory exists, is insufficient.
Canonicalize filesystem paths, reject traversal/symlink escapes and overlapping
writable roots. Resource keys must map to real shared identities: e.g. an
environment-qualified Sitecore schema root, not only a customer label. Overlapping
ancestor/descendant Sitecore roots must conflict as well as identical paths.

For hard enforcement, route shell/file mutations through restricted workspaces and
route MCP writes through a scope-checking adapter with exclusive credentials or
equivalent access controls. Prompt rules alone cannot prevent a bypass. Sitecore
does not automatically honor a local lock token. If a remote worker can outlive its
local session, reconcile it before reassignment; an unused fencing counter is not
protection. For separate machines/clones, replace this backend with a central
transactional coordinator and enforce ownership at the mutation gateway.

## 3. Register a customer without changing existing workflow authority

After customer identity is available, register the board before the existing
`Inputs` section creates `setup-progress.yaml`. During read-only discovery, collect
target IDs and resolve paths. For a brand-new site, claim the environment-qualified
collection/name reservation before create, journal the intent, and attach the
returned site ID afterward. Missing new-site IDs do not permit arbitrary writes.

Add this optional block to `setup-progress.template.yaml` and the build progress
template, preserving every current field:

```yaml
coordination:
  trackId: ""
  boardPath: ""
  taskId: ""
  sessionId: null
  checkpointRevision: null
```

Session IDs here are historical context, not renewable credentials or lock grants.
The board owns task status and target scope; setup/build YAML own phase results.
Disagreement triggers reconciliation against actual artifacts and live Sitecore
state, not automatic reset of either file. Record paths with their worktree/checkpoint
reference so the next agent can find uncommitted as well as committed artifacts.

## 4. Add gates at these exact workflow boundaries

| Existing anchor | Incremental change |
| --- | --- |
| `Resume a skinned demo setup` | Resolve the explicitly selected board first; claim and inspect the saved worktree, dirty files and jobs before loading progress or re-authenticating for writes. |
| `Inputs` / initial progress creation | Register and claim before writing the customer progress file. Reuse already-approved story, references, pages and data policy. |
| `Collection and source selection` | Bind organization/environment/collection/site identity to the board; reserve creation targets; validate source as read-only. |
| `Step 1a` | Assert scoped ownership before create/copy/rename; record mutation intent then job handle; read back target collection and site. Keep current cross-collection clone restriction. |
| `Step 1b — Local codebase folder` | Copy reviewed source code/assets with exclusions; preserve target files on resume; rebase customer-specific configuration before any manifest repair or content write. |
| `Step 1c` | Follow repository prohibition on agent edits to `.env.local`; use operator-provisioned configuration or an approved launcher. Queue the rendering-host patch as a separately scoped `xmcloud.build.json` integration task. |
| `Step 1d` | Bind editing host to the recorded authoring environment and rendering-host key; scope variable operations to that host and keep secrets out of logs. |
| `Step 1 verification` | Compare board, progress, project config, manifest and live site identity; fail on disagreement. |
| `Step 2 — Invoke sitecore-build-demo` | Pass board/session/task plus app/content/schema/asset scope to the customer copy. Preserve the claim for a same-process handoff; otherwise checkpoint, release, and make the next process acquire its own claim. |
| All stop/error/exit paths | Persist known outcomes and unresolved operations; stop owned workers and release through the coordinator. Crash recovery is separate from normal exit. |

Exclude `node_modules`, `.next`, `.sitecore`, `.cache`, `.git`, local credentials,
`.env.local`/`.env.*.local`, previous customer demos/themes/downloads and captured
browser state from source copying. Retain legitimate source configuration and
reviewed base assets. Do not blindly delete everything with a brand name: manifests
may intentionally reference read-only base components.

The current source project/manifest names `main/main-website` and
`fmc-custom-demo`, while serialized Prospera items use `financial`. Resolve this
against the target tenant; do not perform blind string replacement of GUIDs.

## 5. Protect the downstream skinning loop

In each customer's `docs/ai/skills/sitecore-build-demo.md`:

1. Add the board and coordination addendum to `Load first`. For direct invocation
   and resume, require the same claim gate as setup; do not rely on Step 2 being
   the only entry point.
2. Before Phase 0.5 manifest validation or auto-repair, confirm project identities,
   environment and each relevant root. An item existing is insufficient; verify
   its path, template and ownership. Cache verified IDs only within that scope.
3. Replace the unconditional dedicated-environment assumption with the board's
   actual isolation mode. In a shared environment, keep inherited schema read-only
   and create customer extensions under separately assigned template/rendering roots.
4. Scope scraper/download output, theme files, image maps and Content Hub assets to
   the customer. Record checksums and provenance; do not fall back to another demo.
5. Assert ownership before each mutation batch and each retry. Journal remote intent
   before calls; persist IDs as soon as returned, even if prose checkpointing remains
   batched. Reconcile a timed-out create rather than blindly create again.
6. Resolve the actual stylesheet entry (`src/app/globals.scss` in local Prospera),
   site-theme map and CSS specificity. Do not assume `globals.css` exists or that
   an unlayered `:root` always beats a more-specific inherited theme selector.
7. Preserve existing explicit approvals for theme/page plans. This addendum adds
   coordination, not a second approval request for already-authorized work.
8. Require evidence for datasource wiring, rendering UID/variant/parameters, editing
   behavior and desktop/mobile results. A successful MCP return or build alone is
   insufficient to mark the demo finished.

## 6. Ready-to-paste coordination addendum

Use this text as the new `instructions.md` after implementing the coordinator:

```markdown
# Customer coordination

Read the repository's .github/ai-boards/master-backlog.md and resolve its canonical
coordinator locator. Load only the selected customer board and active task.
If the protocol is disabled, the coordinator is absent, or target scope is unknown,
perform read-only planning and report the missing prerequisite.

Before any local or remote mutation, obtain a session claim for the customer and
affected shared resources. Check the assigned worktree, branch, customer app,
Sitecore organization/environment/collection/site, schema roots and asset scope.
The board's active_agent is informational; only live coordinator ownership permits
writes. Recheck ownership and target identity before each mutation batch and retry.

Keep setup-progress.yaml and the customer's demo-progress.yaml as phase records.
Keep task identity, acceptance, target scope and latest handoff on the board.
Do not duplicate the full phase checklist or raw tool output into Markdown.

Do not mutate source Prospera, other customer apps/content, shared schema/designs
or global configuration without a separately assigned resource scope. Follow the
repository's environment-file rules. Copy no credentials, caches or previous demo
state. Rebase copied project/manifest/theme settings before auto-repair or skinning.

Write remote mutation intent before calling a tool, save returned IDs/job handles,
and read back the result. Reconcile uncertain outcomes before repeating operations.
Documentation MCP is reference material; discover actual authoring tool capability
and verify the authenticated environment independently.

Checkpoint after meaningful work and before handoff: exact next file/item/action,
evidence, unresolved jobs, dirty files and workers. Update the canonical board using
its expected revision. Same-session setup/build handoffs retain ownership; a new
agent must acquire its own claim. Stop owned workers and release only your claims
on normal exit. Never infer that an expired heartbeat permits lock removal.
```

## 7. Install each agent's entry point and validate

Append [the supplied injection](cursorrules-injection.txt) to `.cursorrules` only if
that is an active entry point for the installed Cursor client. Otherwise put the
same policy in the supported project-rule mechanism and confirm it is loaded.
Add a concise pointer to the shared protocol in Codex's applicable `AGENTS.md` and
Grokbot's actual configured startup instructions. Do not assume either reads
`.cursorrules`; Grokbot's loader has not been inspected in this review.

Required acceptance tests before launch:

- Two simultaneous claims for one customer yield exactly one owner; different
  customers can proceed concurrently when their resource sets do not overlap.
- Same app, shared template ancestor, global build file and shared collection
  operations conflict even when board names differ.
- A stale revision or duplicate task ID is rejected; two worktrees resolve the
  same canonical board; a copied independent clone fails the coordination check.
- Forced termination leaves a recoverable claim; missing/expired heartbeat does
  not unlock it; old workers cannot continue after reassignment.
- Wrong environment/site, path traversal, symlink escape and unassigned schema
  changes are rejected before mutation. Direct unguarded MCP access is restricted.
- Remote create timeout is reconciled without a duplicate item; copied stale IDs
  cannot redirect auto-repair into the source site.
- Same route and locale on two customers show different expected logos, dictionary
  phrases, datasource IDs and theme values. Repeat after client navigation and in
  Sitecore Pages; verify search/analytics identifiers separately.
- Task handoff preserves dirty changes, progress evidence and exact next action.

Only after these pass should the master configuration enable parallel writes.
