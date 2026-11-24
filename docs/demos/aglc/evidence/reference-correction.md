# Customer-reference visual correction

Status: native correction is published and final visual runtime `f4c9819` is verified on both public demos. Hero and Footer render correctly. Signed-in Pages acceptance remains unverified.

## Reference evidence

Direct desktop (1440px) and mobile (390px) browser inspection of https://aglc.ca/ and https://cannabissense.ca/ on 2026-11-14 informed this correction. The original generic slice was technically functional but did not sufficiently resemble the customer sites.

AGLC: Open Sans, magenta #850057, gold #EDBE48, family-brand strip, compact white navigation, full-width mountain video, prominent search and six quick links, three sector-image cards, split-image CannabisSense promotion, dark grouped footer.

CannabisSense: dark green #004E35, cream #F6F4EF, bright green #70E37D, family-brand strip, large green navigation, cream hero panel over landscape, distinctive leaf-shaped hiking image, two square promotional tiles, Ask-us band and muted slate footer.

## Reuse and authoring

The five shared native renderings remain SiteHeader, Hero, CardGrid, CallToAction and SiteFooter. Optional native fields add logos, navigation groups, background image/video, search destination/label/query name and CTA imagery. Content remains Sitecore-owned, with SDK field metadata preserved. These are reference-driven implementations, not proof of automatic BrandKit styling or Agentic Studio execution.

Search submits to the customer's existing public search endpoint. It is not a Sitecore Search implementation. No affinity tracking or personalization is introduced.

## Asset and typography provenance

Customer images and logos are sourced from the customer public sites for this customer demonstration and imported into scoped native media folders. Public availability is not a general redistribution license. Keep the demo noindex; confirm customer rights before broader distribution. Do not include downloaded source assets in the app repository.

The AGLC background video remains an authorable link to the official public asset rather than duplicating its large file. A separate official mountain photograph is the reduced-motion/static fallback, so that frame is not pixel-identical to the video. Public asset fetching never carries Sitecore authentication.

Open Sans and Poppins are self-hosted with their OFL license files. CannabisSense's Utopia Std Headline is not copied: Georgia is an explicit approximation pending an authorized font or licensed kit. Exact typography parity is therefore not claimed.

## Current verification (2026-11-14)

