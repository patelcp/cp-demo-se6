"""Upload a reviewed local image inventory into two owned media folders only."""
import argparse,base64,datetime,hashlib,json,os,re,uuid
from pathlib import Path
import xml.etree.ElementTree as ET
from sitecore_transport import make_graphql,make_media_uploader

FOLDER_TEMPLATE='fe5dd82648c6436db87a7c4210c7413b'

def validate_image(data,mime):
    if mime=='image/jpeg' and data.startswith(b'\xff\xd8\xff'):return
    if mime=='image/png' and data.startswith(b'\x89PNG\r\n\x1a\n'):return
    if mime=='image/webp' and data[:4]==b'RIFF' and data[8:12]==b'WEBP':return
    if mime!='image/svg+xml':raise ValueError('Unsupported image signature')
    text=data.decode('utf-8-sig')
    if re.search(r'<!DOCTYPE|<!ENTITY',text,re.I):raise ValueError('SVG declarations forbidden')
    root=ET.fromstring(text)
    if root.tag.rsplit('}',1)[-1]!='svg':raise ValueError('Not SVG')
    for node in root.iter():
        name=node.tag.rsplit('}',1)[-1].lower()
        if name in ('script','foreignobject','image','iframe','object','embed','animate','animatetransform','set'):
            raise ValueError('Active or embedded SVG content forbidden')
        for key,value in node.attrib.items():
            key=key.rsplit('}',1)[-1].lower()
            if key.startswith('on') or key in ('src',):raise ValueError('Active SVG attribute forbidden')
            if key=='href' and not value.startswith('#'):raise ValueError('External SVG reference forbidden')
            if (key=='style' and chr(92) in value) or re.search(r'url\s*\(\s*[\x27\"]?(?!#)|javascript\s*:|@import',value,re.I):raise ValueError('External SVG style forbidden')
        if name=='style' and (chr(92) in (node.text or '') or re.search(r'url\s*\(|@import|javascript\s*:',node.text or '',re.I)):raise ValueError('SVG CSS fetch forbidden')

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--inventory',type=Path,required=True);p.add_argument('--journal',type=Path,required=True);p.add_argument('--apply',action='store_true');args=p.parse_args()
    inventory=json.loads(args.inventory.read_text());assets=inventory['assets'];seen=set()
    root=Path(__file__).resolve().parents[4]
    if root==args.journal.resolve() or root in args.journal.resolve().parents:raise RuntimeError('Journal must be outside repository')
    for asset in assets:
        if asset['site'] not in ('aglc','cannabissense'):raise RuntimeError('Unexpected site')
        expected='Project/aglc/'+asset['site']+'/InteriorPages/'+asset['name']
        if asset['itemPath']!=expected or not re.fullmatch(r'[a-z0-9-]+',asset['name']) or expected in seen:raise RuntimeError('Unexpected asset path')
        seen.add(expected);data=Path(asset['localPath']).read_bytes()
        if hashlib.sha256(data).hexdigest()!=asset['sha256']:raise RuntimeError('Reviewed asset changed')
        validate_image(data,asset['mime'])
    if not args.apply:
        print('Validated',len(assets),'local assets; no credential reads/network/uploads');return
    if args.journal.exists():raise RuntimeError('Existing journal: reconcile, never blindly retry')
    auth=json.loads(Path(os.environ['SITECORE_CLI_AUTH']).read_text());claims=json.loads(base64.urlsafe_b64decode(auth['endpoints']['xmCloud']['accessToken'].split('.')[1]+'=='))
    if claims['iat']<1794610965 or claims['exp']<=datetime.datetime.now(datetime.timezone.utc).timestamp():raise RuntimeError('Require fresh authorized session')
    gql=make_graphql(auth);upload=make_media_uploader(auth)
    def read(path):return gql('query($p:String!){item(where:{path:$p,database:"master"}){itemId path template{templateId}}}',{'p':path})['item']
    folders={site:'/sitecore/media library/Project/aglc/'+site+'/InteriorPages' for site in {a['site'] for a in assets}}
    for path in folders.values():
        if read(path):raise RuntimeError('Expected new owned media folder; reconcile existing')
    for asset in assets:
        if read('/sitecore/media library/'+asset['itemPath']):raise RuntimeError('Asset already exists; no overwrite')
    journal={'assets':[],'folders':[]};args.journal.parent.mkdir(parents=True,exist_ok=True)
    def save():args.journal.write_text(json.dumps(journal,indent=2)+'\n');args.journal.chmod(0o600)
    save()
    for site,path in folders.items():
        parent=read(path.rsplit('/',1)[0])
        result=gql('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':'InteriorPages','parent':parent['itemId'],'templateId':FOLDER_TEMPLATE}})
        journal['folders'].append({'path':path,'itemId':result['createItem']['item']['itemId']});save()
    for asset in assets:
        data=Path(asset['localPath']).read_bytes()
        if hashlib.sha256(data).hexdigest()!=asset['sha256']:raise RuntimeError('Asset changed before upload')
        if read('/sitecore/media library/'+asset['itemPath']):raise RuntimeError('New existing asset; refusing overwrite')
        record={'path':'/sitecore/media library/'+asset['itemPath'],'state':'upload-intent','sha256':asset['sha256']};journal['assets'].append(record);save()
        signed=gql('mutation($i:UploadMediaInput!){uploadMedia(input:$i){presignedUploadUrl}}',{'i':{'database':'master','language':'en','itemPath':asset['itemPath'],'alt':asset['alt'],'overwriteExisting':False,'versioned':False,'includeExtensionInItemName':False}})['uploadMedia']['presignedUploadUrl']
        upload(signed,filename=Path(asset['localPath']).name,content=data,content_type=asset['mime'])
        item=read(record['path'])
        if not item:raise RuntimeError('Upload unverified; reconcile intent journal')
        record.update({'state':'verified','itemId':item['itemId']});save();print('Verified native media:',record['path'],flush=True)
    print('Upload complete. No content binding or publication performed.')
if __name__=='__main__':main()
