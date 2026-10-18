import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { HUB_CATALOG_FILENAME } from "./constants.js";

export function hubCatalogCachePath(hubId: string, ref: string): string {
  return join(
    homedir(),
    ".cache",
    "agent-skills",
    "hubs",
    hubId,
    ref,
    HUB_CATALOG_FILENAME,
  );
}

export async function readHubCatalogCache(
  hubId: string,
  ref: string,
): Promise<string | null> {
  const path = hubCatalogCachePath(hubId, ref);
  try {
    await stat(path);
    return readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function writeHubCatalogCache(
  hubId: string,
  ref: string,
  content: string,
): Promise<void> {
  const path = hubCatalogCachePath(hubId, ref);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

export async function hubCatalogCacheAgeMs(
  hubId: string,
  ref: string,
): Promise<number | null> {
  const path = hubCatalogCachePath(hubId, ref);
  try {
    const s = await stat(path);
    return Date.now() - s.mtimeMs;
  } catch {
    return null;
  }
}
