const es = require('esbuild')

async function run() {
    await es.build({
      entryPoints: ['dev/server.ts'],
      bundle: true,
      minify:false,
      treeShaking: false,
      platform: 'node',
      outdir: 'dist', 
      target: 'es2021',
      sourcemap: true,
      metafile: false,
    });
}

run();