---
schema_version: 1
kind: "pipeline-index"
protocol_status: "design-only"
parallel_writes_enabled: false
repository: "patelcp/cp-demo-se6"
codebase_base: "xmcloud-starter-js"
customer_app_parent: "industry-verticals"
source_app: "industry-verticals/prospera"
agents: ["Cursor", "Codex", "Grokbot"]
coordination:
  mode: "single-host-linked-worktrees"
  coordinator_checkout: null
  runtime_location: "<absolute-git-common-dir>/ai-coordination"
  board_root: "<coordinator-checkout>/.github/ai-boards"
  authoritative_locator: "<runtime_location>/config.json"
  writer: "coordinator-only"
  lock_backend: "atomic-directory-create"
  lock_implementation: null
  owner_identity: ["agent", "session_uuid", "host", "pid", "process_start", "worktree"]
  heartbeat_seconds: 30
  stale_after_seconds: 180
  automatic_takeover: false
  max_writers_per_customer: 1
  acquire_resources_in_sorted_order: true
  board_update: "expected-revision-and-temp-file-rename-under-lock"
git:
  feature_base: "latest-main"
  pull_request_target: "dmz"
  merge_method: "squash"
policy:
  unknown_customer: "deny"
  unresolved_target_identity: "deny-mutations"
  missing_coordinator: "read-only"
  unrelated_dirty_files: "preserve"
  source_app_mutation: "deny"
  local_env_file_mutation: "deny"
  cross_customer_imports: "deny"
  global_changes: "separate-integration-task"
shared_resources:
  - { key: "repo:xmcloud.build.json", access: "integration-only" }
  - { key: "repo:skinning-harness", access: "integration-only" }
  - { key: "sitecore:shared-schema", access: "read-only-unless-explicitly-assigned" }
  - { key: "sitecore:shared-designs", access: "read-only-unless-explicitly-assigned" }
  - { key: "repo:serialization-config", access: "integration-only" }
context:
  suggested_hot_board_max_lines: 200
  read_scope: "policy,selected-board,active-task,referenced-checkpoint"
  archive_scope: "per-customer"
---

# Customer demo pipeline

This is launch configuration and a human-readable index, not an implemented lock service.
Keep `parallel_writes_enabled: false` until the coordinator and enforcement adapters
pass the acceptance checks in [the integration plan](prospera-integration-plan.md).
An agent name in a Markdown file never grants write access.

## Tracks

| Track | Board | App root | Sitecore environment/site | Pipeline status | Last verified checkpoint |
| --- | --- | --- | --- | --- | --- |
| No customer registered | — | — | — | unconfigured | — |

Registration: copy [the template](demo-brand.template.md) to
`demo-brand-<customer-slug>.md`, replace every placeholder, verify scopes, and add
one row here. Retail and health are examples, not existing provisioned sites.
Use a customer slug, not just its industry, to distinguish two healthcare customers.

The coordinator alone maintains this index. Agents do not edit its status rows
after every task. Regenerate them from authoritative customer boards at checkpoints.

## State ownership

| State | Authority |
| --- | --- |
| Live ownership and resource claims | Untracked coordinator runtime under the common Git directory |
| Customer identity, task status, scope, handoff | Canonical customer board in the coordinator checkout |
| Setup step results and created IDs | Customer's existing `setup-progress.yaml` in its assigned worktree |
| Build phases, sections and image results | Customer app's existing `demo-progress.yaml` and content/image maps |
| Item contracts and validated GUIDs | Customer app's `sitecore-manifest.yaml`, qualified by environment |
| Cross-customer overview | This derived index |

The runtime locator contains the canonical board root and policy checksum. Every
agent must resolve the same locator. Boards in other worktrees are snapshots;
they cannot be used to acquire ownership. Independent clones, remote computers,
network shares and cloud-synced directories are outside this locking design.

## Scheduling and failure rules

- Use a distinct feature branch and worktree for every concurrent customer writer.
  A second agent on the same customer can perform read-only analysis or wait.
- Claims include customer, application, Sitecore environment/site, assigned schema
  roots, serialization roots, and any shared resources. Customer locks alone do
  not protect shared templates, tenant configuration or global build files.
- Acquire the full known resource set in sorted order. If another resource is
  needed, checkpoint and reacquire the complete set; do not improvise nested locks.
- An expired heartbeat is a recovery signal, not permission to steal a lock.
  Confirm the old process and child workers are stopped, reconcile external jobs,
  and only then permit a replacement owner. Never delete a live owner's lock.
- Record mutation intent before remote operations, then record returned item/job
  IDs and read-back evidence. An unknown outcome must be reconciled before retry.
- A crash may leave `active_agent` populated. Runtime ownership and recovery
  determine whether another agent may proceed; editing that value cannot unlock it.
- At handoff, stop or transfer owned watchers/servers, checkpoint progress, report
  dirty files, clear the display owner, and release only this session's claims.
  Do not commit or stash someone else's work.

## Launch checklist

- [ ] Canonical coordinator checkout and runtime locator configured.
- [ ] Atomic claim, owner validation, heartbeat, recovery and revision checks implemented.
- [ ] Filesystem and MCP write paths enforce the same scope and ownership checks.
- [ ] Cursor, Codex and Grokbot each load the protocol through a tested entry point.
- [ ] Customer boards and manifests verified against their actual target environments.
- [ ] Resource conflict, crash and brand-isolation acceptance checks pass.
- [ ] Coordinator switches `protocol_status` to `active` and enables parallel writes.
