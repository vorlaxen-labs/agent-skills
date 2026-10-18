import { createHash } from "node:crypto";
import { pathExists, projectPath, readTextFile, writeTextFile } from "../core/fs.js";
import { SKILLS_LOCK_V1_SCHEMA_URL } from "../schemas/public-urls.js";

export const SKILLS_LOCK_VERSION = 1;

export type SkillSourceType = "github" | "local" | "npm";

export interface SkillLockEntry {
  source: string;
  sourceType: SkillSourceType;
  skillPath: string;
  computedHash: string;
  ref?: string;
  sourceUrl?: string;
}

export interface SkillsLockFile {
  version: number;
  skills: Record<string, SkillLockEntry>;
}

export class SkillsLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkillsLockError";
  }
}

export function getSkillsLockPath(cwd: string): string {
  return projectPath(cwd, "skills-lock.json");
}

export async function readSkillsLock(cwd: string): Promise<SkillsLockFile> {
  const path = getSkillsLockPath(cwd);
  if (!(await pathExists(path))) {
    return { version: SKILLS_LOCK_VERSION, skills: {} };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(await readTextFile(path));
  } catch {
    throw new SkillsLockError(`Invalid skills-lock.json at ${path}`);
  }
  return validateSkillsLock(raw, path);
}

function validateSkillsLock(raw: unknown, path: string): SkillsLockFile {
  if (!raw || typeof raw !== "object") {
    throw new SkillsLockError(`Invalid skills-lock.json at ${path}`);
  }
  const m = raw as Record<string, unknown>;
  const version =
    typeof m.version === "number" ? m.version : SKILLS_LOCK_VERSION;
  if (!m.skills || typeof m.skills !== "object") {
    throw new SkillsLockError(`Invalid skills map in ${path}`);
  }
  const skills: Record<string, SkillLockEntry> = {};
  for (const [name, entry] of Object.entries(m.skills as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") {
      throw new SkillsLockError(`Invalid lock entry for "${name}"`);
    }
    const e = entry as Record<string, unknown>;
    if (
      typeof e.source !== "string" ||
      typeof e.sourceType !== "string" ||
      typeof e.skillPath !== "string" ||
      typeof e.computedHash !== "string"
    ) {
      throw new SkillsLockError(`Invalid lock entry for "${name}"`);
    }
    skills[name] = {
      source: e.source,
      sourceType: e.sourceType as SkillSourceType,
      skillPath: e.skillPath,
      computedHash: e.computedHash,
      ref: typeof e.ref === "string" ? e.ref : undefined,
      sourceUrl: typeof e.sourceUrl === "string" ? e.sourceUrl : undefined,
    };
  }
  return { version, skills: sortSkillsKeys(skills) };
}

function sortSkillsKeys(
  skills: Record<string, SkillLockEntry>,
): Record<string, SkillLockEntry> {
  const sorted: Record<string, SkillLockEntry> = {};
  for (const key of Object.keys(skills).sort()) {
    sorted[key] = skills[key]!;
  }
  return sorted;
}

export function hashSkillFolder(files: Map<string, string>): string {
  const hash = createHash("sha256");
  const keys = [...files.keys()].sort();
  for (const key of keys) {
    hash.update(key);
    hash.update("\0");
    hash.update(files.get(key) ?? "");
    hash.update("\0");
  }
  return hash.digest("hex");
}

export async function writeSkillsLock(
  cwd: string,
  lock: SkillsLockFile,
): Promise<string> {
  const dest = getSkillsLockPath(cwd);
  const payload: SkillsLockFile & { $schema?: string } = {
    $schema: SKILLS_LOCK_V1_SCHEMA_URL,
    version: SKILLS_LOCK_VERSION,
    skills: sortSkillsKeys(lock.skills),
  };
  await writeTextFile(dest, `${JSON.stringify(payload, null, 2)}\n`);
  return dest;
}

export function mergeLockEntry(
  lock: SkillsLockFile,
  name: string,
  entry: SkillLockEntry,
): SkillsLockFile {
  return {
    ...lock,
    skills: sortSkillsKeys({ ...lock.skills, [name]: entry }),
  };
}

export function removeLockSkills(
  lock: SkillsLockFile,
  names: string[],
): SkillsLockFile {
  const next = { ...lock.skills };
  for (const n of names) {
    delete next[n];
  }
  return { version: lock.version, skills: sortSkillsKeys(next) };
}
