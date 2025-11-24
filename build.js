/**
 * Build script using esbuild
 * Bundles all modules into a single static file
 * Run with: node build.js
 */

const { build } = require('esbuild');

build({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'app.bundle.js',
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: false,
  sourcemap: false,
  banner: {
    js: '// Pathwise Aurora - Bundled Application\n'
  }
}).then(() => {
  console.log('✓ Build complete: app.bundle.js');
  console.log('✓ You can now open index.html directly (file://)');
  console.log('✓ No server needed - works as static page!');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

