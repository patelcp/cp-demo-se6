# AGLC infrastructure foundation

## Scope and provenance

This checkpoint precedes customer page and component development. The owner created an AGLC collection and two Empty-template sites, named AGLC and CannabisSense. Exact item IDs, technical site names, languages and native paths must be verified against the target environment after authentication is restored.

One shared head lives at `industry-verticals/aglc`, based on `examples/basic-nextjs` at `dcf12c31f006a32a78af0a4005bcd7b4140baaee`. Both brands will share component implementations; later themes and authored compositions remain site-specific.

## Vercel projects created

| Project | Team | Root | Runtime | Default site |
| --- | --- | --- | --- | --- |
| [aglc-cp](https://vercel.com/cp-sc/aglc-cp) | cp-sc | industry-verticals/aglc | Node 24 | aglc |
| [cannabissense-cp](https://vercel.com/cp-sc/cannabissense-cp) | cp-sc | industry-verticals/aglc | Node 24 | cannabissense |

Both projects are linked to `patelcp/cp-demo-se6`, with `npm ci` and `npm run build`. Production branch remains `main`; do not silently promote the feature branch or merge unrelated work. No verified successful deployment, public alias or native binding exists at this checkpoint. Default site values remain to be confirmed against native sites.

## Authentication blocker

The existing Sitecore CLI session reported an expired/corrupted refresh token. No CMS writes have been made. The connected desktop exposed no browser surfaces for interactive login. Credentials must not be pasted into chat or committed.

The pinned Sitecore CLI 6.0.23 was restored. The Mac has .NET 10; invocation through its DLL with per-process `DOTNET_ROLL_FORWARD=Major` worked for CLI help and reached the authenticated API. Restore/login should use the repository's supported CLI; do not change global runtime settings.

## Remaining setup order

1. Refresh Sitecore login; identify the cp-demo-se6 project/environment and verify both existing sites. Do not recreate them.
2. Read the target environment's real Edge context and editing configuration through supported tools. Configure host variables securely; do not copy another customer's values.
3. Pull the native AGLC collection baseline into narrowly scoped serialization modules. Record exact item IDs and paths first. Keep one-time seed content separate from developer-owned definitions; normal releases must preserve later author edits.
4. Configure the shared editing head, either as a Sitecore-managed host or an explicitly registered external host. Preserve unrelated starter hosts. Never reuse the reserved `default` host name for a custom managed host.
5. Build/deploy the two Vercel projects from the reviewed foundation commit and configure corresponding hostnames and editing-host assignments.
6. Publish the intended minimal Home items and dependencies only. Verify both live hosts resolve to the correct sites, Page Builder renders, editing a native field saves/reloads, and no sample customer content is introduced.
7. Validate serialization and record the remote commit/deployment IDs. Only then start actual demo development.

## Verification boundaries

`/healthz` proves process availability, not Sitecore content or Page Builder. Do not replace failed Edge retrieval with fixture sites to produce a green build. No successful build or test result proves privacy compliance. Analytics, automatic page events and personalization execution are deliberately absent in this blank foundation and require explicit later setup for the planned UTM and experiment demos.

## Official references

- [Editing hosts](https://doc.sitecore.com/sai/en/developers/sitecoreai/environment-editing-hosts-and-rendering-hosts/the-different-types-of-editing-hosts-in-sitecoreai.html)
- [External editing host](https://doc.sitecore.com/sai/en/developers/sitecoreai/environment-editing-hosts-and-rendering-hosts/configure-an-external-editing-host.html)
- [Content serialization](https://doc.sitecore.com/sai/en/developers/sitecoreai/sitecore-content-serialization.html)
