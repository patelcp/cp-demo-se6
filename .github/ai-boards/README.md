# Parallel customer demo architecture review

Reviewed 2026-10-10 against local checkout `29c3cf14eb41b2ae3516e2b01071550fb9f99eb7`
plus its existing uncommitted changes. Upstream Prospera's inspected `main` tree was
`f03a1747db5d103de5e3cbfce29d550489fda1f5`. No tenant mutation or live MCP validation
was performed. These are boilerplate and an implementation plan, not a running
concurrency service.

## 1. Feasibility review and critique

The proposed Markdown boards are useful handoff documents, but they cannot by
themselves prevent concurrent writes or brand contamination. Two agents can read
`active_agent: None`, both claim it, and overwrite each other. A process crash can
leave ownership stuck. Two instances of Codex are indistinguishable without session
IDs. Atomic file replacement prevents torn files, but not competing claims.

Use one branch/worktree per concurrent customer writer, a shared local coordinator
for claims, and explicit filesystem/Sitecore scopes. Worktrees isolate files and
build outputs; they do not isolate remote content. Git commits and `.git/index.lock`
are not application locks. Separate clones do not share a local lock directory.
For multi-host operation, use a central transactional backend rather than Git sync
or a shared Markdown file as a distributed lock.

Start with one writer per customer. Three agents can write three isolated tracks;
with only two tracks, the third should review, research, or take an independent
integration task. Allowing three writers on one site requires finer-grained claims
for files, schema, items and layouts, with substantially more recovery complexity.

| Risk or bottleneck | Recommended control |
| --- | --- |
| Read/check/write race | Exclusive atomic claim through a coordinator, with session-specific ownership. |
| Crash, timeout or abandoned session | Supervisor heartbeat plus explicit recovery; no automatic stale-lock theft. |
| Stale worktree board copies | One canonical board root discovered from the shared runtime locator. |
| Simultaneous Markdown rewrites | Expected revision, unique task IDs, single writer and atomic replacement. |
| Brand leakage across apps | Scoped paths, copied-config review, isolated origins, asset provenance and negative brand checks. |
| Shared Sitecore templates, partial designs or schemas | Read-only shared base or separately owned customer extensions; resource claims for shared edits. |
| Shared rendering-host registration | Short, serialized integration task; never serialize the entire skinning workflow on one global lock. |
| Existing setup/build YAML plus new board | Distinct authority: board owns tasks/scope; YAML owns workflow phases. |
| Expanding history consumes model context | Load selected track and current checkpoint only; archive completed work; link to evidence. |
| Large payloads and screenshots | Store per-customer files, hashes and paths; keep HTML/JSON/base64 out of boards. |
| MCP latency, quotas and uncertain writes | Bounded calls, per-environment backoff, durable intent/results and read-back verification. |
| Three Next.js processes compete locally | Reserve dev and inspector ports, allocate build concurrency; keep `.next` and generated SDK files separate. |

Task IDs should be customer-qualified (`ACME-SC-001`), immutable and validated across
boards. They prevent line-number drift but do not resolve conflicting changes or
ambiguous customer identity. A single handover sentence is too weak without an
artifact/checkpoint reference, validation result and exact next action.

Local protocol compliance remains cooperative until filesystem permissions and
tool gateways enforce it. No Markdown rule makes an unrestricted agent incapable
of modifying another customer.

## 2. Sitecore and Next.js specific updates

### Verified local architecture

- Customer apps are under `industry-verticals/`, alongside independent starter
  applications under `examples/`. Do not assume a linked package-workspace monorepo.
- Prospera declares Next.js `^16.2.0`, React `^19.2.1`, Content SDK Next.js `^2.4.0`
  and Tailwind `^4` in [package.json](../../industry-verticals/prospera/package.json).
  These are declared ranges, not a verification of installed versions.
