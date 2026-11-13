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
- Production build: blocked at Sitecore site discovery (`MV-007`) until the target
  Edge context is provided through secure host/process configuration.
- Type check: blocked on generated site/import maps that require that discovery.
- Sitecore/Page Builder/live URL acceptance: pending; see the deployment manifest.

The installation audit after security maintenance reports 13 moderate findings and
no high/critical findings. Do not treat this as a guarantee of vulnerability-free
code. No broad automatic audit fix or major Sitecore SDK upgrade was performed.
