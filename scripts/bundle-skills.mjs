import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bundled = join(root, "bundled");

const paths = ["AGENTS.md", "rules/global.mdc", "skills/global"];

if (existsSync(bundled)) {
  rmSync(bundled, { recursive: true });
}
mkdirSync(bundled, { recursive: true });

for (const rel of paths) {
  const src = join(root, rel);
  const dest = join(bundled, rel);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

console.log(`Bundled ${paths.length} skill paths into bundled/`);
