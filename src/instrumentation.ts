/**
 * Node can be started with `--localstorage-file` (often via NODE_OPTIONS). If the path is
 * missing or invalid, `globalThis.localStorage` may exist but `getItem` is not a function,
 * which breaks any SSR code that touches localStorage (Next dev / RSC).
 *
 * Next also merges `.env*` into `process.env` after the dev launcher runs, so we strip bad
 * flags here too before any worker processes inherit NODE_OPTIONS.
 */
function stripBadLocalstorageFromNodeOptions() {
  if (typeof process === "undefined" || !process.env) return;
  if (process.env.MULA_KEEP_NODE_OPTIONS === "1") return;

  const raw = process.env.NODE_OPTIONS;
  if (!raw?.trim() || !/--localstorage-file\b/i.test(raw)) return;

  let s = raw.replace(/\s+/g, " ").trim();
  for (let pass = 0; pass < 10 && /--localstorage-file\b/i.test(s); pass++) {
    s = s
      .replace(/\s*--localstorage-file=\S*\s*/gi, " ")
      .replace(/\s*--localstorage-file\s+/gi, " ")
      .replace(/\s*--localstorage-file\b\s*/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (!s || /--localstorage-file\b/i.test(s)) {
    delete process.env.NODE_OPTIONS;
  } else {
    process.env.NODE_OPTIONS = s;
  }
}

export async function register() {
  stripBadLocalstorageFromNodeOptions();

  if (typeof window !== "undefined") return;

  // Avoid touching Node-only globals in Edge instrumentation bundle
  if (typeof process === "undefined" || !process.versions?.node) return;

  const ls = globalThis.localStorage as Storage | undefined;
  if (!ls || typeof ls.getItem === "function") return;

  const memory = new Map<string, string>();
  const mock: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.get(String(key)) ?? null;
    },
    key(index: number) {
      return [...memory.keys()][index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(String(key));
    },
    setItem(key: string, value: string) {
      memory.set(String(key), String(value));
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}
