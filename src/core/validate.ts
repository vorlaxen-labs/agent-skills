import { PLATFORMS, SKILLS, type Platform } from "./bundled-catalog.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const PLATFORM_IDS = PLATFORMS.map((p) => p.id);
export const SKILL_IDS = SKILLS.map((s) => s.id);

function formatAvailable(ids: readonly string[]): string {
  return ids.join(", ");
}

export function parsePlatform(value: string): Platform {
  const normalized = value.trim();
  const found = PLATFORMS.find((p) => p.id === normalized);
  if (!found) {
    throw new ValidationError(
      `Unknown platform "${normalized}".\nAvailable: ${formatAvailable(PLATFORM_IDS)}`,
    );
  }
  return found.id;
}

export function parseSkillIds(raw: string[]): string[] {
  const ids = raw.map((s) => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    throw new ValidationError(
      `No skills selected.\nAvailable: ${formatAvailable(SKILL_IDS)}`,
    );
  }

  const unknown = ids.filter((id) => !SKILL_IDS.includes(id));
  if (unknown.length > 0) {
    const quoted = unknown.map((id) => `"${id}"`).join(", ");
    throw new ValidationError(
      `Unknown skill${unknown.length > 1 ? "s" : ""} ${quoted}.\nAvailable: ${formatAvailable(SKILL_IDS)}`,
    );
  }

  return ids;
}

/** Accept catalog ids or leftover installed ids (retired skills still in a project manifest). */
export function parseRemoveSkillIds(raw: string[]): string[] {
  const ids = raw.map((s) => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    throw new ValidationError(
      `No skills selected.\nAvailable: ${formatAvailable(SKILL_IDS)}`,
    );
  }

  return ids;
}
