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


def make_media_uploader(auth):
    """Create a confined multipart uploader for uploadMedia's signed CM URL.

    Asset downloading is deliberately not supported here. Pass already reviewed
    local bytes; neither the bearer nor the signed URL may reach asset hosts.
    """
    from urllib.parse import urlsplit, parse_qsl
    import uuid
    if auth.get('endpoints', {}).get('cm', {}).get('host') not in (
        EXPECTED_CM_ORIGIN, EXPECTED_CM_ORIGIN + '/'
    ):
        raise TransportError('Unexpected CM origin')
    token = auth['endpoints']['xmCloud']['accessToken']
    if not isinstance(token, str) or not token or any(c in token for c in '\r\n'):
        raise TransportError('Invalid access-token format')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), RejectRedirects())
    expected = urlsplit(EXPECTED_CM_ORIGIN)
    def upload(signed_url, *, filename, content, content_type):
        try:
            parsed = urlsplit(signed_url)
            query = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True)
            if (parsed.scheme != expected.scheme or parsed.netloc != expected.netloc
                or parsed.path != '/sitecore/api/v1/authoring/media/upload'
                or parsed.fragment or len(query) != 1 or query[0][0] != 'token'
                or not query[0][1] or any(c.isspace() for c in signed_url)):
                raise TransportError('Unexpected media upload destination')
            if (not filename or any(c in filename for c in '\r\n"/\\')
                or not filename.isascii() or not isinstance(content, bytes)
                or not 0 < len(content) <= 32 * 1024 * 1024
                or content_type not in ('image/png', 'image/jpeg', 'image/webp', 'image/svg+xml')):
                raise TransportError('Invalid upload file')
            boundary = 'sitecore-' + uuid.uuid4().hex
            # Official authoring example uses an unnamed multipart file field.
            body = (f'--{boundary}\r\nContent-Disposition: form-data; name=""; filename="{filename}"\r\n'
                    f'Content-Type: {content_type}\r\n\r\n').encode() + content + f'\r\n--{boundary}--\r\n'.encode()
            request = urllib.request.Request(signed_url, data=body, method='POST', headers={
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
            })
            with opener.open(request, timeout=60) as response:
                if response.geturl() != signed_url:
                    raise TransportError('Unexpected upload response URL')
                return json.load(response)
        except Exception:
            raise TransportError('Media upload failed; inspect sanitized diagnostics') from None
    return upload
