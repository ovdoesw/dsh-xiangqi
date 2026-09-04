/**
 * Minimal client-side context surface this plugin reads off the DSH web boot.
 *
 * Type-only: the runtime object is supplied by the harness's web-boot context,
 * so this module must never be imported by server-side entry (lib/index.js).
 * The real cordis Context carries far more services; this plugin only uses
 * `ctx.get('llm')` and `ctx.slots`, and its members are typed loosely here to
 * stay self-contained (no dependency on DSH platform type packages).
 */

export interface XiangqiSlotRegisterOptions {
  name: string;
  id: string;
  order?: number;
  store?: unknown;
  inject?: (actions: never, ...rest: never[]) => unknown;
}

export interface ClientContext {
  get<T>(service: string): T | undefined;
  slots: {
    inject(name: string, register: unknown): unknown;
    register(opts: XiangqiSlotRegisterOptions, component: unknown): unknown;
  };
}
