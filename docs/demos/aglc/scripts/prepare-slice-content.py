"""Create-only per-site editorial seed and isolated presentation settings. Never activates Home."""
import argparse,json,os,uuid
from sitecore_transport import make_graphql
from pathlib import Path
from xml.sax.saxutils import escape

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--apply',action='store_true');args=p.parse_args()
 if not args.apply:p.error('No changes made. Require --apply and SITECORE_CLI_AUTH.')
 root=Path(__file__).resolve().parents[4];mp=root/'docs/demos/aglc/native-manifest.json';m=json.loads(mp.read_text())
 a=json.loads(Path(os.environ['SITECORE_CLI_AUTH']).read_text());gql=make_graphql(a)
 def read(path):return gql('query($p:String!){item(where:{path:$p,database:"master"}){itemId template{templateId}}}',{'p':path})['item']
 def save():mp.write_text(json.dumps(m,indent=2)+'\n')
 def ensure(path,template,fields=None):
  i=read(path)
  if i:
   if i['template']['templateId'].replace('-','').lower()!=template.replace('-','').strip('{}').lower():raise RuntimeError('Unexpected existing template '+path)
  else:
   par,name=path.rsplit('/',1);parent=read(par)
   if not parent:raise RuntimeError('Missing parent '+par)
   i=gql('mutation($i:CreateItemInput!){createItem(input:$i){item{itemId}}}',{'i':{'database':'master','language':'en','name':name,'parent':parent['itemId'],'templateId':template,'fields':[{'name':k,'value':v} for k,v in (fields or {}).items()]}})['createItem']['item'];print('created',path,flush=True)
  m['items'][path]=i['itemId'];save();return i['itemId']
 def link(url,text):return '<link linktype="external" url="'+escape(url,{'"':'&quot;'})+'" text="'+escape(text,{'"':'&quot;'})+'" />'
 def internal(id,text):return '<link linktype="internal" id="{'+str(uuid.UUID(id)).upper()+'}" text="'+escape(text,{'"':'&quot;'})+'" />'
 specs={
 'aglc':{'brand':'AGLC','eyebrow':'Alberta Gaming, Liquor and Cannabis','title':'Find the information you need.','summary':'<p>Explore licensing information, forms and resources for Alberta’s gaming, liquor and cannabis sectors.</p>','primary':('https://aglc.ca/licensing','Explore licensing'),'secondary':('https://aglc.ca/forms','Find forms and documents'),'heading':'Start with what matters to you','intro':'<p>Choose a starting point to find official information and guidance.</p>','nav':[('Licensing','https://aglc.ca/licensing'),('Liquor','https://aglc.ca/liquor'),('Cannabis','https://aglc.ca/cannabis'),('Forms and documents','https://aglc.ca/forms')],'cards':[('Licensing','Find licensing information and guidance for your next step.','https://aglc.ca/licensing'),('Forms and documents','Browse official forms, policies and supporting documents.','https://aglc.ca/forms'),('Cannabis information','Explore Alberta’s cannabis regulation and information resources.','https://aglc.ca/cannabis')],'cta':('Looking for a form?','<p>Visit the official library to find the forms and documents relevant to your needs.</p>','https://aglc.ca/forms','Browse forms and documents'),'description':'<p>Alberta Gaming, Liquor and Cannabis information and resources.</p>'},
 'cannabissense':{'brand':'CannabisSense','eyebrow':'CannabisSense by AGLC','title':'Get informed. Make thoughtful choices.','summary':'<p>Explore cannabis basics, learn about its effects and find resources to support informed decisions.</p>','primary':('https://cannabissense.ca/basics/cannabis-101','Explore cannabis basics'),'secondary':('https://cannabissense.ca/resources','Find resources'),'heading':'Build your cannabis knowledge','intro':'<p>Start with clear information from CannabisSense.</p>','nav':[('Cannabis basics','https://cannabissense.ca/basics/cannabis-101'),('Health effects','https://cannabissense.ca/health-effects/know-effects'),('Lower-risk guidelines','https://cannabissense.ca/moderation/cannabis-use-guidelines'),('Resources','https://cannabissense.ca/resources')],'cards':[('Cannabis basics','Learn about cannabis and the terms you may encounter.','https://cannabissense.ca/basics/cannabis-101'),('Understand the effects','Explore information about cannabis and its health effects.','https://cannabissense.ca/health-effects/know-effects'),('Find useful resources','Continue learning with CannabisSense’s resource collection.','https://cannabissense.ca/resources')],'cta':('Keep learning.','<p>Explore more information and resources to help you make informed choices.</p>','https://cannabissense.ca/resources','Explore resources'),'description':'<p>Information to support informed choices. CannabisSense is an AGLC initiative.</p>'}}
 base='/sitecore/templates/Project/AGLC/Components';folder='1c82e550-ebcd-4e5d-8abd-d50d0809541e';navtpl=m['items'][base+'/Navigation Link'];cardtpl=m['items'][base+'/Card']
 for site,s in specs.items():
  sp='/sitecore/content/aglc/'+site;home=read(sp+'/Home');m.setdefault('sites',{})[site]={'homeId':home['itemId'],'content':{},'partials':{},'status':'seeded, not activated'}
  d=sp+'/Home/Data';ensure(d,folder)
  for name,fields in [('Hero',{'Eyebrow':s['eyebrow'],'Title':s['title'],'Summary':s['summary'],'PrimaryLink':link(*s['primary']),'SecondaryLink':link(*s['secondary'])}),('CardGrid',{'Heading':s['heading'],'Intro':s['intro']}),('CallToAction',{'Title':s['cta'][0],'Body':s['cta'][1],'Link':link(s['cta'][2],s['cta'][3])})]:
   id=ensure(d+'/'+name,m['components'][name]['templateId'],fields);m['sites'][site]['content'][name]=id;save()
  for ix,(title,summary,url) in enumerate(s['cards']):ensure(d+'/CardGrid/'+title,cardtpl,{'Title':title,'Summary':'<p>'+escape(summary)+'</p>','Link':link(url,'Learn more'),'__Sortorder':str((ix+1)*100)})
  for name,label in [('SiteHeader','Site header'),('SiteFooter','Site footer')]:
   pp=sp+'/Presentation/Partial Designs/'+label;pid=ensure(pp,'fd2059fd-6043-4dfe-8c04-e2437ce87634',{'Signature':name.lower()});ensure(pp+'/Data',folder)
   fields={'BrandName':s['brand'],'HomeLink':internal(home['itemId'],s['brand'])} if name=='SiteHeader' else {'BrandName':s['brand'],'Description':s['description'],'Copyright':'© AGLC'}
   did=ensure(pp+'/Data/'+label,m['components'][name]['templateId'],fields)
   for ix,(title,url) in enumerate(s['nav']):ensure(pp+'/Data/'+label+'/'+title,navtpl,{'Title':title,'Link':link(url,title),'__Sortorder':str((ix+1)*100)})
   m['sites'][site]['partials'][name]={'itemId':pid,'datasourceId':did,'path':pp};save()
  # These definitions are site-scoped. No shared layout placeholder settings are changed.
  for key,names in [('headless-header',['SiteHeader']),('headless-main',['Hero','CardGrid','CallToAction']),('headless-footer',['SiteFooter'])]:ensure(sp+'/Presentation/Placeholder Settings/'+key,'d2a6884c-04d5-4089-a64e-d27ca9d68d4c',{'Placeholder Key':key,'Allowed Controls':'|'.join('{'+m['components'][n]['renderingId']+'}' for n in names)})
  ensure(sp+'/Presentation/Available Renderings/Shared experience','76da0a8d-fc7e-42b2-af1e-205b49e43f98',{'Renderings':'|'.join('{'+c['renderingId']+'}' for c in m['components'].values())})
 m['note']='Observed native IDs. Templates/renderings/variants/palette/placeholder controls developer-owned; page and partial datasources editorial-owned. Home activation pending matching code deployment.';m['phase']='native definitions and editorial seed created; no Home activation or publication';save()
 print('Scoped content prepared. Home layouts remain unchanged.')
if __name__=='__main__':main()
