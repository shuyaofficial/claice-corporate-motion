// Classic script with embedded model and texture so opening index.html via file:// needs no fetch or module imports.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { rolldown } from 'rolldown';

export async function GET() {
  const geometry = await readFile(resolve('public/3d/diorama_geo.glb'));
  const texture = await readFile(resolve('public/3d/diorama_bake.webp'));
  const build = await rolldown({
    input: resolve('src/lib/diorama-viewer.js'),
    transform: { define: {
      __MODEL_BASE64__: JSON.stringify(geometry.toString('base64')),
      __TEXTURE_URL__: JSON.stringify('data:image/webp;base64,' + texture.toString('base64')),
    } }
  });
  try {
    const { output } = await build.generate({ format: 'iife', minify: true });
    return new Response(output[0].code, { headers: { 'Content-Type': 'application/javascript' } });
  } finally {
    await build.close();
  }
}
