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
campaign parameters. Reference screenshots were viewed at desktop and mobile sizes
on 2026-11-14. The correction follows AGLC's family-brand bar, compact header,
landscape-video hero, gold quick links, three image-led sector cards and split CTA;
CannabisSense uses a dark-green header, landscape background, cream title panel,
leaf-cropped hiking image and two square promotional tiles. Native field values
supply logos, images, links and editorial copy; no fixture page substitutes for CMS.

Open Sans (AGLC) and Poppins (CannabisSense) are self-hosted from the official
Google Fonts repository under the SIL Open Font License. Files and license notices
are in `public/fonts/`; sources are `google/fonts/main/ofl/opensans` and
`google/fonts/main/ofl/poppins` at https://github.com/google/fonts.
The official CannabisSense display font is licensed Utopia Std Headline. This demo
uses Georgia/Cambria as a disclosed substitute, not a claimed identical font or an
assumption that the official Adobe kit is licensed for this domain. Measured colors
include AGLC #850057/#edbe48 and CannabisSense #004e35/#f6f4ef/#70e37d.
BrandKit guidance does not automatically apply website CSS. No tracking or
personalization has been activated.

Navigation children may include `Group` and `Logo`: header groups `brand` and
`utility` are separate from main/empty; footer groups use authored labels. Only
brand logos replace visible labels; ordinary icons retain visible Text. Search
uses a real authored HTTPS GET endpoint plus `SearchQueryName`, never a pretend
Sitecore Search handler. Hero accepts `BackgroundImage` and `BackgroundVideo`;
video is not loaded before client motion preference is known, does not load for
reduced motion, and has a pause control. CTA supports native `Image`, and optional
`icon-band band-cream|band-green|band-brown|band-deep` style combinations for the
reference's additional CannabisSense bands.

The page route explicitly exports `revalidate = 60`. The installed SDK layout
service delegates to GraphQL's native fetch without a separate persistent layout
cache, and Cache Components is not enabled. After content reaches live Edge, the
first request after 60 seconds may serve the previous page while regeneration
runs; a subsequent request should show the new publication. This is not an exact
60-second publication SLA. Failed regeneration retains the prior page. Deploy
matching component code before activating native Home renderings, publish, then
verify Edge and the regenerated live page. No public revalidation webhook added.
See https://nextjs.org/docs/app/guides/incremental-static-regeneration.

Verification checkpoint (2026-11-14): lint, standalone type-check and all 34
Node tests pass; 12 offline safety tests pass. Native reference content is
published, with Hero/Footer resolution verified on both live demos. Runtime
`39aeb4c` passed genuine hosted builds, desktop/mobile visual inspection, mobile
Menu/Escape/focus, video pause/resume, reduced-motion (no video request), media
loading and overflow checks. Final measured tint/contrast CSS in `f4c9819` passed hosted builds and
final desktop/mobile visual inspection with no overflow or console errors. See
`docs/demos/aglc/evidence/reference-correction.md` for current evidence.

Signed-in Page Builder insertion/edit/save/reload and image/link picker behavior
remain unverified. Public rendering and API verification are not a substitute.
The shared Home slice has been extended with native interior hubs; deeper source destinations remain official external links rather than a complete site migration.

Hero and Footer also accept native bulk GraphQL `Fields: fields(ownFields: true) { name jsonValue }`
(including child `Fields`). An explicit allowlisted adapter preserves each native
`jsonValue` object and editing metadata, ignores standard/unknown/dangerous keys,
and retains legacy PascalCase aliases. This avoids the verified integrated-query
depth/complexity limits without introducing fixtures or fallback content. The
compatible frontend must be deployed before switching native query projection.

### Interior-page extension

Public references inspected at desktop1440 and mobile390: AGLC `/gaming`, `/liquor`, `/cannabis`, `/forms`; CannabisSense `/basics`, `/moderation`, `/health-effects`, `/use-legally`, `/resources`. Sector pages use image banners; the four CannabisSense topic hubs use solid green titles and cream link rows, not accordions. Resources uses icon tiles. Mobile source layout defects are not deliberately reproduced.

Four shared native renderings add no fixture routes: `Breadcrumb` (Navigation Link children), `PageIntro` (Title, Summary, Image), `RichTextSection` (Heading, Body, Image), `ResourceList` (Heading, Intro; ResourceItem children Title, Summary, Link, Category, DocumentType). All accept Preview-safe `Fields: fields(ownFields:true) { name jsonValue }` projections and preserve native field metadata. `PageIntro.ImageBanner`, `ResourceList.Documents`, `CardGrid.ResourceTiles`, and `CardGrid.SectorTiles` are finite named exports selected by native `FieldNames` variants. Home `Default` renderings remain unchanged.

Documents filters only its authored selection locally, without tracking, API requests, or claims of Sitecore Search/full official catalogue coverage. Editing shows every item and retains native controls. Source URLs stay authoritative; no generated PDFs or application submissions are implied.

Validation: lint, type-check and 50 tests pass. Both hosted builds and the editing host completed. Nine native interior pages are published; initial desktop/mobile and filter/navigation checks passed. Final fidelity refinements are published and all nine interior routes passed desktop/mobile screenshot inspection with no overflow or broken images; navigation and local filtering passed. Signed-in native insertion/edit/save/reload remains unverified. The licensed Utopia display font remains substituted with Georgia/Cambria; official Poppins/Open Sans assets and existing licenses are unchanged.