- Runtime `39aeb4c` is READY on both Vercel production heads. Editing-host deployment `6QkqL1BBlUXXl84zIiDlrF` completed all stages successfully at 01:10:16 UTC. No shared CM deployment, IAR change or merge was performed for this correction.
- The compact native-field adapter preserves SDK field metadata and legacy alias compatibility. At this runtime, lint, TypeScript and all 34 app tests passed; 12 offline transport/activation safety tests passed. Independent app, transport and exact native-scope reviews passed.
- Native reference updates include 12 optional fields, five rendering query extensions, a Hero insert option, 31 existing content updates, 36 initial navigation additions and one reversible archived card. All existing content IDs and BrandKit assignments were preserved. Twenty-one native media assets are recorded in `reference-assets.json`, without repository blobs.
- Final query correction uses `Fields: fields(ownFields: true) { name jsonValue }` at the datasource and child levels. Preview tests returned exactly the 11 Hero fields, four Footer fields, and four navigation child fields, with no standard/audit fields. Hero child counts are six/zero; Footer counts are 19/12. Native authoring payloads remain intact.
- Five additional AGLC family-brand navigation items were created and published after explicit approval. AGLC points to its native demo Home; CannabisSense points to `https://cannabissense-cp.vercel.app/` to demonstrate switching experiences. DrinkSense, GameSense and Self Exclusion use their verified official destinations. The first two destinations intentionally differ from the public reference site's links.
- Final publication submitted exactly eight dependency roots (two renderings, five new navigation items and the AGLC header datasource), then exactly two Home roots. Dependencies used SMART, Homes FULL, English, Experience Edge, with descendants and related items disabled. Dependency operation `a1a9c350-92bc-4653-8c58-c7d3b9abf2c1` and Home operation `e52b9b31-10e6-41f2-95a6-98b0d010753e` both FINISHED with `isDone: true` and `isFailed: false`. Server processed counts were six and four; submitted root counts remained eight and two.
- After the 90-second cache window and one ISR follow-up, both public pages delivered Hero and Footer with `isContentResolved: true` and native fields. Both rendered an h1 and footer; footer anchor counts were 19 AGLC and 12 CannabisSense. AGLC's CannabisSense demo link and the exact `mailto:cannabissense@aglc.ca` href were verified. Find support is in utility navigation.
- Scoped serialization pull found exactly two query updates and five new navigation items. Validation passed for 368 items: 93 Definitions plus 275 CreateOnly Seed items. Scoped whitespace checks passed. No broad push or publication was used.
- Final CSS commit `f4c9819e80fbd68dd1e13f2ff0a965c7c15ff196` is committed and pushed; independent combined review passed. Its Vercel deployments `dpl_5H6S6WXSNasXGeZmq8nrYPgJRwGu` (AGLC) and `dpl_8fUizmcMgTjtepcpsUSQ2XVMVRgF` (CannabisSense) are both READY. Editing-host deployment `4NJNgNsy8bwiCirMPU8qHb` completed all stages at 01:23:20 UTC. Final desktop/mobile screenshots were inspected at 01:22–01:24 UTC: white AGLC family logos and the measured 50% #004E35 CannabisSense overlay match reference appearance. Both Heroes, media and footer counts remain correct; no overflow and zero browser console errors/warnings. The earlier behavioral QA remains recorded against `39aeb4c`: video pause/resume, reduced motion with zero video requests, Menu/Escape/focus all passed.
- Signed-in Page Builder render/edit/save/reload remains unverified. Public rendering and native API evidence do not substitute for that acceptance check.

## Diagnostic and publication history

The first reference app runtime `3947958` and editing-host deployment `7K5ritxagmzJjOY3vok5Hw` completed successfully at 00:23:34 UTC. The first exact reference publication attempt was rejected before process launch; after the user explicitly approved 126 dependencies and two Homes, one retry succeeded. Operations `7b3c1110-3482-401a-be69-acd8fb09c013` and `127dfd15-9000-4742-8f13-8dbb0d2a094d` both FINISHED. These were submitted as 126 and two roots, not the server's processed counts of 163 and two.

The new reference content reached both sites, but Hero had no fields and `isContentResolved: false`. Direct Delivery queries succeeded, and the exact datasource IDs resolved in CM master. One exact two-Home FULL refresh (`9aac073a-17a9-42c6-91e0-80a855639690`) did not restore Hero. CM logs showed datasource resolution warnings but no explicit complexity exception.

A single reversible `children(first: 6)` experiment also failed. The separately tested Footer `first: 30` query returned 19/12 links directly from Delivery but failed in the integrated layout. The Find support utility group and mailto encoding fixes in that same scoped batch did take effect. No repeated mutation loop was used.

A confined read-only Preview probe using the existing Preview API key established the actual cause: the expanded Hero query exceeded Preview's depth limit (18 versus 15), while Footer first30 exceeded Preview's complexity limit. The old Hero and Footer queries succeeded. Original expanded Hero without the child bound also failed, so the bound itself was not the cause. Delivery query success alone had not established Preview compatibility.

Filtered bulk fields solved both Preview constraints while preserving every intended native field and child. The matching adapter was deployed before switching the native queries. The final exact publication and public acceptance results above supersede the earlier unresolved-state observations.

Earlier CSS follow-up `7a3c332d20efd2b3333ff4667a7258f82f32023d` and editing-host deployment `2hGTfM9enBfSuJmZZ4j60X` completed at 00:40:49 UTC. That inspection confirmed visible header logos, non-overlapping footer groups, no mobile overflow and the corrected hamburger. Final populated Hero/video and latest CSS visual acceptance passed as recorded above.
