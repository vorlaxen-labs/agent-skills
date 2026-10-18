import { SKILLS } from "../core/bundled-catalog.js";

export function collectPaths(skillIds: string[]): string[] {
  const set = new Set<string>();
  for (const skill of SKILLS) {
    if (skillIds.includes(skill.id)) {
      for (const p of skill.paths) set.add(p);
    }
  }
  return [...set];
}
