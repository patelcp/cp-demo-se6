# AGLC + CannabisSense blank head

One shared Next.js App Router / Sitecore Content SDK head for the existing `aglc` and
`cannabissense` Empty-template sites in the AGLC collection. This foundation adds no
business components, fabricated content, or hardcoded customer routes.

## Provenance and boundaries

Copied from `examples/basic-nextjs` at repository commit
`dcf12c31f006a32a78af0a4005bcd7b4140baaee`. Sitecore SDK versions remain unchanged. Required security maintenance updates
Next.js and its lint config to 16.4.6, plus compatible transitive dependencies; the
new app has its own lockfile. The original starter is untouched. Native routing, placeholders, field rendering, editing endpoints,
Design Library support, redirects and locale resolution are retained.

Analytics initialization, page-view events and personalization proxy execution are
intentionally absent. Multisite cookie resolution is disabled. This is not a claim
of compliance or of a cookieless Sitecore platform. The later UTM/experiment work
must explicitly implement and verify the agreed privacy/consent behavior.

Robots and response headers discourage indexing of these demonstration hosts; they are not access control.

Website styling is intentionally blank. Brand Kits do not apply CSS themes; the
later two themes and shared components will be implemented only after this baseline
is verified live and in Page Builder.

## Deployment contract

- Vercel project root: `industry-verticals/aglc`.
- Both frontend projects can deploy this same source with their own
  `NEXT_PUBLIC_DEFAULT_SITE_NAME` (`aglc` or `cannabissense`) and public origin.
- Native Sitecore site hostnames and editing-host bindings must match the actual
  deployed URLs. A project default is not a substitute for correct host mappings.
- Configure server Edge context, public Edge context and editing secret securely
  in the target host. Do not commit secrets or copy another customer's settings.
- `.env.remote.example` documents the required settings. Automated workflows must
  not modify `.env.local` or `.env.*.local`.
- No Vercel project/alias or Sitecore endpoint is hardcoded in source.

## Commands

```sh
npm ci
npm test
npm run lint
npm run type-check
npm run build
```

Map generation and Sitecore tools build are part of `npm run build`. The latter
requires a valid target Edge context and retrieves real site information. A failed
content connection must be fixed rather than replaced with fixture sites. The
starter has no runtime unit-test framework; `npm test` checks the minimal
foundation contract with Node's built-in runner.

`GET /healthz` verifies only that the deployed process responds. Acceptance also
requires published Home pages for both sites, correct site resolution, authenticated
Page Builder rendering, and save/reload verification. The deployment owner must
record those checks separately; none is implied by the health response.

## Foundation verification

- `npm ci`: passed before targeted security maintenance.
- Updated dependency installation: passed.
- `npm run lint`: passed (native Next.js flat config; inherited 404 JSX boundary fixed).
- `npm test`: passed, three source-contract checks.
- `npm run sitecore-tools:generate-map`: passed.
- Production build: passed using the verified environment live Edge context in
  process memory, including genuine site discovery and prerendering `/aglc/en`.
- Type check: passed after the genuine generated site/import maps were available.
- Public URL acceptance passes on both sites; signed-in Page Builder edit/save/reload remains pending. See `docs/demos/aglc/evidence/shared-slice-verification.md`.

The installation audit after security maintenance reports 13 moderate findings and
no high/critical findings. Do not treat this as a guarantee of vulnerability-free
code. No broad automatic audit fix or major Sitecore SDK upgrade was performed.

## First shared native slice

Five native renderings: `SiteHeader`, `SiteFooter`, `Hero`, `CardGrid`, `CallToAction`.
All consume `fields.data.datasource`; PascalCase field aliases hold `{ jsonValue }`
with unchanged SDK field objects. Navigation/card children use `children.results`
and stable `id`. Field contracts are in each component's `.props.ts`. No datasource
renders nothing; optional missing fields produce no synthetic copy. Native field
helpers retain editing metadata. Header/footer belong in shared partial designs;
Hero/Grid/CTA datasource ownership belongs to each page.

`Layout` selects theme using actual `page.siteName`, not hostname guesses or
campaign parameters. Public CSS inspected 2026-11-13: https://aglc.ca/ uses
`#850057` and `#3f4040`; https://cannabissense.ca/ uses `#004e35`, `#f6f4ef`,
`#8dbf83`. Fonts, spacing, radii and layout are demo approximations, not official
brand specifications. BrandKit guidance does not automatically apply website CSS.
No remote fonts, tracking or personalization have been activated.

The page route explicitly exports `revalidate = 60`. The installed SDK layout
service delegates to GraphQL's native fetch without a separate persistent layout
cache, and Cache Components is not enabled. After content reaches live Edge, the
first request after 60 seconds may serve the previous page while regeneration
runs; a subsequent request should show the new publication. This is not an exact
60-second publication SLA. Failed regeneration retains the prior page. Deploy
matching component code before activating native Home renderings, publish, then
verify Edge and the regenerated live page. No public revalidation webhook added.
See https://nextjs.org/docs/app/guides/incremental-static-regeneration.

Local slice verification: lint and 24 Node tests passed; tests execute real React
SSR with native field helpers, plus source-contract checks. Genuine Edge-context
production build passed before ISR addition; standalone typecheck also passed
after ISR addition. Repeat production build when authenticated access is cleared. Browser mobile-menu interaction, native insertion/edit-save-reload,
image/link picker behavior and live visual QA remain release gates. No fixture
route, content seed, tenant write or deployment is included in this frontend work.
