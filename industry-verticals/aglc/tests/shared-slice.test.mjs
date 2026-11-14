import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function loadSource(path) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const localRequire = createRequire(path);
  const resolve = name => {
    if (!name.startsWith('.')) return localRequire(name);
    const tsx = new URL(name + '.tsx', path);
    return loadSource(existsSync(tsx) ? tsx : new URL(name + '.ts', path));
  };
  new Function('require', 'module', 'exports', output)(resolve, module, module.exports);
  return module.exports;
}
function component(folder, name) {
  return loadSource(new URL(`../src/components/${folder}/${name}.tsx`, import.meta.url)).Default;
}
const definitions = [['site-header','SiteHeader'],['site-footer','SiteFooter'],['hero','Hero'],['card-grid','CardGrid'],['call-to-action','CallToAction']];
const base = { params: {}, page: { mode: { isEditing: false } } };
const text = value => ({ jsonValue: { value } });
for (const [folder,name] of definitions) {
  test(`${name}: missing datasource renders no fixture content`, () => assert.equal(renderToStaticMarkup(React.createElement(component(folder,name), base)), ''));
  test(`${name}: empty native datasource is safe`, () => assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(component(folder,name), { ...base, fields: { data: { datasource: {} } } }))));
}
test('Hero preserves native content, escaping and rich text', () => {
 const markup = renderToStaticMarkup(React.createElement(component('hero','Hero'), { ...base, fields: { data: { datasource: { Title: text('A < B'), Summary: text('<p>Authored summary</p>') } } } }));
 assert.match(markup, /A &lt; B/); assert.match(markup, /<p>Authored summary<\/p>/); assert.doesNotMatch(markup, /hero__media/);
});
test('CardGrid reads children.results and renders native card content', () => {
 const markup = renderToStaticMarkup(React.createElement(component('card-grid','CardGrid'), { ...base, fields: { data: { datasource: { children: { results: [{ id:'one', Title:text('First card') },{id:'two',Title:text('Second card')}] } } } } }));
 assert.match(markup, /First card/); assert.match(markup, /Second card/); assert.equal((markup.match(/<article/g)||[]).length,2);
});
test('mobile navigation exposes a labeled collapsed control', () => {
 const markup = renderToStaticMarkup(React.createElement(component('site-header','SiteHeader'), { ...base, fields: { data: { datasource: { BrandName:text('Brand') } } } }));
 assert.match(markup,/aria-expanded="false"/); assert.match(markup,/aria-controls=/); assert.match(markup,/Skip to main content/);
});
test('theme is selected by actual site name, without activating tracking', () => {
 assert.match(readFileSync(new URL('../src/Layout.tsx',import.meta.url),'utf8'), /data-site=\{page.siteName\?.toLowerCase\(\)\}/);
 assert.match(readFileSync(new URL('../src/app/globals.css',import.meta.url),'utf8'), /\[data-site="cannabissense"\]/);
});
test('navigation uses authored Title once rather than duplicating general-link text', () => {
 const markup = renderToStaticMarkup(React.createElement(component('site-header','SiteHeader'), { ...base, fields: { data: { datasource: { children: { results: [{ id:'nav', Title:text('Authored label'), Link:{ jsonValue:{ value:{ href:'/about', text:'Duplicate label' } } } }] } } } } }));
 assert.equal((markup.match(/Authored label/g)||[]).length,1);
 assert.doesNotMatch(markup,/Duplicate label/);
});
test('published pages declare bounded ISR instead of indefinite blank prerenders', () => {
 assert.match(readFileSync(new URL('../src/app/[site]/[locale]/[[...path]]/page.tsx',import.meta.url),'utf8'), /export const revalidate = 60;/);
});
test('empty HomeLink keeps authored brand visible without creating an empty anchor', () => {
 const markup = renderToStaticMarkup(React.createElement(component('site-header','SiteHeader'), { ...base, fields: { data: { datasource: { BrandName:text('Visible brand'), HomeLink:{jsonValue:{value:{href:''}}} } } } }));
 assert.match(markup,/Visible brand/);
 assert.doesNotMatch(markup,/<a[^>]*>[^<]*Visible brand/);
 assert.match(markup,/<div class="site-brand"><span>Visible brand<\/span><\/div>/);
});
for (const [folder,name] of [['site-header','SiteHeader'],['site-footer','SiteFooter']]) {
 test(`${name}: empty Title lets native Link supply its authored label`, () => {
  const markup = renderToStaticMarkup(React.createElement(component(folder,name), { ...base, fields: { data: { datasource: { children:{results:[{id:'nav',Title:text('  '),Link:{jsonValue:{value:{href:'/about',text:'About us'}}}}]} } } } }));
  assert.match(markup,/>About us<\/a>/);
 });
 test(`${name}: absent Title and link text retain native URL label fallback`, () => {
  const markup = renderToStaticMarkup(React.createElement(component(folder,name), { ...base, fields: { data: { datasource: { children:{results:[{id:'nav',Link:{jsonValue:{value:{href:'/about',text:''}}}}]} } } } }));
  assert.match(markup,/>\/about<\/a>/);
 });
}
test('header separates authored brand, main and utility navigation without duplicate labels', () => {
 const entries = [['brand','Related'],['main','Topic'],['utility','Support']].map(([group,title]) => ({id:group,Group:text(group),Title:text(title),Link:{jsonValue:{value:{href:'https://example.org/'+group,text:title}}}}));
 const markup = renderToStaticMarkup(React.createElement(component('site-header','SiteHeader'), {...base,fields:{data:{datasource:{children:{results:entries}}}}}));
 assert.match(markup,/aria-label="Related sites"/); assert.match(markup,/aria-label="Main navigation"/); assert.match(markup,/aria-label="Utility navigation"/);
 for (const title of ['Related','Topic','Support']) assert.equal((markup.match(new RegExp('>'+title+'<','g'))||[]).length,1);
});
test('real external search preserves CMS endpoint and query name, with no fake handler', () => {
 const fields = {SearchAction:{jsonValue:{value:{href:'https://aglc.ca/search-results?scope=public'}}},SearchLabel:text('Search AGLC'),SearchQueryName:text('opq')};
 const Search = loadSource(new URL('../src/lib/native-controls.tsx',import.meta.url)).NativeSearch;
 const markup = renderToStaticMarkup(React.createElement(Search,{fields}));
 assert.match(markup,/action="https:\/\/aglc.ca\/search-results"/);assert.match(markup,/name="opq"/);assert.match(markup,/name="scope" value="public"/);assert.match(markup,/method="get"/);
 assert.equal(renderToStaticMarkup(React.createElement(Search,{fields:{...fields,SearchAction:{jsonValue:{value:{href:'javascript:alert(1)'}}}}})), '');
});
test('Hero does not emit background video before reduced-motion preference is known', () => {
 const markup=renderToStaticMarkup(React.createElement(component('hero','Hero'),{...base,fields:{data:{datasource:{Title:text('Authored'),BackgroundVideo:{jsonValue:{value:{href:'https://example.org/video.mp4'}}}}}}}));
 assert.doesNotMatch(markup,/<video/); assert.doesNotMatch(markup,/video\.mp4/);
});
test('footer uses authorable group labels rather than invented columns', () => {
 const markup=renderToStaticMarkup(React.createElement(component('site-footer','SiteFooter'),{...base,fields:{data:{datasource:{children:{results:[{id:'a',Group:text('People'),Title:text('Team'),Link:{jsonValue:{value:{href:'/team'}}}}]}}}}}));
 assert.match(markup,/>People<\/h2>/);assert.match(markup,/>Team<\/a>/);
});
test('ordinary navigation icons retain visible native labels; brand logos may hide theirs', () => {
 const Nav = loadSource(new URL('../src/lib/native-controls.tsx',import.meta.url)).NativeNavigationLink;
 const item={id:'icon',Title:text('Resources'),Logo:{jsonValue:{value:{src:'https://example.org/icon.svg',alt:''}}},Link:{jsonValue:{value:{href:'/resources'}}}};
 const plain=renderToStaticMarkup(React.createElement(Nav,{item}));
 assert.match(plain,/<span>Resources<\/span>/);assert.doesNotMatch(plain,/visually-hidden/);
 const brand=renderToStaticMarkup(React.createElement(Nav,{item:{...item,Group:text('brand')}}));
 assert.match(brand,/<span class="visually-hidden">Resources<\/span>/);
 const css=readFileSync(new URL('../src/app/globals.css',import.meta.url),'utf8');
 assert.match(css,/\.site-nav img, \.hero__quicklinks img, \.utility-nav img \{[^}]*width: 24px; height: 24px;/);
});
test('footer brand SVGs have explicit dimensions instead of collapsing in flex links', () => {
 const css=readFileSync(new URL('../src/app/globals.css',import.meta.url),'utf8');
 assert.match(css,/\.footer-group\[data-group="brand"\] img \{[^}]*width: 120px; height: 35px;/);
});
const normalize = loadSource(new URL('../src/lib/normalize-native-fields.ts',import.meta.url)).normalizeNativeFields;
test('bulk native fields normalize aliases and children without losing field metadata', () => {
 const title={value:'Authored title',metadata:{id:'field',editing:true}};
 const link={value:{href:'/authored'},metadata:{id:'link'}};
 const source={Fields:[{name:'Title',jsonValue:title}],children:{results:[{id:'child',Fields:[{name:'Link',jsonValue:link}]}]}};
 const result=normalize(source);
 assert.strictEqual(result.Title.jsonValue,title);assert.strictEqual(result.children.results[0].Link.jsonValue,link);
 assert.equal(result.children.results[0].id,'child');assert.equal(source.Title,undefined);
});
test('existing alias fields win over bulk projection and missing datasource stays missing', () => {
 const field={jsonValue:{value:'Original'}};
 assert.strictEqual(normalize({Title:field,Fields:[{name:'Title',jsonValue:{value:'Other'}}]}).Title,field);
 assert.equal(normalize(null),null);assert.equal(normalize(undefined),undefined);
});
test('bulk normalization rejects dangerous, inherited and unknown field keys', () => {
 const data=JSON.parse('{"__proto__":{"polluted":true},"Fields":[{"name":"__proto__","jsonValue":{"polluted":true}},{"name":"constructor","jsonValue":{}},{"name":"Unexpected","jsonValue":{}},{"name":"Title","jsonValue":{"value":"Safe"}}]}');
 const output=normalize(data);
 assert.deepEqual(Object.keys(output),['Title']);assert.equal({}.polluted,undefined);
 assert.deepEqual(normalize(Object.create({Title:{jsonValue:{value:'Inherited'}}})),{});
});
test('Hero and Footer render bulk native projection and preserve legacy contracts', () => {
 const toBulk=values=>Object.entries(values).map(([name,value])=>({name,jsonValue:value}));
 const hero=renderToStaticMarkup(React.createElement(component('hero','Hero'),{...base,fields:{data:{datasource:{Fields:toBulk({Title:{value:'Bulk hero'},Summary:{value:'<p>Native summary</p>'}}),children:{results:[{id:'quick',Fields:toBulk({Title:{value:'Quick link'},Link:{value:{href:'/quick'}}})}]}}}}}));
 assert.match(hero,/>Bulk hero<\/h1>/);assert.match(hero,/Native summary/);assert.match(hero,/>Quick link<\/a>/);
 const footer=renderToStaticMarkup(React.createElement(component('site-footer','SiteFooter'),{...base,fields:{data:{datasource:{Fields:toBulk({BrandName:{value:'Bulk brand'}}),children:{results:[{id:'footer',Fields:toBulk({Group:{value:'People'},Title:{value:'Contact'},Link:{value:{href:'/contact'}}})}]}}}}}));
 assert.match(footer,/Bulk brand/);assert.match(footer,/>People<\/h2>/);assert.match(footer,/>Contact<\/a>/);
});

