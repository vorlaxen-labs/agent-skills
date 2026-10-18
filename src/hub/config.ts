import { homedir } from "node:os";
import { join } from "node:path";
import {
  HUBS_SUBSCRIPTION_FILENAME,
  HUB_SUBSCRIPTION_VERSION,
} from "./constants.js";
import { pathExists, projectPath, readTextFile, writeTextFile } from "../core/fs.js";
import { AGENT_SKILLS_HUBS_SUBSCRIPTION_V1_SCHEMA_URL } from "../schemas/public-urls.js";
import type { HubSubscription, HubsSubscriptionFile } from "./types.js";

let userConfigPathOverride: string | undefined;

export function setUserHubsConfigPathForTests(path: string | undefined): void {
  userConfigPathOverride = path;
}

export function getUserHubsConfigPath(): string {
  if (userConfigPathOverride !== undefined) {
    return userConfigPathOverride;
  }
  const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(base, "vorlaxen", HUBS_SUBSCRIPTION_FILENAME);
}

export function getProjectHubsConfigPath(cwd: string): string {
  return projectPath(cwd, HUBS_SUBSCRIPTION_FILENAME);
}

export class HubsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HubsConfigError";
  }
}

function parseHubsFile(raw: unknown, path: string): HubsSubscriptionFile {
  if (!raw || typeof raw !== "object") {
    throw new HubsConfigError(`Invalid ${HUBS_SUBSCRIPTION_FILENAME} at ${path}`);
  }
  const m = raw as Record<string, unknown>;
  const version =
    typeof m.version === "number" ? m.version : HUB_SUBSCRIPTION_VERSION;
  if (version !== HUB_SUBSCRIPTION_VERSION) {
    throw new HubsConfigError(`Unsupported subscription version at ${path}`);
  }
  if (!m.hubs || typeof m.hubs !== "object") {
    throw new HubsConfigError(`Invalid hubs map at ${path}`);
  }
  const hubs: Record<string, HubSubscription> = {};
  for (const [key, entry] of Object.entries(m.hubs as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") {
      throw new HubsConfigError(`Invalid hub entry "${key}" at ${path}`);
    }
    const e = entry as Record<string, unknown>;
    if (
      typeof e.hubId !== "string" ||
      typeof e.source !== "string" ||
      typeof e.ref !== "string" ||
      typeof e.manifestPath !== "string" ||
      typeof e.addedAt !== "string"
    ) {
      throw new HubsConfigError(`Invalid hub entry "${key}" at ${path}`);
    }
    hubs[key] = {
      hubId: e.hubId,
      source: e.source,
      ref: e.ref,
      manifestPath: e.manifestPath,
      addedAt: e.addedAt,
    };
  }
  return { version: HUB_SUBSCRIPTION_VERSION, hubs };
}

export async function readHubsFile(path: string): Promise<HubsSubscriptionFile | null> {
  if (!(await pathExists(path))) {
    return null;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await readTextFile(path));
  } catch {
    throw new HubsConfigError(`Invalid JSON at ${path}`);
  }
  return parseHubsFile(raw, path);
}

export async function writeHubsFile(
  path: string,
  file: HubsSubscriptionFile,
): Promise<void> {
  const payload = {
    $schema: AGENT_SKILLS_HUBS_SUBSCRIPTION_V1_SCHEMA_URL,
    version: HUB_SUBSCRIPTION_VERSION,
    hubs: file.hubs,
  };
  await writeTextFile(path, `${JSON.stringify(payload, null, 2)}\n`);
}

/** Project entries override user entries for the same hubId. */
export async function readMergedHubSubscriptions(cwd: string): Promise<HubSubscription[]> {
  const userFile = await readHubsFile(getUserHubsConfigPath());
  const projectFile = await readHubsFile(getProjectHubsConfigPath(cwd));
  const map = new Map<string, HubSubscription>();
  for (const sub of Object.values(userFile?.hubs ?? {})) {
    map.set(sub.hubId, sub);
  }
  for (const sub of Object.values(projectFile?.hubs ?? {})) {
    map.set(sub.hubId, sub);
  }
  return [...map.values()].sort((a, b) => a.hubId.localeCompare(b.hubId));
}

export async function getHubSubscription(
  cwd: string,
  hubId: string,
): Promise<HubSubscription | undefined> {
  const merged = await readMergedHubSubscriptions(cwd);
  return merged.find((h) => h.hubId === hubId);
}

export async function upsertHubSubscription(options: {
  cwd: string;
  subscription: HubSubscription;
  project: boolean;
}): Promise<string> {
  const path = options.project
    ? getProjectHubsConfigPath(options.cwd)
    : getUserHubsConfigPath();
  const existing = (await readHubsFile(path)) ?? {
    version: HUB_SUBSCRIPTION_VERSION,
    hubs: {},
  };
  existing.hubs[options.subscription.hubId] = options.subscription;
  await writeHubsFile(path, existing);
  return path;
}

export async function removeHubSubscriptions(options: {
  cwd: string;
  hubIds: string[];
  project: boolean;
}): Promise<string> {
  const path = options.project
    ? getProjectHubsConfigPath(options.cwd)
    : getUserHubsConfigPath();
  const existing = await readHubsFile(path);
  if (!existing) {
    return path;
  }
  for (const id of options.hubIds) {
    delete existing.hubs[id];
  }
  await writeHubsFile(path, existing);
  return path;
}
