import { projectPath } from "../../core/fs.js";
import { indexFilesByPath } from "../../source/types.js";
import type { InstallContext, PlannedWrite, Planner } from "../types.js";
import { getContent, planSkillTree } from "./shared.js";

export const planCursor: Planner = (ctx) => {
  const index = indexFilesByPath(ctx.files);
  const planned: PlannedWrite[] = [];

  for (const skill of ctx.skills) {
    if (skill.id === "global") {
      const rule = getContent(index, "rules/global.mdc");
      if (rule) {
        planned.push({
          dest: projectPath(ctx.cwd, ".cursor", "rules", "global.mdc"),
          content: rule,
        });
      }

      const globalSkill = getContent(index, "skills/global/SKILL.md");
      if (globalSkill) {
        const agentsDest = projectPath(ctx.cwd, ".agents", "skills", "global", "SKILL.md");
        planned.push({ dest: agentsDest, content: globalSkill });
        planned.push({
          dest: projectPath(ctx.cwd, ".cursor", "skills", "global", "SKILL.md"),
          content: globalSkill,
        });
      }
      continue;
    }

    planned.push(
      ...planSkillTree(
        ctx,
        skill.paths[0],
        projectPath(ctx.cwd, ".cursor", "skills", skill.cursorSkillName),
      ),
    );
  }

  return planned;
};
