"""Offline activation scope and layout regression tests; no authentication."""
import copy
import importlib.util
from pathlib import Path
import unittest
import uuid
spec=importlib.util.spec_from_file_location('activation',Path(__file__).with_name('activate-native-slice.py'))
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
BLANK='<r><d id="'+a.DEVICE+'" l="'+a.LAYOUT+'" /></r>'
def item(id):return {'itemId':id,'fields':{'nodes':[{'name':n,'value':BLANK if n=='__Renderings' else ''} for n in a.FIELDS]}}
def fixture():
    m={'sites':{},'components':{}};h={};p={}
    for site in ['aglc','cannabissense']:
        h[site]={'item':item(site)}
        d=m['sites'][site]={'homeId':site,'content':dict.fromkeys(['Hero','CardGrid','CallToAction'],'fake'),'partials':{}}
        for name,label in [('SiteHeader','Site header'),('SiteFooter','Site footer')]:
            path='/sitecore/content/aglc/'+site+'/Presentation/Partial Designs/'+label
            d['partials'][name]={'itemId':site+name,'path':path};p[path]={'item':item(site+name)}
    return m,h,p
class ActivationTests(unittest.TestCase):
    def test_exact_scope(self):
        m,h,p=fixture();a.assert_scope(m,h,p)
        for mutation in [lambda:m['sites'].update({'other':{}}),
                         lambda:p.update({'/sitecore/content/other':{'item':item('other')}}),
                         lambda:m['sites']['aglc']['partials']['SiteHeader'].update({'path':'/other'}),
                         lambda:m['sites']['aglc'].update({'homeId':'other'})]:
            m,h,p=fixture();mutation()
            with self.assertRaises(RuntimeError):a.assert_scope(m,h,p)
    def test_partial_final_or_design_refused(self):
        for field in ['__Final Renderings','Page Design']:
            m,h,p=fixture();record=next(iter(p.values()))['item']
            next(f for f in record['fields']['nodes'] if f['name']==field)['value']='authored'
            with self.assertRaises(RuntimeError):a.assert_scope(m,h,p)
    def test_layout_parameters_device_and_identity_verified(self):
        id=str(uuid.uuid4());m={'components':{'Hero':{'renderingId':id,'variants':{'aglc':id}}}}
        xml=a.layout_xml(BLANK,[('Hero',id,'headless-main')],'aglc',m)
        baseline=a.layout_structure(xml)
        for modified in [xml.replace('DynamicPlaceholderId=1','DynamicPlaceholderId=2'),
                         xml.replace('FieldNames=','WrongField='),
                         xml.replace(a.DEVICE,'{00000000-0000-0000-0000-000000000000}'),
                         xml.replace(a.LAYOUT,'{00000000-0000-0000-0000-000000000000}'),
                         xml.replace('headless-main','other')]:
            self.assertNotEqual(baseline,a.layout_structure(modified))
        with self.assertRaises(RuntimeError):a.layout_xml(xml,[('Hero',id,'headless-main')],'aglc',m)
    def test_changed_snapshot_refused(self):
        before=item('a');after=copy.deepcopy(before)
        after['fields']['nodes'][0]['value']='changed'
        with self.assertRaises(RuntimeError):a.assert_unchanged(after,before)
if __name__=='__main__':unittest.main()
