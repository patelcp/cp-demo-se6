# Shared slice review and release checklist

## Local checkpoint (2026-11-13)

Branch: `feat/aglc-shared-slice`, based on foundation `7973577`. App commit `1e5a092` is deployed to both public heads and the editing host. Native activation and public QA passed; draft PR26 remains unmerged. See evidence/shared-slice-verification.md for current results.

- Five shared native renderings: SiteHeader, SiteFooter, Hero, CardGrid, CallToAction.
- Distinct AGLC/CannabisSense tokens selected by actual site name. Visual approximations are documented in the app README, not represented as official BrandKit standards.
- Native `jsonValue` fields and child-item lists preserve SDK editing metadata.
- Lint, TypeScript and all 24 tests pass locally (21 slice tests plus 3 foundation tests).
- Five offline transport tests pass; independent security review confirms endpoint confinement, redirect rejection, proxy disabling and sanitized errors.
- 122 native items were prepared before the authentication pause. New-session reconciliation captured 80 developer-definition and 231 create-only seed YAML items. Scoped validation passes; both Homes and four partials retain blank layouts.
- Home layouts are activated and scoped content is published; signed-in Page Builder acceptance remains pending.

## Release sequence and remaining acceptance gate

1. User explicitly authorized continuation after disclosure of residual old-token exposure. Use only the newly authenticated session, never the exposed token. A new login is not proof of revocation. Do not store credentials or incident tokens in repository artifacts.
2. After clearance, use only the intended Sitecore endpoint and current authorized credentials. Re-read current native state before any change; preserve newer user edits and BrandKit assignments.
3. Run a production build against genuine Edge after the ISR change. Do not substitute fixtures or fabricated layouts.
4. Refresh narrowly scoped serialization: developer-owned definitions and exact new variants; editorial seed must remain create-only. Review actual item diff and unexpected deletions before release.
5. Review existing CM resource inventory before any build-configuration change. Preserve all existing deployItems modules; omission from IAR can remove resources. Do not merge broadly or assume earlier foundation approval covers this release.
6. Deploy matching shared code to both frontend projects and the editing host before activating native placements. Confirm correct commit and successful deployments.
7. Read and preserve each Home layout/design binding before changes. Attach site-owned header/footer partials and page-local hero/grid/CTA only. Stop if layouts contain newer user content; reconcile rather than overwrite.
8. Publish only reviewed slice resources/content. Verify public pages for both sites, noindex, genuine content, themes, mobile navigation/Escape/focus, links and absence of tracking initialization.
9. Verify Page Builder on each site: insert component, edit text/link/card, save, reload, publish and observe published content. This remains unrun because no connected browser was available. Code tests do not prove authorability.

## Rollback

Retain prior Home final/shared rendering values and design bindings before activation. Restore only slice placements if needed; retain editorial items and unrelated resources. Keep code rollback compatible with active native placements. Never delete existing site content as a shortcut.

## Review scope

App changes are confined to `industry-verticals/aglc`; new native definitions to AGLC-scoped templates/renderings; project documentation to this folder. There are no new analytics, affinity rules, experiments, forms or search features in this slice.
