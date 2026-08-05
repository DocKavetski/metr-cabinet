import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// Один index.html со встроенным JS/CSS — надёжно открывается в Chrome с диска (file://)
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: 'strip-crossorigin-for-file-protocol',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin(="[^"]*")?/g, '')
      },
    },
  ],
  base: './',
  build: {
    outDir: path.resolve(__dirname, '../Расчет тестов'),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
})
