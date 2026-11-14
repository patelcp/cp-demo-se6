# Customer-reference visual correction

Status: local implementation and native preparation in progress. Not yet deployed or accepted by visual QA.

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

## Verification gates

- Independent frontend and scoped media transport/inventory reviews completed.
- Local lint, type-check and focused tests are being rerun against the final changes.
- Hosted build, scoped native publication and fresh populated-page desktop/mobile visual inspection are pending.
- Signed-in Page Builder render/edit/save/reload remains unverified.
- No merge or shared CM deployment is part of this correction.
