"""Create only the reviewed interior component definitions; no page activation or publication."""
import argparse, base64, json, os, time, uuid
from pathlib import Path
from sitecore_transport import make_graphql
ROOT = Path(__file__).resolve().parents[4]
BASE = '/sitecore/templates/Project/AGLC/Components'
RENDERINGS = '/sitecore/layout/Renderings/Project/AGLC/Shared Experience'
CONTRACTS = {
    'ResourceItem': {'Title': 'Single-Line Text', 'Summary': 'Rich Text', 'Link': 'General Link', 'Category': 'Single-Line Text', 'DocumentType': 'Single-Line Text'},
    'Breadcrumb': {},
    'PageIntro': {'Title': 'Single-Line Text', 'Summary': 'Rich Text', 'Image': 'Image'},
    'ResourceList': {'Heading': 'Single-Line Text', 'Intro': 'Rich Text'},
    'RichTextSection': {'Heading': 'Single-Line Text', 'Body': 'Rich Text', 'Image': 'Image'},
}
VARIANTS = {'Breadcrumb': ['Default'], 'PageIntro': ['Default', 'ImageBanner'], 'ResourceList': ['Default', 'Documents'], 'RichTextSection': ['Default']}
TEMPLATE = 'ab86861a603046c5b394e8f99e8b87db'
SECTION = 'e269fbb53750427a91497aa950b49301'
FIELD = '455a3e98a6274b408035e683a0331ac7'
def norm(value): return uuid.UUID(value).hex

