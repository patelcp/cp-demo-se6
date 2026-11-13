# Shared authorable Home slice

## Approved outcome
One representative Home on each existing site. Reuse the same five implementations, native rendering contracts and editable fields while composing distinct AGLC and CannabisSense experiences. This is not the full five-page demo yet.

## Visitor journey
- AGLC: understand the regulator's remit, choose a service or information category, then follow an official service destination.
- CannabisSense: understand the educational purpose, explore responsible-use information, then follow an official learning destination. No retail cannabis checkout, purchasing flow or product recommendations.

## Components and ownership
| Rendering | Content owner | Native fields |
|---|---|---|
| SiteHeader | Each site's shared header partial datasource | BrandName, Logo, HomeLink; child navigation Title/Link |
| Hero | Current Home/Data | Eyebrow, Title, Summary, Image, PrimaryLink, SecondaryLink |
| CardGrid | Current Home/Data | Heading, Intro; child Card Title/Summary/Image/Link |
| CallToAction | Current Home/Data | Title, Body, Link |
| SiteFooter | Each site's shared footer partial datasource | BrandName, Description, Copyright; child navigation Title/Link |

All query fields preserve SDK jsonValue metadata. Child collections use children.results. Plain copy uses Text; rich copy uses RichText; images and links use native Image/Link helpers. No raw fixture layout payloads and no synthetic editing UI.

## Visual direction
Separate CSS tokens selected using the actual resolved site name, not visitor profiling. BrandKit application is owner-reported; it does not automatically apply CSS tokens to custom code. Current public sites supply visual evidence; any inferred styling is a demo approximation, not an official brand standard. Source URLs: https://aglc.ca/ and https://cannabissense.ca/.

AGLC should feel like a clear, service-oriented public authority. CannabisSense should feel like accessible, focused public education. Distinction must come from typography, color, spacing and authored composition while sharing component code. Use real provided or publicly sourced assets only; empty editable Image fields are preferable to fabricated asset IDs.

## Native setup and release sequence
1. Inspect and retain current Home layout and design bindings.
2. Create only new narrowly scoped AGLC definitions and datasource content. Existing BrandKit assignments and other customer items are untouched.
3. Test implementation and publish a draft review branch. Ensure matching exports exist on the editing head before activating Home renderings.
4. Bind shared header/footer structure and page-local body data through restricted placeholders. Publish only the required sites/definitions/dependencies within approved scope.
5. Verify real Edge envelopes, public output on both sites, and actual Page Builder insertion/edit/save/reload when browser access is available.

## Boundaries
No affinity tracking, automatic analytics, campaign personalization, A/B experimentation, Forms, Search or DAM implementation in this first slice. These remain later features. No blanket merge authorization for future shared-CM changes is inferred from the earlier foundation release. Keep existing three resource modules in every authoring artifact; author-owned seed content remains excluded from IAR.

## Acceptance status
Planning and contracts recorded. Implementation, tenant provisioning, deployment/publication and native editing acceptance are tracked separately in features/shared-slice.json. Browser inventory was empty at kickoff; Page Builder save/reload is unrun, not passed.
