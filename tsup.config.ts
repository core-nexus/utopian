import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI build (ESM only, no shebang - npm handles it)
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    target: 'node18',
    sourcemap: true,
    clean: true,
    minify: false,
    outExtension() {
      return { js: '.js' };
    },
  },
  // Library build (both ESM and CJS)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'node18',
    sourcemap: true,
    clean: false,
    dts: false, // Disable for now due to AI SDK typing complexity
    minify: false,
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' };
    },
  },
]);