def query_for(name):
    children = ' children(first: 10) { results { id Fields: fields(ownFields: true) { name jsonValue } } }' if name == 'Breadcrumb' else ' children(first: 30) { results { id Fields: fields(ownFields: true) { name jsonValue } } }' if name == 'ResourceList' else ''
    return 'query '+name+'($datasource: String!, $language: String!) { datasource: item(path: $datasource, language: $language) { Fields: fields(ownFields: true) { name jsonValue }'+children+' } }'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--journal', default='/tmp/aglc-interior-definitions-journal.json')
    args = parser.parse_args()
    if not args.apply:
        print(json.dumps({'templates': list(CONTRACTS), 'renderings': list(VARIANTS), 'variants': VARIANTS, 'existingCardGridAdditions': ['ResourceTiles', 'SectorTiles'], 'writes': False}, indent=2)); return
    journal = Path(args.journal)
    if journal.exists(): raise RuntimeError('Existing operation journal: reconcile, never blindly retry')
    auth_path = Path(os.environ.get('SITECORE_CLI_AUTH', str(ROOT/'.sitecore/user.json')))
    auth = json.loads(auth_path.read_text())
    claims = json.loads(base64.urlsafe_b64decode(auth['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
    if claims['iat'] < 1794610965 or claims['exp'] <= time.time(): raise RuntimeError('New unexpired session required')
    gql = make_graphql(auth)
    mp = ROOT/'docs/demos/aglc/native-manifest.json'
    manifest = json.loads(mp.read_text())
    state = {'created': [], 'bindings': [], 'intent': None}
    read_query = 'query($p:String!){item(where:{path:$p,database:"master"}){itemId path template{templateId} fields(ownFields:false){nodes{name value}}}}'
    def read(path): return gql(read_query, {'p': path})['item']
    def checkpoint():
        journal.write_text(json.dumps(state, indent=2)+'\n'); journal.chmod(0o600)
        mp.write_text(json.dumps(manifest, indent=2)+'\n')
    # Verify every existing parent against the prior manifest before any write.
    parents = [BASE, RENDERINGS, BASE+'/Navigation Link', BASE+'/Rendering Parameters']
    parents += [f'/sitecore/content/aglc/{site}/Presentation/Headless Variants' for site in ['aglc','cannabissense']]
    parents += [f'/sitecore/content/aglc/{site}/Presentation/Headless Variants/CardGrid' for site in ['aglc','cannabissense']]
    known_variant_parents = {
        '/sitecore/content/aglc/aglc/Presentation/Headless Variants': '732b541ffdd74717930259e26a1c3927',
        '/sitecore/content/aglc/cannabissense/Presentation/Headless Variants': '2fcaf5d6128647579f6453fa9978c3d0',
    }
    for path in parents:
        item = read(path); expected = manifest['items'].get(path, known_variant_parents.get(path))
        if not item or not expected or norm(item['itemId']) != norm(expected): raise RuntimeError('Existing parent identity changed: '+path)
        manifest['items'][path] = item['itemId']
    new_roots = [BASE+'/'+name for name in CONTRACTS] + [RENDERINGS+'/'+name for name in VARIANTS]
    new_roots += [f'/sitecore/content/aglc/{site}/Presentation/Headless Variants/{name}' for site in ['aglc','cannabissense'] for name in VARIANTS]
    new_roots += [f'/sitecore/content/aglc/{site}/Presentation/Headless Variants/CardGrid/{name}' for site in ['aglc','cannabissense'] for name in ['ResourceTiles','SectorTiles']]
    for path in new_roots:
        if read(path): raise RuntimeError('Preserve pre-existing item at '+path)
    checkpoint()
    def create(path, template, fields=None):
        if read(path): raise RuntimeError('Item appeared; preserve it: '+path)
        parent, name = path.rsplit('/',1); parent_item = read(parent)
        if not parent_item or norm(parent_item['itemId']) != norm(manifest['items'][parent]): raise RuntimeError('Parent changed: '+parent)
        state['intent'] = {'action':'create','path':path}; checkpoint()
        item = gql('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}', {'i':{'database':'master','language':'en','name':name,'parent':parent_item['itemId'],'templateId':template,'fields':[{'name':key,'value':value} for key,value in (fields or {}).items()]}})['createItem']['item']
        current = read(path); values = {f['name']:f['value'] for f in current['fields']['nodes']} if current else {}
        if not current or norm(current['itemId']) != norm(item['itemId']) or norm(current['template']['templateId']) != norm(template) or any(values.get(k,'') != v for k,v in (fields or {}).items()): raise RuntimeError('Created item readback differs')
        manifest['items'][path] = item['itemId']; state['created'].append({'path':path,'id':item['itemId']}); state['intent']=None; checkpoint(); return item['itemId']
    for name, fields in CONTRACTS.items():
        path=BASE+'/'+name
        tid=create(path,TEMPLATE,{'__Base template':'{1930BBEB-7805-471A-A3BE-4858AC7CF696}','__Icon':'Office/32x32/document_text.png'})
        create(path+'/Content',SECTION)
        for index,(field,typ) in enumerate(fields.items()): create(path+'/Content/'+field,FIELD,{'Type':typ,'__Sortorder':str((index+1)*100)})
        child='Navigation Link' if name=='Breadcrumb' else 'ResourceItem' if name=='ResourceList' else None
        values={'__Masters':'{'+str(uuid.UUID(manifest['items'][BASE+'/'+child])).upper()+'}'} if child else {}
        standard=create(path+'/__Standard Values',tid,values)
        current=read(path); binding=next((f['value'] for f in current['fields']['nodes'] if f['name']=='__Standard values'),'')
        if norm(current['itemId']) != norm(tid) or binding: raise RuntimeError('Unexpected new template binding')
        state['intent']={'action':'bindStandardValues','path':path};checkpoint()
        gql('mutation($i:UpdateItemInput!){updateItem(input:$i){item{itemId}}}',{'i':{'database':'master','itemId':tid,'fields':[{'name':'__Standard values','value':'{'+str(uuid.UUID(standard)).upper()+'}'}]}})
        current=read(path);binding=next((f['value'] for f in current['fields']['nodes'] if f['name']=='__Standard values'),'')
        if norm(binding)!=norm(standard):raise RuntimeError('Standard binding readback differs')
        state['bindings'].append(path);state['intent']=None;checkpoint()
    for name in VARIANTS:
        rid=create(RENDERINGS+'/'+name,'04646a89996f4ee7878affdbf1f0ef0d',{'componentName':name,'ComponentQuery':query_for(name),'Datasource Template':BASE+'/'+name,'Datasource Location':'query:./Data','Editable':'1','Enable Datasource Query':'1','AddFieldEditorButton':'1','Parameters Template':manifest['items'][BASE+'/Rendering Parameters'],'__Icon':'Office/32x32/document_text.png','__Display name':{'Breadcrumb':'Breadcrumb','PageIntro':'Page introduction','ResourceList':'Resource list','RichTextSection':'Rich text section'}[name]})
        child='Navigation Link' if name=='Breadcrumb' else 'ResourceItem' if name=='ResourceList' else None
        manifest['components'][name]={'renderingId':rid,'templateId':manifest['items'][BASE+'/'+name],'fields':CONTRACTS[name],'childTemplateId':manifest['items'][BASE+'/'+child] if child else None,'query':query_for(name),'ownership':'page-local Data','variants':{}};checkpoint()
    for site in ['aglc','cannabissense']:
        for name, variants in VARIANTS.items():
            path=f'/sitecore/content/aglc/{site}/Presentation/Headless Variants/{name}'
            create(path,'49c111d068674798a7241f103166e6e9')
            for variant in variants:
                id=create(path+'/'+variant,'4d50cdaec2d94de8b0808f992bfb1b55')
                manifest['components'][name].setdefault('namedVariants',{}).setdefault(site,{})[variant]=id
                if variant=='Default':manifest['components'][name]['variants'][site]=id
                checkpoint()
        for variant in ['ResourceTiles','SectorTiles']:
            id=create(f'/sitecore/content/aglc/{site}/Presentation/Headless Variants/CardGrid/'+variant,'4d50cdaec2d94de8b0808f992bfb1b55')
            manifest['components']['CardGrid'].setdefault('namedVariants',{}).setdefault(site,{})[variant]=id;checkpoint()
    state['complete']=True;checkpoint();print('Interior definitions created and verified; no pages activated or published')

if __name__=='__main__':main()
