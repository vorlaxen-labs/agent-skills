import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bundled = join(root, "bundled");

const required = ["AGENTS.md", "rules/global.mdc", "skills/global/SKILL.md"];

const missing = required.filter((rel) => !existsSync(join(bundled, rel)));

if (missing.length > 0) {
  console.error("bundled/ is out of date. Missing:");
  for (const m of missing) console.error(`  - ${m}`);
  console.error("Run: npm run build");
  process.exit(1);
}

console.log("bundled/ snapshot OK");
