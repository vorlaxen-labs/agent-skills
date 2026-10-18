import { projectPath } from "../../core/fs.js";
import { indexFilesByPath } from "../../source/types.js";
import type { InstallContext, Planner } from "../types.js";
import { getContent, stripFrontmatter } from "./shared.js";

export const planAgentsMd: Planner = (ctx) => {
  const index = indexFilesByPath(ctx.files);
  const parts: string[] = [];

  const globalBody = getContent(index, "AGENTS.md");
  if (globalBody) parts.push(globalBody.trim());

  for (const skill of ctx.skills) {
    if (skill.id === "global") continue;
    const skillMd = getContent(index, `${skill.paths[0]}/SKILL.md`);
    if (skillMd) parts.push(stripFrontmatter(skillMd).trim());
  }

  return [{ dest: projectPath(ctx.cwd, "AGENTS.md"), content: parts.join("\n\n---\n\n") }];
};
