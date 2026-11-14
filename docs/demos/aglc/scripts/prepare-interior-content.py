"""Create the nine reviewed pages and local content only. No layout, navigation update or publication."""
import argparse,base64,hashlib,html,json,os,time,uuid
from pathlib import Path
from sitecore_transport import make_graphql
ROOT=Path(__file__).resolve().parents[4]
PLAN_SHA256='89e295117224537f45dd94d6763ed4b7a430d89f53e5f484493ea87cea44daba'
SCOPE={'aglc':{'gaming','liquor','cannabis','forms'},'cannabissense':{'basics','moderation','health-effects','use-legally','resources'}}
def norm(v):return uuid.UUID(v).hex

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--journal',default='/tmp/aglc-interior-content-journal.json');args=p.parse_args()
 raw=(ROOT/'docs/demos/aglc/interior-content-plan.json').read_bytes()
 if hashlib.sha256(raw).hexdigest()!=PLAN_SHA256:raise RuntimeError('Reviewed plan changed')
 plan=json.loads(raw);pages=plan['pages']
 if len(pages)!=9 or {(x['site'],x['slug']) for x in pages}!={(s,n) for s,v in SCOPE.items() for n in v}:raise RuntimeError('Unexpected page scope')
 for page in pages:
  if page['path']!='/sitecore/content/aglc/'+page['site']+'/Home/'+page['slug'] or norm(page['pageTemplateId'])!='95902259996f4932980acdac2de84b0a':raise RuntimeError('Unexpected path/template')
  paths=[x['path'] for x in page['items']]
  if len(set(paths))!=len(paths) or any(not x.startswith(page['path']+'/Data/') for x in paths):raise RuntimeError('Unexpected local content path')
 if not args.apply:print('Reviewed nine new pages, nine Data folders and 118 local items; no credentials/network/writes');return
 journal=Path(args.journal)
 if journal.exists():raise RuntimeError('Existing journal: reconcile, no blind rerun')
 if ROOT in journal.resolve().parents:raise RuntimeError('Journal must stay outside repository')
 a=json.loads(Path(os.environ.get('SITECORE_CLI_AUTH',str(ROOT/'.sitecore/user.json'))).read_text());c=json.loads(base64.urlsafe_b64decode(a['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
 if c['iat']<1794610965 or c['exp']<=time.time():raise RuntimeError('New unexpired session required')
 g=make_graphql(a);mp=ROOT/'docs/demos/aglc/native-manifest.json';m=json.loads(mp.read_text());state={'planHash':PLAN_SHA256,'created':[],'pageBaselines':{},'intent':None}
 q='query($p:String!){item(where:{path:$p,database:"master"}){itemId path template{templateId} fields(ownFields:false){nodes{name value}}}}'
 def read(path):return g(q,{'p':path})['item']
 def save():journal.write_text(json.dumps(state,indent=2)+'\n');journal.chmod(0o600);mp.write_text(json.dumps(m,indent=2)+'\n')
 for site in SCOPE:
  home='/sitecore/content/aglc/'+site+'/Home';i=read(home)
  if not i or norm(i['itemId'])!=norm(m['sites'][site]['homeId']):raise RuntimeError('Home parent identity changed')
  m['items'][home]=i['itemId']
 for page in pages:
  if read(page['path']):raise RuntimeError('Existing page preserved: '+page['path'])
 def resolve(value):
  if isinstance(value,str):return value
  if set(value)!={'internalPath','text'} or value['internalPath'] not in m['items']:raise RuntimeError('Unresolved internal link')
  return '<link linktype="internal" id="{'+str(uuid.UUID(m['items'][value['internalPath']])).upper()+'}" text="'+html.escape(value['text'],quote=True)+'" />'
 def create(path,template,fields):
  if read(path):raise RuntimeError('Item appeared; preserve it')
  parent,name=path.rsplit('/',1);parentitem=read(parent)
  if not parentitem or norm(parentitem['itemId'])!=norm(m['items'][parent]):raise RuntimeError('Parent identity changed')
  resolved={k:resolve(v) for k,v in fields.items()};state['intent']={'path':path,'fields':resolved};save()
  result=g('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','parent':parentitem['itemId'],'name':name,'templateId':template,'fields':[{'name':k,'value':v} for k,v in resolved.items()]}})['createItem']['item']
  i=read(path);values={f['name']:f['value'] for f in i['fields']['nodes']} if i else {}
  if not i or norm(i['itemId'])!=norm(result['itemId']) or norm(i['template']['templateId'])!=norm(template) or any(values.get(k,'')!=v for k,v in resolved.items()):raise RuntimeError('New item readback differs')
  m['items'][path]=i['itemId'];state['created'].append({'path':path,'id':i['itemId'],'templateId':template,'fields':resolved});state['intent']=None;save();return values
 save()
 # Establish all page IDs before resolving cross-page internal links.
 for page in pages:
  values=create(page['path'],page['pageTemplateId'],{'Title':page['title'],'__Display name':page['title']})
  state['pageBaselines'][page['path']]={k:values.get(k,'') for k in ['__Renderings','__Final Renderings','Page Design']};save()
  create(page['path']+'/Data','1c82e550ebcd4e5d8abdd50d0809541e',{})
 for page in pages:
  for op in page['items']:create(op['path'],op['templateId'],op['fields'])
  m['sites'][page['site']].setdefault('interiorPages',{})[page['slug']]={'id':m['items'][page['path']],'path':page['path'],'sourceUrl':page['sourceUrl'],'state':'content created; layout not activated'};save()
 state['complete']=True;save();print('Created and verified nine pages and their local content; no layouts activated or published')
if __name__=='__main__':main()
