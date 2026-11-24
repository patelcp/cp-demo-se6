# Shared slice verification — 2026-11-13

## Deployed source

App commit: `1e5a0929907c1d0370868d96065c2a415855cd4a`.
Draft PR: https://github.com/patelcp/cp-demo-se6/pull/26 (not merged).

- AGLC Vercel production: `dpl_9U4hd5pBG93yqzGVhmcRsvCNix4t`, READY.
- CannabisSense Vercel production: `dpl_Gruf762ZmZmPnu1nYZ2mZqoD3gBi`, READY.
- Managed editing host: `3KrfWmmlE2Y1bJAXWOCsIO`, all stages successful, finished 23:24:50 UTC.
- Editing host source is `feat/aglc-shared-slice`, automatic deployment remains off. Shared CM/dev unchanged.
- Hosted builds used existing genuine Sitecore/Edge configuration, standard Sitecore tooling and Next build; TypeScript passed. No fixture replacement.

## Native activation and publishing

Six layouts were compared against original snapshots before updates and verified afterward. Two page designs created. No unrelated layouts/settings overwritten. Rollback journals remain outside repository.

Exact scope: five successful individual publishes, then 124 dependency IDs, then two Home IDs. SMART, English, Experience Edge; recursive and related expansion disabled in batches. Both batches FINISHED, done, not failed. Server accounting reported 128 and 4 processed respectively; these are not submitted root counts.

One empty standard-values dependency was inspected separately after generation during activation. It contains only audit metadata, belongs to the owned rendering-parameter template, and was included as an exact reviewed item. Generation attribution is inferred, not proven.

HomeLink formatting was corrected to canonical dashed GUIDs after public QA found empty hrefs. Only unchanged generated links were updated. Exact datasource and Home batches succeeded; public hrefs resolve to `/`.

Scoped serialization: 314 items, 81 Definitions and 233 CreateOnly Seed. Validation passed. No IAR allowlist changes, global publish or shared CM deployment.

## Public browser checks

Fresh Playwright browsers, public URLs, no user browser session:

- https://aglc-cp.vercel.app/
- https://cannabissense-cp.vercel.app/

Verified all five native components on both pages, three cards each, distinct site themes, correct headlines and root brand links. Inspected desktop screenshots at 1440px and mobile at 390px. Mobile Menu opens; Escape closes and returns focus; neither page horizontally overflows. Both return HTTP 200 with `X-Robots-Tag: noindex, nofollow`. Browser console: zero errors/warnings. Observed resource hostnames: each site's own domain only.

AGLC headline: “Find the information you need.”
CannabisSense headline: “Get informed. Make thoughtful choices.”

## Local checks

Lint and TypeScript pass. 24 app tests pass (21 shared-slice, three foundation). Nine offline transport/activation tests pass. Independent code, transport, activation, serialization and exact batch-scope reviews passed. Final diff check passes.

## Not verified / next gate

Signed-in Page Builder render/edit/save/reload was not tested. Public rendering and native API verification do not substitute for that test. Keep PR draft until authoring UI acceptance. Remaining planned demo pages, campaign personalization, experiments, forms, search and Agentic Studio demos are outside this first slice.
