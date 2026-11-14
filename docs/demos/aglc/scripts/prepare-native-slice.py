"""Create-only native definitions. No layout activation, publication, or existing-item overwrite."""
import argparse

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply",action="store_true",help="Explicitly permit scoped create-only CMS writes")
    args=parser.parse_args()
    if not args.apply:
        parser.error("No changes made. Use --apply and set SITECORE_CLI_AUTH to the authorized existing CLI auth file.")
    import json, os
    from sitecore_transport import make_graphql
    from pathlib import Path
    ROOT=Path(__file__).resolve().parents[4]
    auth=Path(os.environ['SITECORE_CLI_AUTH'])
    a=json.loads(auth.read_text())
    gql=make_graphql(a)
    manifest_path=ROOT/'docs/demos/aglc/native-manifest.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'phase':'definitions only; Home not activated','items':{},'components':{}}
    created_in_run=set()
    manifest.setdefault('items',{})
    manifest.setdefault('components',{})
    def read(path):
     return gql('query($path:String!){item(where:{path:$path,database:"master"}){itemId path template{templateId}}}',{'path':path})['item']
    def save():manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    def ensure(path,template,fields=None):
     i=read(path)
     if i:
      if i['template']['templateId'].replace('-','').lower()!=template.replace('-','').strip('{}').lower():raise RuntimeError('Template mismatch '+path)
     else:
      parent,name=path.rsplit('/',1);p=read(parent)
      if not p:raise RuntimeError('Missing parent '+parent)
      v={'database':'master','language':'en','name':name,'parent':p['itemId'],'templateId':template,'fields':[{'name':k,'value':str(v)} for k,v in (fields or {}).items()]}
      i=gql('mutation($input:CreateItemInput!){createItem(input:$input){item{itemId path}}}',{'input':v})['createItem']['item']
      created_in_run.add(path)
      print('created',path,flush=True)
     manifest['items'][path]=i['itemId'];save();return i['itemId']
    FOLDER='a87a00b1-e6db-45ab-8b54-636fec3b5523';TFOLDER='0437fee2-44c9-46a6-abe9-28858d9fee8c';TEMPLATE='ab86861a-6030-46c5-b394-e8f99e8b87db';SECTION='e269fbb5-3750-427a-9149-7aa950b49301';FIELD='455a3e98-a627-4b40-8035-e683a0331ac7'
    base='/sitecore/templates/Project/AGLC/Components';ensure(base,TFOLDER)
    contracts={
     'Navigation Link':{'Title':'Single-Line Text','Link':'General Link'},
     'Card':{'Title':'Single-Line Text','Summary':'Rich Text','Image':'Image','Link':'General Link'},
     'SiteHeader':{'BrandName':'Single-Line Text','Logo':'Image','HomeLink':'General Link'},
     'SiteFooter':{'BrandName':'Single-Line Text','Description':'Rich Text','Copyright':'Single-Line Text'},
     'Hero':{'Eyebrow':'Single-Line Text','Title':'Single-Line Text','Summary':'Rich Text','Image':'Image','PrimaryLink':'General Link','SecondaryLink':'General Link'},
     'CardGrid':{'Heading':'Single-Line Text','Intro':'Rich Text'},
     'CallToAction':{'Title':'Single-Line Text','Body':'Rich Text','Link':'General Link'}}
    for name,fields in contracts.items():
     tid=ensure(base+'/'+name,TEMPLATE,{'__Base template':'{1930BBEB-7805-471A-A3BE-4858AC7CF696}','__Icon':'Office/32x32/document_text.png'})
     ensure(base+'/'+name+'/Content',SECTION)
     for ix,(field,typ) in enumerate(fields.items()):ensure(base+'/'+name+'/Content/'+field,FIELD,{'Type':typ,'__Sortorder':str((ix+1)*100)})
     # Standard values are intentionally insert-options only, no copied customer content.
     child='Navigation Link' if name in ['SiteHeader','SiteFooter'] else 'Card' if name=='CardGrid' else None
     ensure(base+'/'+name+'/__Standard Values',tid,{'__Masters':manifest['items'].get(base+'/'+child,'')} if child else {})
     # Link the owned template to its newly created standard values using supported update.
     vals=manifest['items'][base+'/'+name+'/__Standard Values']
     current=gql('query($path:String!){item(where:{path:$path,database:"master"}){fields{nodes{name value}}}}',{'path':base+'/'+name})['item']
     binding=next((f['value'] for f in current['fields']['nodes'] if f['name']=='__Standard values'),'')
     norm=lambda v:v.replace('-','').strip('{}').lower()
     if norm(binding)!=norm(vals):
      if base+'/'+name not in created_in_run or binding:raise RuntimeError('Refusing to overwrite standard-values binding '+base+'/'+name)
      gql('mutation($input:UpdateItemInput!){updateItem(input:$input){item{itemId}}}',{'input':{'database':'master','itemId':tid,'fields':[{'name':'__Standard values','value':vals}]}})
    param=ensure(base+'/Rendering Parameters',TEMPLATE,{'__Base template':'{4247AAD4-EBDE-4994-998F-E067A51B1FE4}|{5C74E985-E055-43FF-B28C-DB6C6A6450A2}|{44A022DB-56D3-419A-B43B-E27E4D8E9C41}|{3DB3EB10-F8D0-4CC9-BE26-18CE7B139EC8}'})
    rbase='/sitecore/layout/Renderings/Project/AGLC/Shared Experience';ensure(rbase,FOLDER)
    for name in ['SiteHeader','SiteFooter','Hero','CardGrid','CallToAction']:
     child='Navigation Link' if name in ['SiteHeader','SiteFooter'] else 'Card' if name=='CardGrid' else None
     fragment=' '.join(f'{f}: field(name: "{f}") {{ jsonValue }}' for f in contracts[name])
     if child:fragment+=' children { results { id '+' '.join(f'{f}: field(name: "{f}") {{ jsonValue }}' for f in contracts[child])+' } }'
     query='query '+name+'($datasource: String!, $language: String!) { datasource: item(path: $datasource, language: $language) { '+fragment+' } }'
     rid=ensure(rbase+'/'+name,'04646a89-996f-4ee7-878a-ffdbf1f0ef0d',{'componentName':name,'ComponentQuery':query,'Datasource Template':base+'/'+name,'Datasource Location':'query:./Data','Parameters Template':param,'Editable':'1','Enable Datasource Query':'1','__Icon':'Office/32x32/document_text.png','__Display name':{'SiteHeader':'Site header','SiteFooter':'Site footer','CardGrid':'Card grid','CallToAction':'Call to action'}.get(name,name)})
     manifest['components'][name]={'renderingId':rid,'templateId':manifest['items'][base+'/'+name],'fields':contracts[name],'childTemplateId':manifest['items'][base+'/'+child] if child else None,'query':query,'ownership':'shared site partial' if name in ['SiteHeader','SiteFooter'] else 'page-local Data'};save()
    for site in ['aglc','cannabissense']:
     for name in manifest['components']:
      vp=f'/sitecore/content/aglc/{site}/Presentation/Headless Variants/{name}'
      ensure(vp,'49c111d0-6867-4798-a724-1f103166e6e9')
      vid=ensure(vp+'/Default','4d50cdae-c2d9-4de8-b080-8f992bfb1b55')
      manifest['components'][name].setdefault('variants',{})[site]=vid;save()
    print('Definitions complete; no Home layout activation or publication.')

if __name__ == "__main__":
    main()