- [sitecore.config.ts](../../industry-verticals/prospera/sitecore.config.ts) disables
  multisite and static-path generation. Routing nevertheless accepts site/locale.
  The catch-all [page](../../industry-verticals/prospera/src/app/[site]/[locale]/[[...path]]/page.tsx)
  uses the Content SDK `Page` model, `client.getPage`, preview APIs and no-store
  route settings. This review does not establish a current caching defect.
- [request.ts](../../industry-verticals/prospera/src/i18n/request.ts) fetches the
  Sitecore dictionary by site and locale; there is no verified shared local JSON
  dictionary to rename. It splits a combined site/locale string on `_`, while the
  setup skill allows underscores in site names. Test this case or constrain names
  until the parsing contract is made unambiguous.
- The stylesheet entry is [globals.scss](../../industry-verticals/prospera/src/app/globals.scss),
  which imports Tailwind, Bootstrap and other Sass. The existing build skill's
  `globals.css` examples must be adapted, not followed blindly.
- [site-theme.ts](../../industry-verticals/prospera/src/lib/site-theme.ts) recognizes
  `Financial` and `Services` and otherwise falls back to `site-financial`.
  [SiteTheme.tsx](../../industry-verticals/prospera/src/components/utilities/SiteTheme.tsx)
  applies this to the body after mount. Bind a customer explicitly and validate
  first paint, navigation cleanup and computed styles.
- [project.yaml](../../industry-verticals/prospera/docs/ai/config/project.yaml) and
  [the manifest](../../industry-verticals/prospera/docs/ai/manifests/sitecore-manifest.yaml)
  reference `main/main-website` and `fmc-custom-demo`. The serialized
  [Prospera module](../../authoring/items/prosperabank/prosperabank.module.json)
  targets `financial` roots and permits create/update/delete. These differing
  identities require validation before copying or pushing serialized items.

### Content and configuration contracts to record

| Area | Board or linked-manifest contract |
| --- | --- |
| Tenant identity | Organization, environment, collection, site IDs and names; verified timestamp and connection alias. Names alone are insufficient. |
| Data templates | Assigned template roots, template/field GUIDs and field types, inheritance, standard values and schema version/hash. Shared templates remain read-only unless explicitly assigned. |
| Rendering definitions | Rendering IDs, exact component-map keys, datasource template/location, component query and generated-map evidence. Generate maps within the customer app, never edit them by hand. |
| Rendering parameters | Parameter-template ID, parameter names/types, variant names, placeholder keys, dynamic-placeholder IDs and rendering instance UID. Avoid reconstructing layouts from component names alone. |
| Presentation | Page and partial design IDs, headless variants, shared/final layout ownership and language/version. A shared header/footer may belong to a collection rather than one site. |
| Dictionary | Source is Sitecore by default; record site, language and dictionary root. If fixtures are added, use customer-local `src/dictionaries/<site>/<locale>.json` and an explicit test-only loader. Never silently fall back to another customer's phrases. |
| Layout JSON fixtures | Customer-local test fixtures keyed by environment/site/language/route/mode, sanitized and tied to an SDK version. They are test evidence, not substitutes for authoring templates or live layout state. |
| Themes and assets | Theme hash, actual stylesheet entry, site-theme mapping, image/font/logo provenance and customer asset directory. Confirm CSS selector specificity and inherited defaults. |
| Integrations | Content Hub tenant/asset scope, search source, analytics identifier, canonical host, editing host and rendering-host key. Separate local ports alone do not isolate cookies or analytics. |
| Deployment/serialization | Customer module root and explicit inclusion paths; no broad push over another site's templates/content. Route root configuration changes through an integration task. |

For fixture paths above, the locations are proposals, not existing app features.
Include the actual SDK field shape in contracts: this project uses Content SDK
`Page` data, while individual components may use route fields, datasource fields
or GraphQL `jsonValue`. Do not apply one universal `fields.data.datasource` shape
to every component or to old JSS layout fixtures.

