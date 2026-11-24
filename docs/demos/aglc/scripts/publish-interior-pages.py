"""Publish only reviewed exact interior dependencies and pages after complete live preflight."""
import argparse,base64,hashlib,json,os,time,uuid,xml.etree.ElementTree as ET
from pathlib import Path
from sitecore_transport import make_graphql
ROOT=Path(__file__).resolve().parents[4]
PLAN_SHA256='5819c1658e7e118bdd52f9db16d4f67ae971b009c56d0ff37c928b233888e63e'
def norm(v):return uuid.UUID(v).hex

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--publish',action='store_true');args=p.parse_args();raw=(ROOT/'docs/demos/aglc/interior-publication-plan.json').read_bytes()
 if hashlib.sha256(raw).hexdigest()!=PLAN_SHA256:raise RuntimeError('Reviewed inventory changed')
 plan=json.loads(raw);deps=plan['dependencies'];pages=plan['pages'];allitems=deps+pages
 if len(deps)!=221 or len(pages)!=11 or len({norm(x['id']) for x in allitems})!=232:raise RuntimeError('Exact counts/identity partition required')
 if not args.publish:print('Exact221dependencies SMART then11pages FULL; en/Edge, descendants=false,related=false. Noauth/network.');return
 journal=Path('/tmp/aglc-interior-publication-journal.json')
 if journal.exists():raise RuntimeError('Existing intent journal: reconcile, never resubmit blindly')
 if not json.loads(Path('/tmp/aglc-interior-activation-journal.json').read_text()).get('complete'):raise RuntimeError('Activation incomplete')
 a=json.loads(Path(os.environ.get('SITECORE_CLI_AUTH',str(ROOT/'.sitecore/user.json'))).read_text());claims=json.loads(base64.urlsafe_b64decode(a['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
 if claims['iat']<1794610965 or claims['exp']<=time.time():raise RuntimeError('New unexpired session required')
 g=make_graphql(a)
 def canonical(value):
  if not value:return ''
  def node(x):return(x.tag,tuple(sorted(x.attrib.items())),tuple(node(y) for y in x))
  return node(ET.fromstring(value))
 def preflight(items):
  for offset in range(0,len(items),8):
   batch=items[offset:offset+8];variables={'p'+str(n):x['path'] for n,x in enumerate(batch)}
   declarations=','.join('$'+k+':String!' for k in variables)
   fields='itemId template{templateId} fields(ownFields:false){nodes{name value}} children(first:100,includeHiddenItems:true){nodes{itemId} pageInfo{hasNextPage}}'
   selections=' '.join('n'+str(n)+':item(where:{path:$p'+str(n)+',database:"master"}){'+fields+'}' for n in range(len(batch)))
   result=g('query('+declarations+'){'+selections+'}',variables)
   for n,expected in enumerate(batch):
    current=result['n'+str(n)]
    if not current or norm(current['itemId'])!=norm(expected['id']):raise RuntimeError('Publication identity changed: '+expected['path'])
    if 'templateId' in expected and norm(current['template']['templateId'])!=norm(expected['templateId']):raise RuntimeError('Publication template changed')
    values={x['name']:x['value'] for x in current['fields']['nodes']}
    for key,value in expected['expected'].items():
     actual=values.get(key,'')
     if key in ['__Renderings','__Final Renderings']:equal=canonical(actual)==canonical(value)
     elif key=='ComponentQuery':equal=actual.strip()==value.strip()
     elif expected.get('reason')=='existing owned datasource ancestor' and key in ['Image','Logo','HomeLink','BackgroundImage','BackgroundVideo','PrimaryLink','SecondaryLink','SearchAction']:equal=canonical(actual.strip())==canonical(value.strip())
     else:equal=actual==value
     if not equal:raise RuntimeError('Publication field changed: '+expected['path']+' field '+key)
    children=current['children']
    if children['pageInfo']['hasNextPage'] or sorted(norm(x['itemId']) for x in children['nodes'])!=expected['expectedChildren']:raise RuntimeError('Unreviewed child inventory: '+expected['path'])
 preflight(allitems);records=[]
 def save():journal.write_text(json.dumps(records,indent=2)+'\n');journal.chmod(0o600)
 for name,items,mode in [('dependencies',deps,'SMART'),('pages',pages,'FULL')]:
  preflight(allitems)
  payload={'sourceDatabase':'master','targetDatabases':['experienceedge'],'rootItemIds':[x['id'] for x in items],'publishSubItems':False,'publishRelatedItems':False,'publishItemMode':mode,'languages':['en']}
  record={'batch':name,'planHash':PLAN_SHA256,'payload':payload,'operationId':None,'statuses':[]};records.append(record);save()
  op=g('mutation($i:PublishItemInput!){publishItem(input:$i){operationId}}',{'i':payload})['publishItem']['operationId'];record['operationId']=op;save()
  if not op:raise RuntimeError('Unknown submission outcome; no retry')
  print('Submitted',name,op,flush=True)
  for attempt in range(240):
   status=g('query($id:String!){publishingStatus(publishingOperationId:$id){isDone isFailed processed state}}',{'id':op})['publishingStatus'];record['statuses'].append(status);save()
   if not status or status['isFailed']:raise RuntimeError('Publication failed/status unavailable; stop')
   if status['isDone']:
    if status['state']!='FINISHED':raise RuntimeError('Unexpected terminal state')
    print('Completed',name,status,flush=True);break
   time.sleep(5)
  else:raise RuntimeError('Pending operation; poll existing ID, do not resubmit')
if __name__=='__main__':main()
