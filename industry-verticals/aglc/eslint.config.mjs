import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: { 'jsx-a11y/alt-text': 'off' },
  },
  {
    ignores: ['node_modules/**', '.next/**', '.sitecore/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];