Sitecore's documented App Router dictionary integration resolves phrases per site
and locale. Preserve that separation in any local fallback or cache.
[Sitecore internationalization documentation](https://doc.sitecore.com/sai/en/developers/content-sdk/20/DEFAULT/internationalization-using-next-intl.html).

For new cached data, include environment/site/locale/route and relevant preview or
personalization context in the key, or bypass shared caching for those modes.
When using Next.js `use cache`, pass dynamic tenant context as arguments rather
than reading request data inside the cache scope.
[Next.js cache guidance](https://nextjs.org/docs/messages/next-request-in-use-cache).

Build each customer with its intended public configuration: `NEXT_PUBLIC_*` values
are embedded at build time. A runtime environment switch cannot repair an already
built bundle's public identity.
[Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables).

Tailwind v4 automatically scans source files and permits explicit source bases.
Keep scans confined to each app; for older v3 starters, inspect their `content`
globs instead. Class scanning finds text tokens, not arbitrary runtime class-name
construction. Map rendering-parameter values to complete known classes or explicit
CSS variables rather than hoping a dynamically assembled class will be emitted.
[Tailwind source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).

### Marketer MCP versus Documentation MCP

Assuming “Document MCP” means **Sitecore Documentation MCP**, it supplies product
reference material, not live tenant state or a content lock. If another custom
Document MCP is intended, its schema and write authority need a separate review.
[Sitecore tool descriptions](https://doc.sitecore.com/sai/en/users/sitecoreai/working-with-agentic-studio/agentic-studio-settings/tools-available-to-chats-and-agents.html).

Marketer MCP provides supported site/page/content/component operations; capability
and tenant prerequisites vary. Discover the connected tool schemas and record the
verified environment. Do not infer arbitrary template authoring, layout replacement
or parameter/variant mutation from a tool's name. Use a verified authoring API or
an explicit manual step for unsupported work, and read back changes. A local
board cannot constrain another editor or API client unless access is mediated.
[Marketer MCP reference](https://doc.sitecore.com/sai/en/users/sitecoreai/sitecore-marketer-mcp-server/marketer-mcp-tool-reference-and-other-information.html).

## 3. Prospera integration plan

Follow [the incremental integration plan](prospera-integration-plan.md). It provides
the exact entry-point insertion, new `instructions.md` content, current workflow
anchors, downstream build-loop changes, coordinator contract and acceptance tests.

Key compatibility corrections are: gate before the first progress write; preserve
existing YAML authority; validate copied manifests before automatic repair; retain
ownership through same-session handoff; support direct build/resume invocation; and
honor the repository prohibition on editing `.env.local` despite the older skill's
instructions to do so.

The referenced [upstream Prospera repository](https://github.com/sc-jzi/prospera)
also contains the `SKILL.md` entry point. Adding an unreferenced `instructions.md`
would not establish enforcement. The installed Grokbot instruction loader and
all three agents' mutation hooks remain unverified.

## 4. Harness artifacts and adoption

| Artifact | Purpose |
| --- | --- |
| [master-backlog.md](master-backlog.md) | Pipeline configuration, authority rules, resource policy and launch gates. |
| [demo-brand.template.md](demo-brand.template.md) | Customer-scoped identity, paths, task IDs, progress references and handoff template. |
| [cursorrules-injection.txt](cursorrules-injection.txt) | Exact appendable `.cursorrules` text; not installed into global instructions. |
| [prospera-integration-plan.md](prospera-integration-plan.md) | Exact additive skill changes and enforcement implementation plan. |

No customers have been provisioned, no locks acquired and no live board registered.
The master starts with an empty index and disabled writes so examples cannot be
mistaken for verified customer configuration. Populate boards and implement/test
the coordinator before activating the injection across agents.

Documentation-only generation does not require an application build. Future app
changes must run available lint/build/tests, plus Sitecore Pages and visual checks.
The local Prospera package has build/lint scripts but no test script; do not claim
an `npm test` success or invent coverage for it.
