"""Activate only the reviewed, initially blank six layouts. Never publishes."""
import argparse
import base64
import datetime
import json
import os
from pathlib import Path
import uuid
from urllib.parse import urlencode, parse_qsl
import xml.etree.ElementTree as ET
from sitecore_transport import make_graphql

DEVICE = '{FE5D7FDF-89C0-4D99-9AA3-B5FBD009C9F3}'
LAYOUT = '{96E5F4BA-A2CF-4A4C-A4E7-64DA88226362}'
PAGE_DESIGN_TEMPLATE = '1105b8f8-1e00-426b-bf1f-c840742d827b'
FIELDS = ('__Renderings', '__Final Renderings', 'Page Design')
QUERY = 'query($p:String!){item(where:{path:$p,database:"master"}){itemId template{templateId} fields(ownFields:false){nodes{name value}}}}'

def guid(value):
    return '{'+str(uuid.UUID(value)).upper()+'}'

def values(item):
    return {f['name']: f['value'] for f in item['fields']['nodes'] if f['name'] in FIELDS}

def assert_unchanged(current, before):
    if not current or current['itemId'] != before['itemId'] or values(current) != values(before):
        raise RuntimeError('Layout changed since reviewed snapshot; refusing mutation')


def assert_scope(manifest, homes, partials):
    sites = {'aglc', 'cannabissense'}
    if set(manifest['sites']) != sites or set(homes) != sites:
        raise RuntimeError('Exactly the two approved sites are required')
    expected_partials = set()
    for site in sites:
        details = manifest['sites'][site]
        if set(details['partials']) != {'SiteHeader', 'SiteFooter'}:
            raise RuntimeError('Unexpected partial scope')
        if set(details['content']) != {'Hero', 'CardGrid', 'CallToAction'}:
            raise RuntimeError('Unexpected content scope')
        if details['homeId'] != homes[site]['item']['itemId']:
            raise RuntimeError('Home identity differs')
        for name, label in [('SiteHeader', 'Site header'), ('SiteFooter', 'Site footer')]:
            path = '/sitecore/content/aglc/'+site+'/Presentation/Partial Designs/'+label
            expected_partials.add(path)
            partial = details['partials'][name]
            if partial['path'] != path or partial['itemId'] != partials.get(path, {}).get('item', {}).get('itemId'):
                raise RuntimeError('Partial path or identity differs')
    if set(partials) != expected_partials:
        raise RuntimeError('Exactly four approved partial paths required')
    for item in [v['item'] for v in homes.values()] + [v['item'] for v in partials.values()]:
        if values(item).get('__Final Renderings') or values(item).get('Page Design'):
            raise RuntimeError('Snapshot contains final renderings or page design')

def layout_structure(xml):
    root = ET.fromstring(xml)
    devices = root.findall('d')
    if root.tag != 'r' or len(devices) != 1:
        raise RuntimeError('Unexpected layout structure')
    device = devices[0]
    def attr(node, name):
        return node.get(name) or node.get('{s}'+name)
    placements = []
    for rendering in device:
        if rendering.tag != 'r':
            raise RuntimeError('Unexpected device child')
        placements.append((rendering.get('uid'), attr(rendering,'id'),
                           attr(rendering,'ds'), attr(rendering,'ph'),
                           sorted(parse_qsl(attr(rendering,'par') or '', keep_blank_values=True))))
    return device.get('id'), attr(device,'l'), placements

