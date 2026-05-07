import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// Clean current process (cheap; helps if anything reads process.env before spawn)
try {
  require("./sanitize-node-options.cjs").sanitizeProcessEnv();
} catch {
  /* ignore */
}

const NODE_MAJOR = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
/** Node 25+ enables experimental Web Storage; touching localStorage without a valid `--localstorage-file` warns. */
const NO_EXPERIMENTAL_WEBSTORAGE = "--no-experimental-webstorage";

function withNoExperimentalWebstorage(nodeOptions) {
  if (NODE_MAJOR < 25) return nodeOptions;
  const s = (nodeOptions ?? "").trim();
  if (/\b--no-experimental-webstorage\b/.test(s)) return s || undefined;
  return s ? `${NO_EXPERIMENTAL_WEBSTORAGE} ${s}` : NO_EXPERIMENTAL_WEBSTORAGE;
}

/**
 * Turbopack worker processes inherit NODE_OPTIONS. IDE/shell often injects a broken
 * `--localstorage-file`, which prints a warning and breaks SSR localStorage. For local
 * dev we omit NODE_OPTIONS entirely on the Next process unless MULA_KEEP_NODE_OPTIONS=1.
 * On Node 25+, we still pass `--no-experimental-webstorage` so Next does not hit Web Storage.
 */
const env = { ...process.env };
if (process.env.MULA_KEEP_NODE_OPTIONS === "1") {
  try {
    require("./sanitize-node-options.cjs").sanitizeProcessEnv();
  } catch {
    /* ignore */
  }
  const merged = withNoExperimentalWebstorage(process.env.NODE_OPTIONS);
  if (merged) env.NODE_OPTIONS = merged;
  else delete env.NODE_OPTIONS;
} else {
  delete env.NODE_OPTIONS;
  const merged = withNoExperimentalWebstorage(undefined);
  if (merged) env.NODE_OPTIONS = merged;
}

const nextCli = join(root, "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, "dev", "-H", "0.0.0.0", "--turbopack"], {
  stdio: "inherit",
  env,
  cwd: root,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
