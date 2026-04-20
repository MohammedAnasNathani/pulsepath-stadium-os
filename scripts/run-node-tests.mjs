import { rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

await rm(new URL("../.test-dist", import.meta.url), { force: true, recursive: true }).catch(
  () => undefined,
);

await run("node_modules/.bin/tsc", ["-p", "tsconfig.test.json"], {
  cwd: new URL("..", import.meta.url),
});

await run("node", ["--test", ".test-dist/tests/*.test.js"], {
  cwd: new URL("..", import.meta.url),
  shell: true,
  stdio: "inherit",
});
