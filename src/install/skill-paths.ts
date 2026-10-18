import { relative } from "node:path";
import type { Platform, SkillDefinition } from "../core/bundled-catalog.js";
import { SKILLS } from "../core/bundled-catalog.js";
import { projectPath } from "../core/fs.js";
import type { InstallContext, PlannedWrite } from "./types.js";
import { planInstall } from "./planners/index.js";

export function planForSkill(
  platform: Platform,
  ctx: InstallContext,
  skillId: string,
): PlannedWrite[] {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) return [];

  const skillCtx: InstallContext = {
    cwd: ctx.cwd,
    skills: [skill],
    files: ctx.files,
  };

  if (platform === "agents-md" && skill.id !== "global") {
    return [];
  }

  return planInstall(platform, skillCtx);
}

export function planForSkills(
  platform: Platform,
  ctx: InstallContext,
  skillIds: string[],
): PlannedWrite[] {
  const filtered: InstallContext = {
    cwd: ctx.cwd,
    skills: SKILLS.filter((s) => skillIds.includes(s.id)),
    files: ctx.files,
  };
  return planInstall(platform, filtered);
}

export function assignWriteToSkill(
  dest: string,
  cwd: string,
  skills: SkillDefinition[],
): string | null {
  const rel = relative(cwd, dest).replace(/\\/g, "/");

  if (rel === "AGENTS.md" || rel === "CLAUDE.md" || rel === ".github/copilot-instructions.md") {
    return "global";
  }

  if (rel.startsWith(".cursor/skills/")) {
    const segment = rel.split("/")[2];
    const match = skills.find((s) => s.cursorSkillName === segment);
    return match?.id ?? null;
  }

  if (rel.startsWith(".cursor/rules/")) {
    return "global";
  }

  if (rel.startsWith(".claude/rules/")) {
    const base = rel.split("/").pop()?.replace(/\.md$/, "");
    const match = skills.find((s) => s.claudeRuleName.replace(/\.md$/, "") === base);
    return match?.id ?? "global";
  }

  return null;
}

export function buildWrittenBySkill(
  written: string[],
  cwd: string,
  skillIds: string[],
): Record<string, string[]> {
  const skills = SKILLS.filter((s) => skillIds.includes(s.id));
  const map: Record<string, string[]> = {};
  for (const id of skillIds) map[id] = [];

  for (const dest of written) {
    const owner = assignWriteToSkill(dest, cwd, skills);
    if (owner && map[owner]) {
      map[owner].push(dest);
    }
  }

  return map;
}

export function pathsForSkillRemoval(
  manifest: { writtenBySkill: Record<string, string[]>; platform: Platform },
  skillIds: string[],
): string[] {
  const paths = new Set<string>();
  for (const id of skillIds) {
    for (const p of manifest.writtenBySkill[id] ?? []) {
      paths.add(p);
    }
  }
  return [...paths];
}

export function agentRootPath(cwd: string, platform: Platform): string | null {
  switch (platform) {
    case "agents-md":
      return projectPath(cwd, "AGENTS.md");
    case "claude-code":
      return projectPath(cwd, "CLAUDE.md");
    case "copilot":
      return projectPath(cwd, ".github", "copilot-instructions.md");
    default:
      return null;
  }
}
