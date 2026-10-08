# Sites API reference (Skinned Demo Setup)

Base URL: `https://xmapps-api.sitecorecloud.io`  
Catalog: [Sites API](https://api-docs.sitecore.com/sai/sites-api)

All mutating site/collection operations may return `{ "handle": "..." }`. Poll until terminal status.

## Auth

1. Create an **Automation** environment client in SitecoreAI Deploy (Organization Admin/Owner).
2. Exchange credentials for a JWT (audience `https://api.sitecorecloud.io`).
3. Send `Authorization: Bearer {JWT}` on every request.

Optional query on most endpoints: `environmentId`.

## Endpoints used in Step 1

| Action | Method | Path |
|---|---|---|
| List sites | `GET` | `/api/v1/sites` |
| Get site | `GET` | `/api/v1/sites/{siteId}` |
| Duplicate site | `POST` | `/api/v1/sites/{siteId}/copy` |
| Rename site | `POST` | `/api/v1/sites/{siteId}/rename` |
| List collections | `GET` | `/api/v1/collections` |
| Create collection | `POST` | `/api/v1/collections` |
| List collection sites | `GET` | `/api/v1/collections/{collectionId}/sites` |
| Job status | `GET` | `/api/v1/jobs/{jobHandle}/status` |

### Create collection body

```json
{
  "name": "customer-collection",
  "displayName": "Customer Collection",
  "description": "Optional description"
}
```

`name` pattern: `^(?![\s-])[a-zA-Z0-9_\s-]*(?<!\s)$` (max 100).

### Copy site body

```json
{
  "name": "new-site-name",
  "displayName": "Optional display name",
  "description": "Optional description"
}
```

Copy does **not** accept a target `collectionId`. The duplicate stays in the source site’s collection. The job payload includes `siteCollection` set to that source collection, and `done: true` when the clone finishes (the `status` field is often absent; a later poll can 404 once the job record is gone).

Do not use this endpoint to place a site in a different collection. Content Editor **Scripts > Clone Site** is the operation that accepts a target site collection. Channels Duplicate stays in the current collection. Authoring GraphQL `moveItem` does not work on SitecoreAI (bug 540450).

### Rename site body

```json
{
  "name": "final-site-name"
}
```

`name` max length 50; same character pattern as collection names.

## Job polling

`GET /api/v1/jobs/{jobHandle}/status`

Treat the job as finished when `done` is `true`. A following poll may return 404 because the job record has been removed; that 404 after `done: true` is completion, not failure. If `done` stays false, keep polling (suggest 5–15s intervals).

On an explicit failed job state, stop the skill and surface the job payload to the user.

## Not available

- **Move site between collections** — no Sites API endpoint, and Channels cannot drag a site into another collection. Do not call `POST /api/v1/sites/{siteId}/copy` when the target collection differs from the source. Ask the user to run Content Editor **Scripts > Clone Site** with the target set to `/sitecore/content/<target-collection>`, then verify with `GET /api/v1/collections/{collectionId}/sites`. Do not use Authoring GraphQL `moveItem` (broken on SitecoreAI, bug 540450).
