import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "..", "src");
const destDir = join(root, "src", "lib", "rollupServer");
const files = ["metrics.js", "sheetsClient.js", "config.js"];

const marker = join(srcDir, "metrics.js");
if (!existsSync(marker)) {
  console.log(
    "sync-rollup-lib: ../src not found (standalone repo). Using committed files under src/lib/rollupServer/."
  );
  process.exit(0);
}

for (const name of files) {
  const from = join(srcDir, name);
  const to = join(destDir, name);
  if (!existsSync(from)) {
    console.error(`sync-rollup-lib: missing source file ${from}`);
    process.exit(1);
  }
  copyFileSync(from, to);
}
console.log("sync-rollup-lib: copied metrics.js, sheetsClient.js, config.js from ../src");
