/**
 * dsh-xiangqi client entry.
 *
 * DSH client plugins are Cordis plugins: the client bundle is expected at the
 * `./client` export, which the harness loads and applies inside the web client.
 * This is a thin barrel over the same `apply`/`inject` that powers the main
 * `"."` entry (src/plugin.js -> lib/plugin.js). Both point at one implementation
 * so there is a single registration path; the separate `./client` subpath exists
 * to satisfy the DSH client-plugin contract laid out in the design doc.
 */

export { apply, inject } from './plugin.js';
export type { ClientContext } from './client-context.js';
