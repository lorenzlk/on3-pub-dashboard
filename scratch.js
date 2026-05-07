import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { config } = require("./src/lib/rollupServer/config.js");
const { getTabRows } = require("./src/lib/rollupServer/sheetsClient.js");

async function run() {
  const tab = config.tabs.weekly;
  const { rows } = await getTabRows(tab.name, { headerRow: tab.headerRow });
  for (const r of rows) {
    for (const key of Object.keys(r)) {
      if (key.includes('kvp') || key.includes('inc') || key.includes('imp')) {
         let val = r[key];
         if (val && String(val) !== '0') {
             console.log(key, val);
             return;
         }
      }
    }
  }
}
run();
