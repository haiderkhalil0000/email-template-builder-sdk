import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  dts: true,
  minify: true,
  target: 'es2019',
  outDir: 'dist',
  external: ['react', 'react-dom'],
  tsconfig: './tsconfig.json',
});
