import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({ extensions: ['.svx'], layout: { runbook: join(dirname(fileURLToPath(import.meta.url)), 'src/lib/layouts/runbook.svelte') } }),
  ],
  kit: {
    adapter: adapter({ fallback: undefined }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb', '/kb/incidents/4471', '/kb/incidents/4471/causes', '/kb/triage/dedupe', '/kb/decisions/0001-dedupe-by-subject'], handleHttpError: 'warn' },
  },
};
