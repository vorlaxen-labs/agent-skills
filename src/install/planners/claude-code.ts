import { projectPath } from "../../core/fs.js";
import { indexFilesByPath } from "../../source/types.js";
import type { InstallContext, PlannedWrite, Planner } from "../types.js";
import { getContent, stripFrontmatter } from "./shared.js";

export const planClaudeCode: Planner = (ctx) => {
  const index = indexFilesByPath(ctx.files);
  const planned: PlannedWrite[] = [];
  const claudeParts: string[] = [];

  const globalBody = getContent(index, "AGENTS.md");
  if (globalBody) claudeParts.push(globalBody.trim());

  for (const skill of ctx.skills) {
    if (skill.id === "global") continue;
    const skillMd = getContent(index, `${skill.paths[0]}/SKILL.md`);
    if (!skillMd) continue;
    planned.push({
      dest: projectPath(ctx.cwd, ".claude", "rules", skill.claudeRuleName),
      content: stripFrontmatter(skillMd).trim(),
    });
  }

  if (claudeParts.length > 0) {
    planned.push({
      dest: projectPath(ctx.cwd, "CLAUDE.md"),
      content: claudeParts.join("\n\n"),
    });
  }

  return planned;
};
