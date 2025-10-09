// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://bbfl-frontier.github.io',
  base: '/bbfl-website',
  output: 'static',
  vite: {
    plugins: [tailwindcss()]
  }
});