# AGLC infrastructure foundation

## Scope and provenance

This checkpoint precedes customer page and component development. The owner created an AGLC collection and two Empty-template sites, named AGLC and CannabisSense. Verified in cp-demo / cm: `/sitecore/content/aglc/aglc` and `/sitecore/content/aglc/cannabissense`, technical names `aglc` and `cannabissense`, language `en`.

One shared head lives at `industry-verticals/aglc`, based on `examples/basic-nextjs` at `dcf12c31f006a32a78af0a4005bcd7b4140baaee`. Both brands will share component implementations; later themes and authored compositions remain site-specific.

## Vercel projects created

| Project | Team | Root | Runtime | Default site |
| --- | --- | --- | --- | --- |
| [aglc-cp](https://vercel.com/cp-sc/aglc-cp) | cp-sc | industry-verticals/aglc | Node 24 | aglc |
| [cannabissense-cp](https://vercel.com/cp-sc/cannabissense-cp) | cp-sc | industry-verticals/aglc | Node 24 | cannabissense |

Both projects are linked to `patelcp/cp-demo-se6`, with `npm ci` and `npm run build`. Production branch remains `main`; no merge was performed. Explicit foundation production deployments from feature commit `df530a2` both succeeded. The two verified project domains are `aglc-cp.vercel.app` and `cannabissense-cp.vercel.app`, now reflected in native Site Grouping HostName and TargetHostName fields.

## Current setup status

Sitecore authentication was refreshed by the owner and verified. Existing sites were not recreated. Live Edge context and the existing CM editing secret were transferred directly into encrypted Vercel environment variables without writing secrets to tracked files.

The native blank baseline contains 185 items under the collection and two sites. `AGLC.Seed` is scoped to exactly those paths with `CreateOnly` push operations; validation passes. No serialization push has been run. A scoped SMART publish of the collection and related dependencies was submitted to Experience Edge.

A dedicated managed editing-host environment named `aglc` is linked to the existing CM. It uses the shared head and feature branch with automatic deployments disabled. Its managed deployment completed successfully (`3GQKL8XQIkFTnRItmFdF3C`). The platform registered `https://xmc-7purwtl7yj2hsnwwr26uzy-eh.sitecorecloud.io`, and public DNS now resolves it. The Mac resolver remains stale; HTTPS using the verified public address returns the same unauthenticated 403 as an existing managed host. This is not an authenticated editing-health verification. The native CM Rendering Hosts/aglc item has not appeared. The owner selected RenderingHost=aglc for AGLC; CannabisSense remains Default. These settings were read back and the owner’s change captured through scoped serialization. A broad authoring deployment was deliberately not started on this shared CM. Existing rendering hosts and Default are untouched.

The pinned Sitecore CLI 6.0.23 works through its DLL with per-process `DOTNET_ROLL_FORWARD=Major` on this Mac's .NET 10. No global runtime settings were changed.

## Verified results

- Both production aliases return HTTP 200 with distinct correct native site-route markers: [AGLC](https://aglc-cp.vercel.app/) and [CannabisSense](https://cannabissense-cp.vercel.app/).
- Both `/healthz` endpoints return HTTP 200, and page responses carry `X-Robots-Tag: noindex, nofollow`.
- Vercel deployments: `dpl_42vUx8KrhWLrvmAnUXZmUpWSaCEe` and `dpl_7ZHVgb4rFuHfxdkZseYgbpnPJaUa`, both READY.
- Genuine local production build with live Edge passed, including metadata/site/import map generation, Next compilation, TypeScript and prerender. Separate type-check passed.
- Tests (3), lint and scoped serialization validation passed. npm audit reports 13 moderate vulnerabilities and no high/critical; no forced breaking upgrades applied.
- Native Home is intentionally blank. No sample business pages or customer features added.

## Remaining before feature development

1. Confirm managed editing-host DNS and health, then complete its native CM rendering-host registration through the supported deployment/configuration path. Avoid deploying unrelated serialization without review.
2. Assign only the two AGLC Site Grouping items to the dedicated `aglc` rendering host after it exists and is healthy. Re-pull the scoped seed after this change.
3. Verify Page Builder rendering and native-field save/reload. The connected desktop exposed no browser surface for this check, so it is explicitly unrun.

The production frontends are ready; the end-to-end editing foundation is not yet signed off. Do not treat health/build success as Page Builder verification.

## Verification boundaries

`/healthz` proves process availability, not Sitecore content or Page Builder. Do not replace failed Edge retrieval with fixture sites to produce a green build. No successful build or test result proves privacy compliance. Analytics, automatic page events and personalization execution are deliberately absent in this blank foundation and require explicit later setup for the planned UTM and experiment demos.

## Official references

- [Editing hosts](https://doc.sitecore.com/sai/en/developers/sitecoreai/environment-editing-hosts-and-rendering-hosts/the-different-types-of-editing-hosts-in-sitecoreai.html)
- [External editing host](https://doc.sitecore.com/sai/en/developers/sitecoreai/environment-editing-hosts-and-rendering-hosts/configure-an-external-editing-host.html)
- [Content serialization](https://doc.sitecore.com/sai/en/developers/sitecoreai/sitecore-content-serialization.html)

## Follow-up on owner host selection

Official managed-host documentation confirms that a subsequent authoring deployment materializes the registered rendering-host item. Deploy listing `aglc` is not itself proof that Page Builder has the native binding. The owner’s screenshot showed the Page Builder selector on Default, not verified use of the new shared host. No site settings were overwritten during this follow-up. Only one editing host is intended for both sites; a second CannabisSense editing host is unnecessary.
