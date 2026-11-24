# CannabisSense Basics native campaign rollout

This isolated release is based on app runtime d4ec774. It does not include Reference Brands, Search, Forms, Page Builder workflow changes, or a public publish. Page Builder preview alone does not prove live audience evaluation.

## Release prerequisites

- Confirm the exact CannabisSense project/production alias is the selected demo, the site is `cannabissense` in English, and the SitecoreAI site/language has its intended analytics identifier. Confirm that the Vercel project's Live Context IDs (`SITECORE_EDGE_CONTEXT_ID` and `NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID`) are for the same tenant. Set `NEXT_PUBLIC_PERSONALIZE_SCOPE` to match that tenant's `PAGES_PERSONALIZE_SCOPE` if customized. Do not copy or print credentials.
- Selectively publish the approved Basics page version, its native campaign variant and its separate datasource, including referenced items as appropriate; remove any draft-only Never Publish test guard only after approval. No unrelated publishing is required.
- Release this branch only to the CannabisSense demo and set `CANNABISSENSE_NATIVE_PERSONALIZATION=1` on that project when approved. Absent the flag, the App Router still serves the default experience and hides the opt-in. This check is in addition to the exact canonical host and `/basics` guard.
- Native Sitecore decides against the published campaign equality rule. Use `https://cannabissense-cp.vercel.app/basics?utm_campaign=edibles_education`. Exact optional `utm_source=instagram` is accepted but not inferred; other query parameters do not trigger the demo. Use the unmodified demo link if a social wrapper appends parameters.
- The visitor must choose **Allow personalization** on Basics. This synthetic demo is not a production CMP or cookie-free. The two visitor cookies created by Sitecore's native server proxy are scoped to this host and `/basics`, not available to browser JavaScript, and expire no later than the 30-minute consent window. **Turn off personalization** clears those scoped cookies and returns to the plain path. Browser page-view events are not added. Native Sitecore still receives pseudonymous IDs, user-agent data and the approved UTM context, and might retain data under the environment's rules. Turning off does not delete Sitecore records already created.

## Live acceptance

Use fresh browser profiles for each control:

1. Untagged Basics and tagged Basics before consent both show the existing CTA; neither collects the two Sitecore personalization IDs. An AGLC page, another CannabisSense page, and preview mode have no new consent control.
2. In the tagged session, select Allow. After redirect, verify the actual Sitecore variant copy and link render on first response, the URL remains the tagged Basics URL, and the three cookies are host-only, Secure, HttpOnly, SameSite=Lax, Path=/basics and short-lived. Check No Store and verify no browser page-view event, arbitrary UTM, or referrer is sent in this decision. Record only header names and attributes, not cookie values.
3. In that same consenting session, visit the plain path and a different campaign; both show the existing CTA. Check the direct source URL with the optional Instagram tag as a positive if relevant. Verify another fresh profile never receives personalized markup.
4. Click Turn off. Check the default CTA both on return and after reopening the tagged URL; the scoped cookies should be cleared, and consent shows as off. Verify no caching leaks between visitors by repeating the fresh control while a different browser is consented.
5. If the expected result differs, check the Sitecore rule, variant and datasource publication and Edge scope instead of changing the frontend matching condition or deploying other features.

Rollback: disable `CANNABISSENSE_NATIVE_PERSONALIZATION` and redeploy the intended demo runtime or restore its prior deployment; verify default CTA in a fresh tagged session. Use the existing Sitecore version restore procedure if a published authoring change also needs reversal.
