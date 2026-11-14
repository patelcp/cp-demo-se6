"""Apply only a reviewed hash-bound new-page layout, navigation and site-local palette plan."""
import argparse,base64,hashlib,json,os,time,uuid,xml.etree.ElementTree as ET
from pathlib import Path
from sitecore_transport import make_graphql
ROOT=Path(__file__).resolve().parents[4]
PLAN_SHA256='86214c4c8756faf42528164717d80b4cf88483af48a97af5817b8e5a02b107f1'
def norm(v):return uuid.UUID(v).hex

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');args=p.parse_args();raw=(ROOT/'docs/demos/aglc/interior-activation-plan.json').read_bytes()
 if hashlib.sha256(raw).hexdigest()!=PLAN_SHA256:raise RuntimeError('Reviewed activation plan changed')
 plan=json.loads(raw)
 if len(plan['pages'])!=9 or len(plan['navigation'])!=12 or len(plan['palette'])!=4:raise RuntimeError('Exact activation scope differs')
 if any(not x['path'].startswith('/sitecore/content/aglc/') for group in plan.values() for x in group):raise RuntimeError('Outside demo scope')
 if not args.apply:print('Reviewed9new-page layouts,12Link fields,4site-local palette updates; no auth/network/writes');return
 log=Path('/tmp/aglc-interior-activation-journal.json')
 if log.exists():raise RuntimeError('Existing intent journal: reconcile, never rerun')
 a=json.loads(Path(os.environ.get('SITECORE_CLI_AUTH',str(ROOT/'.sitecore/user.json'))).read_text());c=json.loads(base64.urlsafe_b64decode(a['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
 if c['iat']<1794610965 or c['exp']<=time.time():raise RuntimeError('New unexpired session required')
 g=make_graphql(a);q='query($p:String!){item(where:{path:$p,database:"master"}){itemId fields(ownFields:false){nodes{name value}}}}';record={'planHash':PLAN_SHA256,'completed':[],'intent':None}
 def read(op):
  i=g(q,{'p':op['path']})['item']
  if not i or norm(i['itemId'])!=norm(op['id']):raise RuntimeError('Item identity changed')
  return {v['name']:v['value'] for v in i['fields']['nodes']}
 def canon(s):
  if not s:return ''
  def node(n):return(n.tag,tuple(sorted(n.attrib.items())),tuple(node(c) for c in n))
  return node(ET.fromstring(s))
 def check(op,expected):
  fields=read(op)
  for k,v in expected.items():
   if (canon(fields.get(k,''))!=canon(v)) if k in ['__Renderings','__Final Renderings'] else (fields.get(k,'')!=v):raise RuntimeError('Compared field changed at '+op['path'])
 def save():log.write_text(json.dumps(record,indent=2)+'\n');log.chmod(0o600)
 ops=plan['palette']+plan['pages']+plan['navigation']
 for op in ops:check(op,op['old'])
 save()
 for op in ops:
  check(op,op['old']);record['intent']=op;save()
  g('mutation($i:UpdateItemInput!){updateItem(input:$i){item{itemId}}}',{'i':{'database':'master','itemId':op['id'],'fields':[{'name':k,'value':v} for k,v in op['new'].items()]}})
  check(op,op['new']);record['completed'].append(op);record['intent']=None;save()
 record['complete']=True;save();print('Exact native activation readbacks verified; no publication')
if __name__=='__main__':main()
