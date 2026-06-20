const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const androidDir = path.join(root, "android");
const binDir = path.join(root, "node_modules", ".bin");
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "PATH";

process.env[pathKey] = [androidDir, binDir, process.env[pathKey]].filter(Boolean).join(path.delimiter);

const cli = path.join(root, "node_modules", "react-native", "cli.js");
const result = spawnSync(process.execPath, [cli, "run-android", ...process.argv.slice(2)], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
