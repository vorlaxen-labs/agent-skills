import { join, resolve } from "node:path";
import {
  HUB_CATALOG_FILENAME,
  HUB_CATALOG_VERSION,
} from "./constants.js";
import { readTextFile } from "../core/fs.js";
import { createGitHubSource } from "../source/github.js";
import { createLocalSource } from "../source/local.js";
import { parseSource } from "../source/parse-source.js";
import {
  readHubCatalogCache,
  writeHubCatalogCache,
} from "./catalog-cache.js";
import type { HubCatalog, HubSubscription } from "./types.js";

export class HubCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HubCatalogError";
  }
}

export function parseHubCatalog(raw: unknown): HubCatalog {
  if (!raw || typeof raw !== "object") {
    throw new HubCatalogError("Invalid hub catalog JSON.");
  }
  const m = raw as Record<string, unknown>;
  if (m.version !== HUB_CATALOG_VERSION) {
    throw new HubCatalogError(`Unsupported hub catalog version (expected ${HUB_CATALOG_VERSION}).`);
  }
  if (typeof m.id !== "string" || !m.id) {
    throw new HubCatalogError("Hub catalog missing id.");
  }
  if (!m.skills || typeof m.skills !== "object") {
    throw new HubCatalogError("Hub catalog missing skills.");
  }
  const skills: HubCatalog["skills"] = {};
  for (const [alias, entry] of Object.entries(m.skills as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") {
      throw new HubCatalogError(`Invalid skill entry "${alias}".`);
    }
    const e = entry as Record<string, unknown>;
    if (typeof e.source !== "string" || !e.source) {
      throw new HubCatalogError(`Skill "${alias}" missing source.`);
    }
    skills[alias] = {
      source: e.source,
      ref: typeof e.ref === "string" ? e.ref : undefined,
      skill: typeof e.skill === "string" ? e.skill : undefined,
      description: typeof e.description === "string" ? e.description : undefined,
    };
  }
  return { version: HUB_CATALOG_VERSION, id: m.id, skills };
}

export async function fetchHubCatalogRaw(
  subscription: HubSubscription,
  cwd: string,
  noCache: boolean,
): Promise<string> {
  const manifestPath = subscription.manifestPath || HUB_CATALOG_FILENAME;
  const parsed = parseSource(subscription.source, subscription.ref);
  if (parsed.type === "hub") {
    throw new HubCatalogError("Invalid hub subscription source.");
  }

  if (parsed.type === "local") {
    const abs = resolve(cwd, parsed.path);
    return readTextFile(join(abs, manifestPath));
  }

  const source = createGitHubSource(parsed.owner, parsed.repo, parsed.ref, { noCache });
  const files = await source.fetch([manifestPath]);
  const file = files.find((f) => f.relativePath === manifestPath);
  if (!file) {
    throw new HubCatalogError(
      `Catalog not found: ${subscription.source}@${subscription.ref}/${manifestPath}`,
    );
  }
  return file.content;
}

export async function loadHubCatalog(options: {
  subscription: HubSubscription;
  cwd: string;
  noCache?: boolean;
  preferCache?: boolean;
  validateHubId?: boolean;
}): Promise<{ catalog: HubCatalog; fromCache: boolean }> {
  const { subscription, cwd, noCache = false, preferCache = !noCache } = options;
  const hubId = subscription.hubId;
  const ref = subscription.ref;

  if (preferCache && !noCache) {
    const cached = await readHubCatalogCache(hubId, ref);
    if (cached !== null) {
      const catalog = parseHubCatalog(JSON.parse(cached));
      const validateHubId = options.validateHubId ?? true;
      if (validateHubId && catalog.id !== hubId) {
        throw new HubCatalogError(
          `Catalog id "${catalog.id}" does not match subscription hubId "${hubId}".`,
        );
      }
      return { catalog, fromCache: true };
    }
  }

  const raw = await fetchHubCatalogRaw(subscription, cwd, noCache);
  const catalog = parseHubCatalog(JSON.parse(raw));
  const validateHubId = options.validateHubId ?? true;
  if (validateHubId && catalog.id !== hubId) {
    throw new HubCatalogError(
      `Catalog id "${catalog.id}" does not match subscription hubId "${hubId}".`,
    );
  }
  if (!noCache) {
    await writeHubCatalogCache(hubId, ref, raw);
  }
  return { catalog, fromCache: false };
}

export async function refreshHubCatalogCache(options: {
  subscription: HubSubscription;
  cwd: string;
  noCache?: boolean;
}): Promise<HubCatalog> {
  const raw = await fetchHubCatalogRaw(options.subscription, options.cwd, options.noCache ?? false);
  const catalog = parseHubCatalog(JSON.parse(raw));
  await writeHubCatalogCache(options.subscription.hubId, options.subscription.ref, raw);
  return catalog;
}
