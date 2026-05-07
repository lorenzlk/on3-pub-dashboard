"use strict";

/**
 * Next dev + Cursor/IDE `--localstorage-file` noise:
 *
 * 1) fork() inherits execArgv — patch next-dev.js with execArgv: [].
 * 2) Fork env NODE_OPTIONS is built from parsed flags; strip any option whose name
 *    contains "localstorage" (parseArgs key shapes vary).
 * 3) Belt-and-suspenders: strip --localstorage-file from the final NODE_OPTIONS string
 *    passed to the worker (catches anything parse missed).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "../node_modules/next");
if (!fs.existsSync(root)) {
  process.exit(0);
}

function patchNextDevFork() {
  const nextDev = path.join(root, "dist/cli/next-dev.js");
  if (!fs.existsSync(nextDev)) return;
  let s = fs.readFileSync(nextDev, "utf8");
  if (s.includes("MULA_PATCH_NEXT_DEV_FORK_EXECARGV")) return;

  const needle = `            child = (0, _child_process.fork)(startServerPath, {
                stdio: 'inherit',`;

  const replacement = `            child = (0, _child_process.fork)(startServerPath, {
                // MULA_PATCH_NEXT_DEV_FORK_EXECARGV: avoid inheriting IDE-injected Node flags (e.g. --localstorage-file)
                execArgv: [],
                stdio: 'inherit',`;

  if (!s.includes(needle)) {
    console.warn(
      "[patch-next-dev] next-dev.js fork pattern not found; skip (Next.js version may have changed)."
    );
    return;
  }
  fs.writeFileSync(nextDev, s.replace(needle, replacement), "utf8");
}

function patchNextDevNodeOptionsString() {
  const nextDev = path.join(root, "dist/cli/next-dev.js");
  if (!fs.existsSync(nextDev)) return;
  let s = fs.readFileSync(nextDev, "utf8");
  if (s.includes("MULA_PATCH_NODE_OPTIONS_STRING_STRIP")) return;

  const needle = `                    NODE_OPTIONS: (0, _utils.formatNodeOptions)(nodeOptions),`;

  const replacement = `                    // MULA_PATCH_NODE_OPTIONS_STRING_STRIP
                    NODE_OPTIONS: (function (opts) {
                        const raw = (0, _utils.formatNodeOptions)(opts);
                        if (!raw || !String(raw).trim()) return raw;
                        return String(raw)
                            .replace(/\\s*--localstorage-file=[^\\s]*/gi, " ")
                            .replace(/\\s*--localstorage-file\\b/gi, " ")
                            .replace(/\\s{2,}/g, " ")
                            .trim();
                    })(nodeOptions),`;

  if (!s.includes(needle)) {
    console.warn(
      "[patch-next-dev] next-dev.js NODE_OPTIONS line not found; skip (Next.js version may have changed)."
    );
    return;
  }
  fs.writeFileSync(nextDev, s.replace(needle, replacement), "utf8");
}

function patchUtils() {
  const utilsPath = path.join(root, "dist/server/lib/utils.js");
  if (!fs.existsSync(utilsPath)) return;
  let s = fs.readFileSync(utilsPath, "utf8");

  if (s.includes("MULA_PATCH_STRIP_LOCALSTORAGE_FROM_NODE_OPTIONS_V2")) return;

  const v1Block = `    delete parsed['inspect_brk'];
    // MULA_PATCH_STRIP_LOCALSTORAGE_FROM_NODE_OPTIONS
    delete parsed['localstorage-file'];
    delete parsed['localstorage_file'];
    return parsed;
`;

  const v2Block = `    delete parsed['inspect_brk'];
    // MULA_PATCH_STRIP_LOCALSTORAGE_FROM_NODE_OPTIONS_V2
    for (const __k of Object.keys(parsed)) {
        const __n = String(__k).toLowerCase().replace(/_/g, "-");
        if (__n.includes("localstorage")) delete parsed[__k];
    }
    return parsed;
`;

  if (s.includes("MULA_PATCH_STRIP_LOCALSTORAGE_FROM_NODE_OPTIONS")) {
    if (s.includes(v1Block)) {
      fs.writeFileSync(utilsPath, s.replace(v1Block, v2Block), "utf8");
      return;
    }
  }

  const freshNeedle = `    delete parsed['inspect_brk'];
    return parsed;
`;

  if (!s.includes(freshNeedle)) {
    console.warn(
      "[patch-next-dev] server/lib/utils.js inspect_brk block not found; skip (Next.js version may have changed)."
    );
    return;
  }
  fs.writeFileSync(utilsPath, s.replace(freshNeedle, v2Block), "utf8");
}

patchNextDevFork();
patchUtils();
patchNextDevNodeOptionsString();
