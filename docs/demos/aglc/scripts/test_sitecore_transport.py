"""Offline security regression suite. Fake credentials and mocked transport only."""
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock
import urllib.error
import urllib.request
from sitecore_transport import (make_graphql, EXPECTED_CM_ORIGIN, AUTHORING_ENDPOINT,
                                RejectRedirects, TransportError)

FAKE_TOKEN = 'FAKE-NOT-A-CREDENTIAL'
def auth(host=EXPECTED_CM_ORIGIN):
    return {'endpoints': {'cm': {'host': host}, 'xmCloud': {'accessToken': FAKE_TOKEN}}}

def response(data=None, url=AUTHORING_ENDPOINT):
    r=io.BytesIO(json.dumps(data or {'data': {'ok': True}}).encode())
    r.geturl=lambda: url
    return r

class ConfinementTests(unittest.TestCase):
    def test_rejects_every_nonexact_origin_before_opening_transport(self):
        for host in ['https://evil.example', EXPECTED_CM_ORIGIN+'.evil.example',
                     EXPECTED_CM_ORIGIN+':443', EXPECTED_CM_ORIGIN+'/path',
                     EXPECTED_CM_ORIGIN+'?q=1', EXPECTED_CM_ORIGIN+'#fragment',
                     EXPECTED_CM_ORIGIN.replace('https://','https://user@'),
                     EXPECTED_CM_ORIGIN.replace('https://','http://'),
                     EXPECTED_CM_ORIGIN+'//', ' '+EXPECTED_CM_ORIGIN,
                     'https://another.sitecorecloud.io', None]:
            with self.subTest(host=host), patch('urllib.request.build_opener') as build:
                # No token entry: origin must be checked before token access.
                with self.assertRaises(TransportError): make_graphql({"endpoints": {"cm": {"host": host}}})
                build.assert_not_called()

    def test_url_looking_values_never_change_destination(self):
        with patch('urllib.request.build_opener') as build:
            opener=build.return_value
            gql=make_graphql(auth())
            for url in ['https://aglc.ca/licensing','https://evil.example',
                        '//evil.example','/sitecore/content/aglc/aglc/Home/Data']:
                opener.open.return_value=response()
                self.assertEqual(gql('query($p:String!){item(path:$p){id}}',{'p':url}),{'ok':True})
                request=opener.open.call_args.args[0]
                self.assertEqual(request.full_url, AUTHORING_ENDPOINT)
                self.assertEqual(request.get_method(),'POST')
                self.assertEqual(json.loads(request.data)['variables']['p'],url)
            with self.assertRaises(TypeError): gql('query',endpoint='https://evil.example')
            handlers=build.call_args.args
            self.assertTrue(any(isinstance(h,RejectRedirects) for h in handlers))
            self.assertTrue(any(isinstance(h,urllib.request.ProxyHandler) and h.proxies=={} for h in handlers))

    def test_all_redirect_codes_fail_without_followup_request(self):
        # Dispatch a mocked response through the real urllib opener's HTTP error
        # chain, no socket. Every status rejects before another open could occur.
        for code in [301,302,303,307,308]:
            with self.subTest(code=code):
                opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),RejectRedirects())
                request=urllib.request.Request(AUTHORING_ENDPOINT,data=b'{}',headers={'Authorization':'Bearer '+FAKE_TOKEN})
                with patch.object(opener,'open') as followup:
                    with self.assertRaises(TransportError):
                        opener.error('http',request,io.BytesIO(b''),code,'redirect',{'location':'https://evil.example'})
                    followup.assert_not_called()

    def test_errors_are_sanitized(self):
        with patch('urllib.request.build_opener') as build:
            gql=make_graphql(auth())
            for failure in [urllib.error.HTTPError(AUTHORING_ENDPOINT,403,FAKE_TOKEN,{},None),
                            RuntimeError('secret-body '+FAKE_TOKEN)]:
                build.return_value.open.side_effect=failure
                with self.assertRaises(TransportError) as e: gql('private-query')
                self.assertNotIn(FAKE_TOKEN,str(e.exception))
                self.assertNotIn('private-query',str(e.exception))
                self.assertTrue(e.exception.__suppress_context__)
            build.return_value.open.side_effect=None
            for r in [response({'errors':[{'message':FAKE_TOKEN}]}),response(url='https://evil.example'),io.BytesIO(b'not-json')]:
                build.return_value.open.return_value=r
                with self.assertRaises(TransportError) as e: gql('private-query')
                self.assertNotIn(FAKE_TOKEN,str(e.exception))

    def test_imports_are_side_effect_free(self):
        for name in ['prepare-native-slice.py','prepare-slice-content.py','upload-reference-media.py','extend-reference-fields.py']:
            with patch.object(Path,'read_text',side_effect=AssertionError('No reads')),patch('urllib.request.build_opener',side_effect=AssertionError('No transport')):
                spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/name)
                spec.loader.exec_module(importlib.util.module_from_spec(spec))


class MediaUploadTests(unittest.TestCase):
    def test_exact_signed_destination_only(self):
        from sitecore_transport import make_media_uploader
        path='/sitecore/api/v1/authoring/media/upload'
        with patch('urllib.request.build_opener') as build:
            upload=make_media_uploader(auth())
            for url in ['https://aglc.ca'+path+'?token=FAKE', EXPECTED_CM_ORIGIN+':443'+path+'?token=FAKE',
                        EXPECTED_CM_ORIGIN+path+'?token=FAKE&other=1', EXPECTED_CM_ORIGIN+path+'?token=',
                        EXPECTED_CM_ORIGIN+path+'?token=FAKE#fragment', EXPECTED_CM_ORIGIN+path+'/?token=FAKE',
                        EXPECTED_CM_ORIGIN+path+'?token=FAKE&token=SECOND']:
                with self.subTest(url=url), self.assertRaises(TransportError):
                    upload(url,filename='test.png',content=b'fake-local-bytes',content_type='image/png')
            build.return_value.open.assert_not_called()
    def test_multipart_stays_on_cm_and_sanitizes_failures(self):
        from sitecore_transport import make_media_uploader
        url=EXPECTED_CM_ORIGIN+'/sitecore/api/v1/authoring/media/upload?token=FAKE-SIGNED-TOKEN'
        with patch('urllib.request.build_opener') as build:
            upload=make_media_uploader(auth());build.return_value.open.return_value=response({'itemId':'fake'},url=url)
            self.assertEqual(upload(url,filename='logo.png',content=b'local-bytes',content_type='image/png'),{'itemId':'fake'})
            req=build.return_value.open.call_args.args[0]
            self.assertEqual(req.full_url,url);self.assertEqual(req.get_method(),'POST')
            self.assertIn(b'filename="logo.png"',req.data);self.assertIn(b'local-bytes',req.data)
            build.return_value.open.side_effect=RuntimeError(url+' '+FAKE_TOKEN)
            with self.assertRaises(TransportError) as e:upload(url,filename='logo.png',content=b'local-bytes',content_type='image/png')
            self.assertNotIn('FAKE',str(e.exception));self.assertTrue(e.exception.__suppress_context__)
    def test_origin_guard_before_token_access(self):
        from sitecore_transport import make_media_uploader
        with patch('urllib.request.build_opener') as build:
            with self.assertRaises(TransportError):make_media_uploader({'endpoints':{'cm':{'host':'https://aglc.ca'}}})
            build.assert_not_called()

if __name__=='__main__': unittest.main()
