import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let cached: string | undefined;

/** Read version from package.json — single source of truth at runtime. */
export function getPackageVersion(): string {
  if (cached !== undefined) {
    return cached;
  }
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
  cached = pkg.version;
  return pkg.version;
}
