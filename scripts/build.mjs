/**
 * Build the dsh-xiangqi plugin artifacts:
 *  - lib/client.js  — the browser bundle (closure-factory handed to
 *                     window.__ModuleLoader__.load; react + dsh-runtime stay
 *                     external and resolve from the shell's module table).
 *  - lib/index.js   — the host loader entry (an intentionally empty Cordis
 *                     plugin body that makes the package a loader entry so the
 *                     client-modules scanner discovers the client bundle).
 */
import { build } from 'esbuild';

const PLUGIN_ID = '@deepseek-ai/dsh-xiangqi';

// Matches the harness client-bundle shape (tsdown emits the same wrapper):
//   window.__ModuleLoader__.load({ id, factory: (require) => { … return module.exports; } })
const BANNER = `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`;
const FOOTER = 'return module.exports; } });';

await build({
  entryPoints: ['src/client.ts'],
  bundle: true,
  format: 'cjs',
  outfile: 'lib/client.js',
  external: ['react', 'react/jsx-runtime', 'react-dom', '@deepseek-ai/dsh-client-runtime/client'],
  banner: { js: BANNER },
  footer: { js: FOOTER },
  target: 'es2020',
});

await build({
  entryPoints: ['src/index.ts'],
  bundle: false,
  format: 'esm',
  outfile: 'lib/index.js',
  target: 'es2022',
});

console.log('✅ built lib/client.js + lib/index.js');
