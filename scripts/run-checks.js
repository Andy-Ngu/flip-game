// Runs every test suite in the game folder. Usage: npm test
//
// The suites are plain TypeScript scripts (no test framework). This script compiles
// them with the project's own TypeScript compiler into a throwaway folder, runs each
// one with node, and reports.
//
// It runs the compiler through node directly, not through `npx`. On Windows, npx is a
// .cmd file, and recent Node versions refuse to launch those without a shell
// ("spawn EINVAL").
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Find the game folder, whether this script sits in <project>/scripts or <project>/src/scripts.
const gameDir = [
  path.join(__dirname, "..", "src", "game"),
  path.join(__dirname, "..", "game"),
].find((dir) => fs.existsSync(path.join(dir, "check-round.ts")));
if (!gameDir) {
  console.error("Could not find the game folder (looked for src/game and game next to the scripts folder).");
  process.exit(1);
}

// Find the TypeScript compiler installed in this project.
let tsc;
try {
  tsc = require.resolve("typescript/bin/tsc", { paths: [__dirname, process.cwd()] });
} catch {
  console.error("TypeScript isn't installed in this project. Run: npm install --save-dev typescript");
  process.exit(1);
}

const out = path.join(gameDir, "..", ".test-dist");
const suites = ["round", "session", "bots", "seats", "events", "cards"];

fs.rmSync(out, { recursive: true, force: true });

// 1. Compile all suites in one go. --ignoreConfig keeps the app's tsconfig out of it.
const sources = suites.map((s) => path.join(gameDir, `check-${s}.ts`));
const compile = spawnSync(
  process.execPath,
  [
    tsc, ...sources, "--ignoreConfig", "--outDir", out, "--module", "commonjs",
    "--target", "es2020", "--lib", "es2020,dom", "--skipLibCheck",
  ],
  { stdio: "inherit" }
);
if (compile.error) console.error(compile.error);
if (compile.status !== 0) {
  console.error("\nCompile failed, so no tests were run.");
  process.exit(1);
}

// 2. Run each suite. A suite passes only if it exits cleanly, prints no FAIL line
//    and reaches its "All checks passed" line.
let failed = 0;
let total = 0;
for (const s of suites) {
  const run = spawnSync(process.execPath, [path.join(out, `check-${s}.js`)], { encoding: "utf8" });
  const text = (run.stdout || "") + (run.stderr || "");
  const passes = (text.match(/^PASS:/gm) || []).length;
  const ok = run.status === 0 && !/^FAIL:/m.test(text) && text.includes("All checks passed");
  total += passes;
  console.log(`${ok ? "ok  " : "FAIL"}  ${s.padEnd(8)} ${passes} checks`);
  if (!ok) {
    failed++;
    console.log(text);
  }
}

console.log(failed === 0 ? `\nAll ${suites.length} suites passed (${total} checks).` : `\n${failed} suite(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
