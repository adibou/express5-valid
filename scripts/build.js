const esbuild = require('esbuild');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// Clean dist folder
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}

// Generate TypeScript declarations
console.log('Generating TypeScript declarations...');
execSync('npx tsc --emitDeclarationOnly', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

// Copy .d.ts to .d.mts for ESM
const dtsFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.d.ts'));
for (const file of dtsFiles) {
    const content = fs.readFileSync(path.join(distDir, file), 'utf-8');
    fs.writeFileSync(path.join(distDir, file.replace('.d.ts', '.d.mts')), content);
}

// Common esbuild options
const commonOptions = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    external: ['express'],
    sourcemap: true,
};

// Build CommonJS
console.log('Building CommonJS...');
esbuild.buildSync({
    ...commonOptions,
    outfile: 'dist/index.js',
    format: 'cjs',
});

// Build ESM
console.log('Building ESM...');
esbuild.buildSync({
    ...commonOptions,
    outfile: 'dist/index.mjs',
    format: 'esm',
});

console.log('Build complete!');
