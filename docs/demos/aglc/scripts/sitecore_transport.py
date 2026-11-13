"""Confined authoring transport. Importing this module performs no I/O."""
import json
import urllib.request

EXPECTED_CM_ORIGIN = "https://xmc-sitecoresaa5196-cpdemof775-cm249c.sitecorecloud.io"
AUTHORING_ENDPOINT = EXPECTED_CM_ORIGIN + "/sitecore/api/authoring/graphql/v1/"

class TransportError(RuntimeError):
    """Sanitized failure; never includes headers, response body or request data."""

class RejectRedirects(urllib.request.HTTPRedirectHandler):
    def _reject(self, *args, **kwargs):
        raise TransportError("Authoring redirect rejected")
    redirect_request = _reject
    http_error_301 = _reject
    http_error_302 = _reject
    http_error_303 = _reject
    http_error_307 = _reject
    http_error_308 = _reject

def make_graphql(auth):
    # Validate exact origin before accessing the token. No hostname suffix matching,
    # userinfo, alternate ports, URL paths, query strings or fragment accepted.
    if auth.get("endpoints", {}).get("cm", {}).get("host") not in (
        EXPECTED_CM_ORIGIN, EXPECTED_CM_ORIGIN + "/"
    ):
        raise TransportError("Unexpected CM origin")
    token = auth["endpoints"]["xmCloud"]["accessToken"]
    if not isinstance(token, str) or not token or any(c in token for c in "\r\n"):
        raise TransportError("Invalid access-token format")
    # Disable ambient HTTP proxies as well as every redirect. HTTPS uses the
    # standard verified TLS context; no custom certificate bypass is supplied.
    opener = urllib.request.build_opener(
        urllib.request.ProxyHandler({}), RejectRedirects()
    )
    def graphql(query, variables=None):
        # Endpoint cannot be supplied by caller or captured from content loops.
        try:
            request = urllib.request.Request(
                AUTHORING_ENDPOINT,
                data=json.dumps({"query": query, "variables": variables or {}}).encode(),
                headers={"Authorization": "Bearer " + token,
                         "Content-Type": "application/json"}, method="POST"
            )
            with opener.open(request, timeout=40) as response:
                if response.geturl() != AUTHORING_ENDPOINT:
                    raise TransportError("Unexpected authoring response URL")
                result = json.load(response)
            if result.get("errors"):
                raise TransportError("Authoring GraphQL returned errors")
            return result["data"]
        except Exception:
            # Suppress underlying HTTP exception/response details and token-bearing
            # request objects. Caller receives no untrusted response body.
            raise TransportError("Authoring request failed; inspect sanitized diagnostics") from None
    return graphql
