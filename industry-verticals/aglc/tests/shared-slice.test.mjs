import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function component(folder, name) {
  const path = new URL(`../src/components/${folder}/${name}.tsx`, import.meta.url);
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(require, module, module.exports);
  return module.exports.Default;
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
