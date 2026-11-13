import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('native editing and multisite infrastructure is retained', () => {
  assert.match(read('src/Scripts.tsx'), /EditingScripts/);
  assert.match(read('src/proxy.ts'), /AppRouterMultisiteProxy/);
  assert.ok(existsSync(new URL('../src/app/api/editing/render/route.ts', import.meta.url)));
  assert.ok(existsSync(new URL('../src/app/api/editing/config/route.ts', import.meta.url)));
});
test('blank foundation does not initialize analytics or personalization', () => {
  assert.doesNotMatch(read('src/Scripts.tsx'), /CdpPageView/);
  assert.doesNotMatch(read('src/proxy.ts'), /new PersonalizeProxy/);
  assert.doesNotMatch(read('src/app/[site]/layout.tsx'), /Bootstrap/);
  assert.match(read('sitecore.config.ts'), /useCookieResolution: \(\) => false/);
});
test('health endpoint is explicitly independent of Sitecore content readiness', () => {
  assert.match(read('src/app/healthz/route.ts'), /aglc-cannabissense/);
  assert.match(read('src/app/healthz/route.ts'), /not a claim/);
});
