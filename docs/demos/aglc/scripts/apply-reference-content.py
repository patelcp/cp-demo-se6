"""Apply reviewed reference copy/media/nav, guarding every existing field."""
import argparse,base64,datetime,json,os,uuid,hashlib
from pathlib import Path
from xml.sax.saxutils import escape
from sitecore_transport import make_graphql

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');p.add_argument('--plan',type=Path,required=True);p.add_argument('--media-journal',type=Path,required=True);p.add_argument('--journal',type=Path,required=True);args=p.parse_args()
 raw=args.plan.read_bytes()
 if hashlib.sha256(raw).hexdigest()!='529f9a354c25c192e58c90edef397ca0fbf924a766dadfbf4a1cbbb92cb92cd7':raise RuntimeError('Plan differs from independent review')
 plan=json.loads(raw);root=Path(__file__).resolve().parents[4];mp=root/'docs/demos/aglc/native-manifest.json';manifest=json.loads(mp.read_text())
 if len(plan['updates'])!=31 or len(plan['creates'])!=36:raise RuntimeError('Unexpected reviewed plan scope')
 for op in plan['updates']+plan['creates']:
  if not any(op['path'].startswith('/sitecore/content/aglc/'+s+'/') for s in ('aglc','cannabissense')):raise RuntimeError('Outside approved sites')
  if '/Home/Data/' not in op['path'] and '/Presentation/Partial Designs/' not in op['path']:raise RuntimeError('Outside owned data scope')
 if not args.apply:print('Reviewed plan31 updates36 nav creates1 archived card; no credentials/network');return
 if args.journal.exists() or root in args.journal.resolve().parents:raise RuntimeError('Require new external journal')
 media=json.loads(args.media_journal.read_text());assetids={a['path'].split('/ReferenceRefresh/')[-1]:a['itemId'] for a in media['assets'] if a.get('state')=='verified'}
 def resolve(value):
  if isinstance(value,dict):
   if set(value)!= {'mediaKey'} or value['mediaKey'] not in assetids:raise RuntimeError('Unverified native media key')
   return '<image mediaid="{'+str(uuid.UUID(assetids[value['mediaKey']])).upper()+'}" />'
  return value
 for op in plan['updates']+plan['creates']:op['fields']={k:resolve(v) for k,v in op['fields'].items()}
 a=json.loads(Path(os.environ['SITECORE_CLI_AUTH']).read_text());c=json.loads(base64.urlsafe_b64decode(a['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
 if c['iat']<1794610965 or c['exp']<=datetime.datetime.now(datetime.timezone.utc).timestamp():raise RuntimeError('Require new unexpired session')
 g=make_graphql(a)
 def read(path):return g('query($p:String!){item(where:{path:$p,database:"master"}){itemId path template{templateId} fields(ownFields:false){nodes{name value}}}}',{'p':path})['item']
 def fields(item):return {f['name']:f['value'] for f in item['fields']['nodes']}
 def check(op):
  item=read(op['path'])
  if not item or item['itemId']!=op['id']:raise RuntimeError('Existing content identity changed')
  current=fields(item)
  if any(current.get(k,'')!=op['expected'].get(k,'') for k in op['fields']):raise RuntimeError('Existing field changed; refusing '+op['path'])
 for op in plan['updates']:check(op)
 for op in plan['creates']:
  if read(op['path']):raise RuntimeError('New nav path already exists')
 archive=plan['archive'];expected_archive='/sitecore/content/aglc/cannabissense/Home/Data/CardGrid/Find useful resources';target='/sitecore/content/aglc/cannabissense/Home/Data/Archived cards'
 if archive['path']!=expected_archive or archive['targetParentPath']!=target:raise RuntimeError('Unexpected archive scope')
 original=read(expected_archive)
 if original['itemId']!=archive['expectedItem']['itemId'] or fields(original)!=fields(archive['expectedItem']):raise RuntimeError('Archive card changed')
 if read(target):raise RuntimeError('Archive folder exists; reconcile')
 journal={'plan':plan,'completed':[]}
 def save():args.journal.write_text(json.dumps(journal,indent=2)+'\n');args.journal.chmod(0o600)
 save()
 for op in plan['updates']:
  check(op);g('mutation($i:UpdateItemInput!){updateItem(input:$i){item{itemId}}}',{'i':{'database':'master','itemId':op['id'],'fields':[{'name':k,'value':v} for k,v in op['fields'].items()]}})
  current=fields(read(op['path']))
  if any(current.get(k,'')!=v for k,v in op['fields'].items()):raise RuntimeError('Field readback differs')
  journal['completed'].append({'updated':op['path'],'id':op['id']});save()
 for op in plan['creates']:
  if read(op['path']):raise RuntimeError('Nav path appeared; stop')
  parent,name=op['path'].rsplit('/',1);parentitem=read(parent)
  if not parentitem or parentitem['itemId']!=manifest['items'][parent] or op['templateId']!=manifest['items']['/sitecore/templates/Project/AGLC/Components/Navigation Link']:raise RuntimeError('Navigation parent/template identity changed')
  item=g('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':name,'parent':parentitem['itemId'],'templateId':op['templateId'],'fields':[{'name':k,'value':v} for k,v in op['fields'].items()]}})['createItem']['item']
  current=fields(read(op['path']))
  if any(current.get(k,'')!=v for k,v in op['fields'].items()):raise RuntimeError('Created nav readback differs')
  manifest['items'][op['path']]=item['itemId'];journal['completed'].append({'created':op['path'],'id':item['itemId']});save();mp.write_text(json.dumps(manifest,indent=2)+'\n')
 original=read(expected_archive)
 if not original or original['itemId']!=archive['expectedItem']['itemId'] or fields(original)!=fields(archive['expectedItem']):raise RuntimeError('Archive card changed before move')
 parent=read(target.rsplit('/',1)[0])
 folder=g('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':'Archived cards','parent':parent['itemId'],'templateId':'a87a00b1-e6db-45ab-8b54-636fec3b5523'}})['createItem']['item']
 journal['completed'].append({'createdArchiveFolder':folder['itemId']});save()
 moved=g('mutation($i:MoveItemInput!){moveItem(input:$i){item{itemId path}}}',{'i':{'database':'master','itemId':original['itemId'],'targetParentId':folder['itemId']}})['moveItem']['item']
 if moved['itemId']!=original['itemId'] or moved['path']!=target+'/Find useful resources':raise RuntimeError('Archive move readback differs')
 manifest['items'].pop(expected_archive,None);manifest['items'][moved['path']]=moved['itemId'];manifest['items'][target]=folder['itemId'];journal['completed'].append({'archived':moved['path'],'id':moved['itemId']});save();mp.write_text(json.dumps(manifest,indent=2)+'\n')
 print('Reference content applied and read back; original item IDs preserved; no publishing.')
if __name__=='__main__':main()
