#!/usr/bin/env node
/**
 * Run in the *same* terminal you use for `npm run dev` (especially Cursor’s integrated
 * terminal). Shows what Node would inherit before your app runs.
 */
const ls = (v) => (v === undefined ? "(unset)" : JSON.stringify(v));

console.log("pid", process.pid);
console.log("node", process.version);
console.log("argv0 / script", process.argv[0], process.argv[1] ?? "");
console.log("process.execArgv", process.execArgv);
console.log("process.env.NODE_OPTIONS", ls(process.env.NODE_OPTIONS));

const no = process.env.NODE_OPTIONS ?? "";
const ex = process.execArgv.join(" ");
const blob = `${no} ${ex}`;
if (/localstorage/i.test(blob)) {
  console.log(
    "\n>>> Found 'localstorage' in NODE_OPTIONS and/or execArgv — that matches the warning source."
  );
} else {
  console.log(
    "\n>>> No 'localstorage' in NODE_OPTIONS/execArgv *in this process*. The warning may come from a child process or from env applied after this check."
  );
}

const major = Number.parseInt(process.version.slice(1).split(".")[0] ?? "0", 10);
if (major >= 25) {
  console.log(
    "\nNode 25+ enables experimental Web Storage; Next/dev touching localStorage can warn even when NODE_OPTIONS looks clean. `npm run dev` prepends `--no-experimental-webstorage`, or use Node 22 LTS."
  );
}

console.log(
  "\nTip: re-run with trace:\n  NODE_OPTIONS='--trace-warnings' npm run dev\nThen match (node:PID) from the warning to `ps -p <PID>` / Activity Monitor."
);