def layout_xml(original, placements, site, manifest):
    root = ET.fromstring(original)
    devices = root.findall('d')
    if len(devices) != 1 or devices[0].get('id') != DEVICE or devices[0].get('l') != LAYOUT or list(devices[0]):
        raise RuntimeError('Expected original blank layout; refusing mutation')
    device = devices[0]
    for index, (name, datasource, placeholder) in enumerate(placements, 1):
        component = manifest['components'][name]
        # Deterministic UIDs and actual manifest IDs; no copied customer rendering IDs.
        ET.SubElement(device, 'r', {
            'uid': guid(str(uuid.uuid5(uuid.NAMESPACE_URL, site+'/'+name))),
            'id': guid(component['renderingId']), 'ds': guid(datasource),
            'ph': placeholder,
            'par': urlencode({'FieldNames': guid(component['variants'][site]),
                              'DynamicPlaceholderId': str(index)}),
        })
    return ET.tostring(root, encoding='unicode')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply',action='store_true')
    parser.add_argument('--home-snapshot',type=Path,required=True)
    parser.add_argument('--partial-snapshot',type=Path,required=True)
    parser.add_argument('--rollback-dir',type=Path,required=True)
    args=parser.parse_args()
    root=Path(__file__).resolve().parents[4]
    rollback=args.rollback_dir.resolve()
    if rollback == root or root in rollback.parents:
        parser.error('Rollback must be outside the repository')
    manifest=json.loads((root/'docs/demos/aglc/native-manifest.json').read_text())
    homes=json.loads(args.home_snapshot.read_text())
    partials=json.loads(args.partial_snapshot.read_text())
    assert_scope(manifest, homes, partials)
    plan=[]
    for site, details in manifest['sites'].items():
        for name, placeholder in [('SiteHeader','headless-header'),('SiteFooter','headless-footer')]:
            partial=details['partials'][name];before=partials[partial['path']]['item']
            plan.append({'path':partial['path'],'before':before,'fields':{'__Renderings':layout_xml(values(before)['__Renderings'],[(name,partial['datasourceId'],placeholder)],site,manifest)}})
        before=homes[site]['item']
        if values(before).get('Page Design') or values(before).get('__Final Renderings'):
            raise RuntimeError('Home snapshot is not blank')
        plan.append({'path':'/sitecore/content/aglc/'+site+'/Home','before':before,'site':site,
                     'fields':{'__Renderings':layout_xml(values(before)['__Renderings'],[(name,details['content'][name],'headless-main') for name in ['Hero','CardGrid','CallToAction']],site,manifest)}})
    expected_paths={'/sitecore/content/aglc/'+site+'/Home' for site in ('aglc','cannabissense')} | set(partials)
    if len(plan)!=6 or {step['path'] for step in plan}!=expected_paths:
        raise RuntimeError('Activation must target exactly six approved paths')
    if not args.apply:
        print('Prepared only: 4 partial layouts, 2 new page designs, 2 Home layouts/design assignments. No network or credential reads.')
        return
    auth=json.loads(Path(os.environ['SITECORE_CLI_AUTH']).read_text())
    payload=json.loads(base64.urlsafe_b64decode(auth['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
    if payload['iat'] < 1794610965 or payload['exp'] <= datetime.datetime.now(datetime.timezone.utc).timestamp():
        raise RuntimeError('Require new authorized session; stale credentials refused')
    gql=make_graphql(auth)
    def read(path):return gql(QUERY,{'p':path})['item']
    # Validate all six before any mutation, and again immediately before each write.
    for step in plan:assert_unchanged(read(step['path']),step['before'])
    design_parents={}
    for site in manifest['sites']:
        parent='/sitecore/content/aglc/'+site+'/Presentation/Page Designs'
        if read(parent+'/Shared experience'):
            raise RuntimeError('Page design already exists; requires explicit reconciliation')
        design_parents[site]=read(parent)['itemId']
    rollback.mkdir(parents=True,exist_ok=True,mode=0o700)
    record=rollback/('activation-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.json')
    journal={'plan':plan,'completed':[]}
    def save():record.write_text(json.dumps(journal,indent=2)+'\n');record.chmod(0o600)
    save()
    designs={}
    for site, details in manifest['sites'].items():
        result=gql('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':'Shared experience','parent':design_parents[site],'templateId':PAGE_DESIGN_TEMPLATE,'fields':[{'name':'PartialDesigns','value':'|'.join(guid(details['partials'][n]['itemId']) for n in ['SiteHeader','SiteFooter'])}]}})
        designs[site]=result['createItem']['item']['itemId'];journal['completed'].append({'createdPageDesign':designs[site],'site':site});save()
    for step in plan:
        assert_unchanged(read(step['path']),step['before'])
        fields=dict(step['fields'])
        if 'site' in step:fields['Page Design']=guid(designs[step['site']])
        gql('mutation($i:UpdateItemInput!){updateItem(input:$i){item{itemId}}}',{'i':{'database':'master','itemId':step['before']['itemId'],'fields':[{'name':k,'value':v} for k,v in fields.items()]}})
        journal['completed'].append({'updated':step['path'],'fields':fields});save()
        actual=values(read(step['path']))
        # Sitecore may normalize rendering XML; verify structurally below rather
        # than silently retrying if returned text differs.
        if layout_structure(actual['__Renderings']) != layout_structure(fields['__Renderings']):
            raise RuntimeError('Post-write layout or parameters differ; inspect rollback journal')
        if actual.get('__Final Renderings'):
            raise RuntimeError('Unexpected final renderings after write')
        for key,value in fields.items():
            if key != '__Renderings' and actual.get(key)!=value:
                raise RuntimeError('Post-write binding differs; inspect rollback journal')
    print('Activated scoped layouts. No publish performed. Rollback journal:',record)

if __name__=='__main__':main()
