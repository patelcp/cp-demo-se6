# AGLC blank-site seed baseline

This module captures the existing Empty-template sites, not new demo content.

- Namespace: `AGLC.Seed`.
- Scope: collection `/sitecore/content/aglc` as a single item; exactly the
  `aglc` and `cannabissense` site subtrees beneath it.
- Every include uses `allowedPushOperations: CreateOnly`. An ordinary deployment
  must not overwrite existing authored content or delete anything from these sites.
- This is a seed/reference baseline, not an ongoing developer-owned content sync.
- Rendering hosts and developer-owned definitions outside these site subtrees are
  handled separately. Do not expand this module to unrelated sites or global roots.

Initial authenticated pull captured 185 items. Read-only Sitecore CLI serialization
validation passed. No content was pushed to Sitecore by this capture.

After intentional infrastructure binding updates, re-pull this module to record the
final native values. Never edit serialized item IDs or replace author changes with
an old snapshot. A baseline restore is a deliberate separate operation, not a build
step. Exact source environment is recorded in the foundation manifest, not credentials.

```sh
sitecore serialization pull -n cm -i AGLC.Seed
sitecore serialization validate -i AGLC.Seed
```

CLI authentication and generated caches are ignored by Git; no auth file belongs in
this module. Deployment secrets must remain in the hosting/configuration service.
