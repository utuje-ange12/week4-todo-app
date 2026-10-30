import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // './' lets the built site work from any URL path (GitHub Pages, Netlify, Vercel)
  base: './',
  plugins: [tailwindcss()],
});
