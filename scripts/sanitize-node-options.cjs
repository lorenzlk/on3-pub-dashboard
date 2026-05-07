"use strict";

/**
 * Remove broken `--localstorage-file` entries from NODE_OPTIONS on the current process.
 * Set MULA_KEEP_NODE_OPTIONS=1 to skip (not recommended if you see the localStorage warning).
 *
 * @param {{ forceDelete?: boolean }} opts - If true, delete NODE_OPTIONS whenever it mentions localstorage-file (after strip attempt).
 */
function sanitizeProcessEnv(opts = {}) {
  if (process.env.MULA_KEEP_NODE_OPTIONS === "1") return;

  const raw = process.env.NODE_OPTIONS;
  if (!raw?.trim()) return;
  if (!/--localstorage-file\b/i.test(raw) && !opts.forceDelete) return;

  let s = raw.replace(/\s+/g, " ").trim();
  for (let pass = 0; pass < 12 && /--localstorage-file\b/i.test(s); pass++) {
    s = s
      .replace(/\s*--localstorage-file=\S*\s*/gi, " ")
      .replace(/\s*--localstorage-file\s+/gi, " ")
      .replace(/\s*--localstorage-file\b\s*/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  if (!s || /--localstorage-file\b/i.test(s) || opts.forceDelete) {
    delete process.env.NODE_OPTIONS;
  } else {
    process.env.NODE_OPTIONS = s;
  }
}

module.exports = { sanitizeProcessEnv };
