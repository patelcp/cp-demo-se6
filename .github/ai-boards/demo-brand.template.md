---
schema_version: 1
kind: "customer-template"
track_id: "<customer-slug>"
customer_name: "<Customer Name>"
customer_vertical: "<Industry>"
customer_url: "<https://customer.example>"
codebase_base: "xmcloud-starter-js"
status: "unconfigured"
revision: 0
active_agent: "None"
session_id: null
updated_at: null
last_skin_run: null
task_id_prefix: "<CUSTOMER>-SC"
source:
  app_root: "industry-verticals/prospera"
  commit: null
workspace:
  app_root: "industry-verticals/<customer-slug>"
  worktree: null
  branch: null
  base_main_sha: null
  checkpoint_commit: null
  checkpoint_diff_sha256: null
  dev_origin: null
  inspector_port: null
  artifact_root: "industry-verticals/<customer-slug>/docs/ai/demos/<customer-slug>"
scope:
  writable_paths:
    - "industry-verticals/<customer-slug>/"
    - ".cursor/skills/skinned-demo-setup/runs/<customer-slug>/"
  serialization_root: null
  source_read_only: true
  shared_change_task: null
sitecore:
  organization_id: null
  environment_id: null
  collection_id: null
  collection_name: null
  site_id: null
  site_name: null
  content_root: null
  content_root_id: null
  dictionary_root: null
  media_root: null
  templates_root: null
  renderings_root: null
  rendering_parameters_root: null
  placeholder_settings_root: null
  headless_variants_root: null
  page_designs_root: null
  partial_designs_root: null
  shared_read_only_roots: []
  rendering_host_key: "<customer-slug>"
  editing_host_environment_id: null
  languages: ["en"]
  verified_at: null
integrations:
  marketer_connection: null
  documentation_connection: null
  authoring_connection: null
  content_hub_tenant: null
  content_hub_asset_scope: null
  search_source: null
  analytics_identifier: null
  capability_evidence: null
progress:
  setup: ".cursor/skills/skinned-demo-setup/runs/<customer-slug>/setup-progress.yaml"
  build: "industry-verticals/<customer-slug>/docs/ai/demos/<customer-slug>/demo-progress.yaml"
  project: "industry-verticals/<customer-slug>/docs/ai/config/project.yaml"
  manifest: "industry-verticals/<customer-slug>/docs/ai/manifests/sitecore-manifest.yaml"
  theme: "industry-verticals/<customer-slug>/docs/ai/themes/<customer-slug>.theme.yaml"
  content_map: "industry-verticals/<customer-slug>/docs/ai/demos/<customer-slug>/content-map.yaml"
  image_manifest: "industry-verticals/<customer-slug>/docs/ai/demos/<customer-slug>/images/image-manifest.json"
contracts:
  manifest_sha256: null
  theme_sha256: null
  dictionary_source: "sitecore"
  dictionary_fixture_root: null
  layout_fixture_root: null
  stylesheet_entry: "src/app/globals.scss"
  theme_mapping: "src/lib/site-theme.ts"
  layout_evidence: null
  data_policy: null
  approved_pages: []
  reference_artifacts: []
validation:
  lint: "not-run"
  build: "not-run"
  tests: "not-assessed"
  pages_editing: "not-run"
  responsive_visual: "not-run"
  brand_isolation: "not-run"
---

# Demo track: <Customer Name>

## Operating contract

Template only: replace placeholders and set `kind: customer-track`. Keep the track
unconfigured until identity and scope are verified. Null values grant no access.
Only the coordinator changes canonical board state under a runtime claim and an
expected `revision`; `active_agent` is a display field, never the lock itself.
Valid display owners: `None`, `Cursor`, `Codex`, `Grokbot`.

Tasks use globally unique IDs, such as `ACME-SC-001`. Preserve IDs across moves;
never reuse or renumber them. `[/]` is a literal convention, not a GitHub checkbox.
The section is authoritative for task state. Do not keep a second task-status field.

## To Do

- [ ] Verify customer identity, scope and copied configuration. <!-- id: <CUSTOMER>-SC-001 -->
  - **Acceptance:** Target Sitecore identities and app paths match; copied manifests resolve inside assigned roots.
- [ ] Apply approved brand and page plan. <!-- id: <CUSTOMER>-SC-002 -->
  - **Depends on:** <CUSTOMER>-SC-001
  - **Acceptance:** Source brand absent from customer-facing assets, copy, styles, metadata and integrations except documented intentional references.
- [ ] Verify build, editing and responsive presentation. <!-- id: <CUSTOMER>-SC-003 -->
  - **Depends on:** <CUSTOMER>-SC-002
  - **Acceptance:** Available checks pass; Pages editing and visual evidence retained; unresolved limitations recorded.

## In Progress

None. On claim, move the selected task here and use `- [/]`.
Attach Agent, Session, Started UTC, Scope, Acceptance and Handover Notes to that task.
Keep handover notes concise but include the exact next file or item ID, next action,
and evidence pointer. Example: `Next: verify Hero datasource <ID> in <environment>;
then update src/lib/site-theme.ts; evidence: <artifact path>.`

## Blocked

None. A blocked task retains its ID, blocker and resume condition. A paused workflow
may release its claim only after owned operations have stopped and state is saved.

## Done

None. Move a task here with `- [x]` only after its acceptance evidence is recorded.

## Latest checkpoint

- **Work completed:** None.
- **Next exact step:** Register this customer and verify target identity before mutation.
- **Evidence:** None.
- **Dirty files / running workers:** None recorded; inspect before resuming.
- **Remote mutation intent / returned IDs / unresolved jobs:** None recorded.
- **Remaining risks:** All null target IDs and paths require verification.

Store detailed evidence in the customer artifact root. Keep only the latest concise
checkpoint here. Archive older completed work per customer; retain task-ID references.
Do not paste Layout Service payloads, scraped HTML, base64 images, credentials or
full MCP responses into this board. `last_skin_run` is the last verified successful
skin completion in UTC, not the last attempt or heartbeat.
