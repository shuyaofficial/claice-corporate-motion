import { defineConfig } from 'astro/config';

// 静的出力。dist をどの階層に置いても開けるよう、CSS は HTML に埋め込み、スクリプトは is:inline で書く
// （ビルドが /_astro/ のような「/」始まりの参照を作らない）。
export default defineConfig({
  site: 'https://www.claice.com',
  output: 'static',
  outDir: '../../動きの実験版',
  trailingSlash: 'ignore',
  build: { format: 'preserve', inlineStylesheets: 'always' },
  compressHTML: false,
  devToolbar: { enabled: false },
});
