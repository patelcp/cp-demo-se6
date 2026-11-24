"""Exact compare-guarded eight summaries, one new CS variant and eight interior-layout refinements."""
import argparse,base64,hashlib,json,os,time,uuid,xml.etree.ElementTree as ET
from urllib.parse import parse_qsl,urlencode
from pathlib import Path
from sitecore_transport import make_graphql
ROOT=Path(__file__).resolve().parents[4]
PLAN_SHA256='fddd55edc1981405a8a408fad55f1f0d7847e1106db3d882b0c59d1bd4e69b53'
def norm(v):return uuid.UUID(v).hex
def canonical(s):
 if not s:return ''
 def node(x):return(x.tag,tuple(sorted(x.attrib.items())),tuple(node(y) for y in x))
 return node(ET.fromstring(s))
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');args=p.parse_args();raw=(ROOT/'docs/demos/aglc/interior-polish-plan.json').read_bytes()
 if hashlib.sha256(raw).hexdigest()!=PLAN_SHA256:raise RuntimeError('Reviewed plan changed')
 plan=json.loads(raw)
 if len(plan['summaries'])!=8 or len(plan['layouts'])!=8 or sum(x['kind']=='cs-topic-band' for x in plan['layouts'])!=5:raise RuntimeError('Unexpected polish scope')
 if not args.apply:print('Plan only:8Summary fields,1CS TopicBand variant,5CS+3AGLC layouts. Noauth/network/writes.');return
 log=Path('/tmp/aglc-interior-polish-journal.json')
 if log.exists():raise RuntimeError('Existing journal: reconcile, no rerun')
 a=json.loads(Path(os.environ.get('SITECORE_CLI_AUTH',str(ROOT/'.sitecore/user.json'))).read_text());claims=json.loads(base64.urlsafe_b64decode(a['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
 if claims['iat']<1794610965 or claims['exp']<=time.time():raise RuntimeError('New unexpired session required')
 g=make_graphql(a);mp=ROOT/'docs/demos/aglc/native-manifest.json';m=json.loads(mp.read_text());record={'planHash':PLAN_SHA256,'created':None,'updates':[],'intent':None}
 q='query($p:String!){item(where:{path:$p,database:"master"}){itemId template{templateId} fields(ownFields:false){nodes{name value}}}}'
 def read(path):return g(q,{'p':path})['item']
 def check(path,id,expected):
  i=read(path)
  if not i or norm(i['itemId'])!=norm(id):raise RuntimeError('Identity changed')
  f={v['name']:v['value'] for v in i['fields']['nodes']}
  for k,v in expected.items():
   equal=canonical(f.get(k,''))==canonical(v) if k in ['__Renderings','__Final Renderings'] else f.get(k,'')==v
   if not equal:raise RuntimeError('Authored field changed: '+path+' '+k)
 def save():log.write_text(json.dumps(record,indent=2)+'\n');log.chmod(0o600)
 v=plan['variant'];parent=read(v['parentPath'])
 if not parent or norm(parent['itemId'])!=norm(v['parentId']) or read(v['path']):raise RuntimeError('Variant scope changed')
 for x in plan['summaries']:check(x['path'],x['id'],{'Summary':x['old']})
 for x in plan['layouts']:check(x['path'],x['id'],x['old'])
 record['intent']={'create':v};save()
 result=g('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':'TopicBand','parent':v['parentId'],'templateId':v['templateId']}})['createItem']['item'];current=read(v['path'])
 if not current or norm(current['itemId'])!=norm(result['itemId']) or norm(current['template']['templateId'])!=norm(v['templateId']):raise RuntimeError('New variant readback differs')
 record['created']={'path':v['path'],'id':result['itemId'],'templateId':v['templateId']};record['intent']=None;save();m['items'][v['path']]=result['itemId'];m['components']['CallToAction'].setdefault('namedVariants',{}).setdefault('cannabissense',{})['TopicBand']=result['itemId'];mp.write_text(json.dumps(m,indent=2)+'\n')
 def update(path,id,old,new):
  check(path,id,old);op={'path':path,'id':id,'old':old,'new':new};record['intent']=op;save()
  g('mutation($i:UpdateItemInput!){updateItem(input:$i){item{itemId}}}',{'i':{'database':'master','itemId':id,'fields':[{'name':k,'value':v} for k,v in new.items()]}})
  check(path,id,new);record['updates'].append(op);record['intent']=None;save()
 for x in plan['summaries']:update(x['path'],x['id'],{'Summary':x['old']},{'Summary':x['new']})
 for x in plan['layouts']:
  root=ET.fromstring(x['old']['__Renderings']);devices=list(root)
  if len(devices)!=1:raise RuntimeError('Unexpected device count')
  changed=0
  for rendering in list(devices[0]):
   if x['kind']=='cs-topic-band' and norm(rendering.attrib['id'])==norm(m['components']['CallToAction']['renderingId']):
    params=parse_qsl(rendering.attrib['par'],keep_blank_values=True)
    if len([k for k,v in params if k=='FieldNames'])!=1:raise RuntimeError('Unexpected variant params')
    rendering.set('par',urlencode([(k,'{'+str(uuid.UUID(result['itemId'])).upper()+'}' if k=='FieldNames' else v) for k,v in params]));changed+=1
   elif x['kind']=='aglc-remove-breadcrumb' and norm(rendering.attrib['id'])==norm(m['components']['Breadcrumb']['renderingId']):devices[0].remove(rendering);changed+=1
  if changed!=(2 if x['kind']=='cs-topic-band' else 1):raise RuntimeError('Unexpected placement changes')
  update(x['path'],x['id'],x['old'],{'__Renderings':ET.tostring(root,encoding='unicode')})
 record['complete']=True;save();print('Exact polish updates verified; no publication')
if __name__=='__main__':main()
