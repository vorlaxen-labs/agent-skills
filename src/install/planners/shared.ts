import { projectPath } from "../../core/fs.js";
import { indexFilesByPath } from "../../source/types.js";
import type { InstallContext, PlannedWrite } from "../types.js";

export function getContent(
  index: Map<string, string>,
  path: string,
): string | undefined {
  return index.get(path.replace(/\\/g, "/"));
}

export function filesUnder(
  index: Map<string, string>,
  prefix: string,
): [string, string][] {
  const normalized = prefix.replace(/\\/g, "/");
  const out: [string, string][] = [];
  for (const [path, content] of index) {
    if (path.startsWith(`${normalized}/`)) {
      out.push([path.slice(normalized.length + 1), content]);
    }
  }
  return out;
}

export function planSkillTree(
  ctx: InstallContext,
  prefix: string,
  destDir: string,
): PlannedWrite[] {
  const index = indexFilesByPath(ctx.files);
  const planned: PlannedWrite[] = [];

  const skillMd = getContent(index, `${prefix}/SKILL.md`);
  if (skillMd) {
    planned.push({ dest: projectPath(destDir, "SKILL.md"), content: skillMd });
  }

  for (const [rel, content] of filesUnder(index, prefix)) {
    if (rel === "SKILL.md") continue;
    planned.push({ dest: projectPath(destDir, rel), content });
  }

  return planned;
}

export { stripFrontmatter } from "../../core/markdown.js";
