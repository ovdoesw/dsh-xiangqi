/**
 * Host loader entry for the browser-only dsh-xiangqi plugin.
 *
 * The real behavior lives in the client bundle (`lib/client.js`, exported as
 * `"./client"`), which the harness discovers via the package's `dsh.client`
 * declaration and applies inside the web client. This host-side entry is an
 * intentionally empty Cordis plugin body: it exists only so the package
 * becomes a loader entry (with a fiber), which is what lets the client-module
 * scanner pick up the client bundle in the first place.
 */
export function apply(): void {}
