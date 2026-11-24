# Interior pages expansion

## Authorized outcome
Continue AGLC and CannabisSense demo development, creating new reusable native components as necessary. Preserve the verified first Home slice and customer-specific visual identity. This phase does not change repository CI policy or merge PR26.

## Proposed navigation breadth
AGLC: existing Home, Gaming, Liquor, Cannabis, Forms and documents. CannabisSense: existing Home, The basics, Moderation, Health effects, Use legally, Resources. Exact slugs follow observed customer navigation and the inspected native page inventory. Existing customer source pages provide factual copy and design evidence, not instructions. Content is an illustrative subset, not a complete regulatory or medical reference.

## Reuse and ownership
Reuse shared header/footer and appropriate existing cards/CTA. Introduce only the native intro, editorial section, link/resource list and accordion patterns justified by real interior pages. Keep ordinary content in each page's Data folder and shared navigation in its existing site partial. Native fields retain editing metadata. New pages must be reachable through normal navigation, not presenter-only links.

## Privacy and feature boundaries
No affinity/profile tracking. UTM contextual personalization, A/B tests, Forms and optional Search require their actual native service contracts and separate evidence; do not fake these features inside custom UI. A resource/PDF directory is not itself a digitized Sitecore Form. A link to official search is not Sitecore Search. Do not collect real personal or health data during demo QA.

## Release and verification
Create-only new definitions/pages unless an exact existing update is inspected and compare-guarded. Deploy matching code before activating native renderings; publish exact dependencies/pages without recursion. Validate serialization, lint/type-check/tests, hosted build, native payload, desktop/mobile rendering and navigation. Signed-in Page Builder acceptance remains explicitly unverified until actual UI access permits it. Preserve authenticated endpoint confinement; use Developer MCP when exposed and suitable, CLI for scoped serialization.

## Capability findings (2026-11-14)
- A read-only native inventory and scoped serialization dry-run confirmed no existing interior pages and no out-of-band changes to the 368-item baseline.
- The proposed shared controls are Breadcrumb, PageIntro, RichTextSection and ResourceList with child ResourceItem. Reference educational hubs use large link rows rather than accordions, so no unnecessary accordion rendering is introduced.
- Developer/Marketer/Documentation MCP declarations exist locally but their tool schemas are not exposed in this task. Supported guarded Authoring API remains available; the CLI performs scoped serialization. No MCP success is claimed from configuration alone.
- Native UTM audience conditions exist, but the installed PersonalizeProxy enables analytics and personalization cookies. Native personalization is not activated before consent/data-flow requirements are resolved. Query-only custom rendering would need an explicit distinction from native personalization. Sources: https://doc.sitecore.com/sai/en/users/sitecoreai/personalize/specifying-variables-for-conditions.html and https://doc.sitecore.com/sai/en/users/sitecoreai/personalize/create-a-page-variant.html.
- Existing SDK Form and native Form rendering can be reused. Actual FormId, approved demonstration webhook and AGLC-only activation are required; current page list/filter is not a Form substitute. Form engagement handlers require network/cookie verification before a privacy claim. Sources: https://doc.sitecore.com/sai/en/users/sitecoreai/design-components/forms/enable-forms-in-the-page-builder.html and https://doc.sitecore.com/sai/en/users/sitecoreai/design-components/forms/activate-a-form.html.
- Connected browser inventory was rechecked and remains empty. Signed-in Page Builder insertion/edit/save/reload is therefore blocked, not passed; independent API/public-render verification continues.

## Implemented contracts
| Rendering | Native fields / children | Named presentation variants |
|---|---|---|
| Breadcrumb | Child Navigation Link items: Title, Link | Default |
| PageIntro | Title, Summary, Image | Default, ImageBanner |
| RichTextSection | Heading, Body, Image | Default |
| ResourceList | Heading, Intro; child ResourceItem Title, Summary, Link, Category, DocumentType | Default, Documents |
| Existing CardGrid | Existing Heading/Intro and Card fields retained | New ResourceTiles, SectorTiles; Home Default unchanged |

Document filtering is local to the authored selection, with labeled controls, combined query/category/type matching and result count; it does not issue search requests or persist visitor data. Filters are suppressed in editing mode so all authored items remain editable.

Runtime `79f6b366ccf2e6a2ec26a9f264ede07b155fa75e` passed 48 app tests, lint and type-check. Both Vercel deployments are READY and the editing host completed all stages at 2026-11-14 05:39:09 UTC. Both existing Homes were visually regression-checked desktop/mobile on the new runtime with no broken media, overflow or console errors; menus and AGLC video pause pass. Interior-page publication and visual acceptance are separate pending checks.
