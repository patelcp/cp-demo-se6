"""Add only the agreed optional fields and extend owned rendering queries."""
import argparse,base64,datetime,json,os,uuid
from pathlib import Path
from sitecore_transport import make_graphql

EXTRA={
 'Navigation Link':{'Group':'Single-Line Text','Logo':'Image'},
 'SiteHeader':{'SearchAction':'General Link','SearchLabel':'Single-Line Text','SearchQueryName':'Single-Line Text'},
 'Hero':{'BackgroundImage':'Image','BackgroundVideo':'General Link','SearchAction':'General Link','SearchLabel':'Single-Line Text','SearchQueryName':'Single-Line Text'},
 'CallToAction':{'Image':'Image'},'SiteFooter':{'Logo':'Image'},
}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--journal',type=Path,required=True);args=p.parse_args()
 if not args.apply:print('Plan:12 optional native fields;5 rendering queries;Hero navigation insert option. No network.');return
 root=Path(__file__).resolve().parents[4];mp=root/'docs/demos/aglc/native-manifest.json';m=json.loads(mp.read_text())
 if root in args.journal.resolve().parents or args.journal.exists():raise RuntimeError('Require new external journal')
 a=json.loads(Path(os.environ['SITECORE_CLI_AUTH']).read_text());c=json.loads(base64.urlsafe_b64decode(a['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
 if c['iat']<1794610965 or c['exp']<=datetime.datetime.now(datetime.timezone.utc).timestamp():raise RuntimeError('Require new unexpired session')
 g=make_graphql(a);base='/sitecore/templates/Project/AGLC/Components'
 def read(path):return g('query($p:String!){item(where:{path:$p,database:"master"}){itemId fields(ownFields:false){nodes{name value}}}}',{'p':path})['item']
 def field(item,name):return next((f['value'] for f in item['fields']['nodes'] if f['name']==name),'')
 changes=[];creates=[]
 if set(m['components'])!={'SiteHeader','SiteFooter','Hero','CardGrid','CallToAction'}:raise RuntimeError('Unexpected rendering scope')
 for name,fields in EXTRA.items():
  parent=read(base+'/'+name+'/Content')
  if not parent or parent['itemId']!=m['items'][base+'/'+name+'/Content']:raise RuntimeError('Template section identity differs')
  for key,typ in fields.items():
   path=base+'/'+name+'/Content/'+key
   if read(path):raise RuntimeError('Optional field already exists; reconcile')
   creates.append({'path':path,'parent':parent['itemId'],'name':key,'type':typ})
 for name,component in m['components'].items():
  path='/sitecore/layout/Renderings/Project/AGLC/Shared Experience/'+name;i=read(path)
  if not i or i['itemId']!=component['renderingId'] or field(i,'ComponentQuery')!=component['query']:raise RuntimeError('Query changed since baseline')
  fields={**component['fields'],**EXTRA.get(name,{})}
  frag=' '.join(f'{f}: field(name: "{f}") {{ jsonValue }}' for f in fields)
  if name in ('SiteHeader','SiteFooter','Hero'):
   frag+=' children { results { id '+' '.join(f'{f}: field(name: "{f}") {{ jsonValue }}' for f in ['Title','Link','Group','Logo'])+' } }'
  elif name=='CardGrid':frag+=' children { results { id '+' '.join(f'{f}: field(name: "{f}") {{ jsonValue }}' for f in ['Title','Summary','Image','Link'])+' } }'
  query='query '+name+'($datasource: String!, $language: String!) { datasource: item(path: $datasource, language: $language) { '+frag+' } }'
  changes.append({'path':path,'id':i['itemId'],'field':'ComponentQuery','old':component['query'],'new':query,'component':name,'fields':fields})
 std=read(base+'/Hero/__Standard Values')
 if not std or std['itemId']!=m['items'][base+'/Hero/__Standard Values'] or field(std,'__Masters'):raise RuntimeError('Hero insert options changed; stop')
 changes.append({'path':base+'/Hero/__Standard Values','id':std['itemId'],'field':'__Masters','old':'','new':'{'+str(uuid.UUID(m['items'][base+'/Navigation Link'])).upper()+'}'})
 journal={'creates':creates,'changes':changes,'completed':[]}
 def save():args.journal.write_text(json.dumps(journal,indent=2)+'\n');args.journal.chmod(0o600)
 save()
 for op in creates:
  if read(op['path']):raise RuntimeError('Field appeared; stop')
  if read(op['path'].rsplit('/',1)[0])['itemId']!=op['parent']:raise RuntimeError('Field parent identity changed')
  i=g('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':op['name'],'parent':op['parent'],'templateId':'455a3e98-a627-4b40-8035-e683a0331ac7','fields':[{'name':'Type','value':op['type']},{'name':'__Sortorder','value':str(500+len(journal['completed'])*100)}]}})['createItem']['item']
  m['items'][op['path']]=i['itemId'];journal['completed'].append({'created':op['path'],'id':i['itemId']});save();mp.write_text(json.dumps(m,indent=2)+'\n')
 for op in changes:
  current=read(op['path'])
  if not current or current['itemId']!=op['id'] or field(current,op['field'])!=op['old']:raise RuntimeError('Field changed before update')
  g('mutation($i:UpdateItemInput!){updateItem(input:$i){item{itemId}}}',{'i':{'database':'master','itemId':op['id'],'fields':[{'name':op['field'],'value':op['new']}]}})
  if field(read(op['path']),op['field'])!=op['new']:raise RuntimeError('Update readback differs')
  journal['completed'].append({'updated':op['path'],'field':op['field']});save()
  if 'component' in op:m['components'][op['component']]['query']=op['new'];m['components'][op['component']]['fields']=op['fields']
 m['components']['Hero']['childTemplateId']=m['items'][base+'/Navigation Link'];mp.write_text(json.dumps(m,indent=2)+'\n')
 print('Agreed optional fields and owned queries updated/read back. No publication.')
if __name__=='__main__':main()