for (const [folder,name] of [['breadcrumb','Breadcrumb'],['page-intro','PageIntro'],['rich-text-section','RichTextSection'],['resource-list','ResourceList']]) {
 test(`${name}: absent datasource produces no invented content`,()=>assert.equal(renderToStaticMarkup(React.createElement(component(folder,name),base)),''));
 test(`${name}: empty datasource is safe`,()=>assert.doesNotThrow(()=>renderToStaticMarkup(React.createElement(component(folder,name),{...base,fields:{data:{datasource:{}}}}))));
}
const bulk = (name,value) => ({name,jsonValue:{value}});
test('interior PageIntro renders one native h1 from filtered bulk projection',()=>{
 const markup=renderToStaticMarkup(React.createElement(component('page-intro','PageIntro'),{...base,fields:{data:{datasource:{Fields:[bulk('Title','Native interior'),bulk('Summary','<p>Native intro</p>')]}}}}));
 assert.equal((markup.match(/<h1/g)||[]).length,1);assert.match(markup,/Native interior/);assert.match(markup,/<p>Native intro<\/p>/);assert.doesNotMatch(markup,/page-intro__background/);
});
test('Breadcrumb preserves current unlinked native crumb and semantic navigation',()=>{
 const markup=renderToStaticMarkup(React.createElement(component('breadcrumb','Breadcrumb'),{...base,fields:{data:{datasource:{children:{results:[{id:'home',Fields:[bulk('Title','Home'),bulk('Link',{href:'/',text:'Home'})]},{id:'here',Fields:[bulk('Title','Here'),bulk('Link',{href:''})]}]}}}}}));
 assert.match(markup,/aria-label="Breadcrumb"/);assert.match(markup,/aria-current="page">Here/);assert.match(markup,/href="\/"/);assert.doesNotMatch(markup,/href=""/);
});
test('ResourceList bulk projection keeps native links, summaries and labels',()=>{
 const markup=renderToStaticMarkup(React.createElement(component('resource-list','ResourceList'),{...base,fields:{data:{datasource:{children:{results:[{id:'one',Fields:[bulk('Title','Resource'),bulk('Link',{href:'https://example.org/document.pdf',text:'Other label'}),bulk('Summary','<p>Authored description</p>')]}]}}}}}));
 assert.match(markup,/https:\/\/example.org\/document.pdf/);assert.match(markup,/Authored description/);assert.doesNotMatch(markup,/Other label/);
});
test('document filtering combines trimmed query, category and type without matching HTML tags',()=>{
 const {filterResources}=loadSource(new URL('../src/lib/filter-resources.ts',import.meta.url));
 const items=[{id:'a',Title:text('Gaming report'),Summary:text('<p>Annual data</p>'),Category:text('Gaming'),DocumentType:text('Report')},{id:'b',Title:text('Liquor form'),Category:text('Liquor'),DocumentType:text('Form')},{id:'empty'}];
 assert.equal(filterResources(items,'','','').length,3);assert.deepEqual(filterResources(items,'  ANNUAL ','Gaming','Report').map(x=>x.id),['a']);assert.equal(filterResources(items,'Annual','Liquor','').length,0);assert.equal(filterResources(items,'<p>','','').length,0);assert.equal(filterResources(items,'','Gaming','Form').length,0);
});
test('Documents variant labels limited catalogue and hides filter controls while editing',()=>{
 const {Documents}=loadSource(new URL('../src/components/resource-list/ResourceList.tsx',import.meta.url));
 const props={...base,fields:{data:{datasource:{children:{results:[{id:'one',Title:text('Document')}]}}}}};
 const markup=renderToStaticMarkup(React.createElement(Documents,props));assert.match(markup,/not the full AGLC catalogue/);assert.match(markup,/role="status"/);assert.match(markup,/type="search"/);
 const editing=renderToStaticMarkup(React.createElement(Documents,{...props,page:{mode:{isEditing:true}}}));assert.doesNotMatch(editing,/type="search"/);assert.match(editing,/Document/);
});
test('explicit interior CardGrid variants avoid Home classes and accept native bulk fields',()=>{
 const {ResourceTiles,SectorTiles}=loadSource(new URL('../src/components/card-grid/CardGrid.tsx',import.meta.url));
 for(const Variant of [ResourceTiles,SectorTiles]){const html=renderToStaticMarkup(React.createElement(Variant,{...base,fields:{data:{datasource:{Fields:[bulk('Heading','Authored heading')]}}}}));assert.match(html,/Authored heading/);assert.doesNotMatch(html,/class="card-section/);}
});
test('TopicBand is a separate native variant without altering Home Default',()=>{
 const {TopicBand}=loadSource(new URL('../src/components/call-to-action/CallToAction.tsx',import.meta.url));
 assert.equal(renderToStaticMarkup(React.createElement(TopicBand,base)),'');
 const html=renderToStaticMarkup(React.createElement(TopicBand,{...base,fields:{data:{datasource:{Fields:[bulk('Title','Learn more'),bulk('Link',{href:'/moderation',text:'Explore'})]}}}}));assert.match(html,/class="topic-band"/);assert.match(html,/href="\/moderation"/);assert.match(html,/Learn more/);assert.doesNotMatch(html,/cta-panel/);
});
test('document metadata fields retain distinct native elements for visible spacing',()=>{
 const {Documents}=loadSource(new URL('../src/components/resource-list/ResourceList.tsx',import.meta.url));const html=renderToStaticMarkup(React.createElement(Documents,{...base,fields:{data:{datasource:{children:{results:[{id:'a',Category:text('Gaming'),DocumentType:text('Form')}]}}}}}));assert.match(html,/<span>Gaming<\/span><span>Form<\/span>/);
});
