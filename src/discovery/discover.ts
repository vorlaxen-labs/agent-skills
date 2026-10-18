import { parseSkillFrontmatter } from "./frontmatter.js";

export interface DiscoveredSkill {
  /** Frontmatter `name` */
  name: string;
  /** Path to SKILL.md inside the source tree (posix) */
  skillPath: string;
  /** Directory containing SKILL.md (posix) */
  folderPath: string;
  /** All files under folderPath: relative path from folder → content */
  files: Map<string, string>;
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  "vendor",
]);

const CONTAINER_PREFIXES = [
  "skills/",
  ".agents/skills/",
  "agent/skills/",
];

/**
 * Discover skills from a flat list of source files (posix relative paths).
 */
export function discoverSkillsFromFileList(
  entries: { relativePath: string; content: string }[],
): DiscoveredSkill[] {
  const skillMdPaths = entries
    .map((e) => e.relativePath.replace(/\\/g, "/"))
    .filter((p) => p.endsWith("/SKILL.md") || p === "SKILL.md");

  const byPath = new Map(
    entries.map((e) => [e.relativePath.replace(/\\/g, "/"), e.content]),
  );

  const discovered: DiscoveredSkill[] = [];

  for (const skillPath of skillMdPaths) {
    const folderPath =
      skillPath === "SKILL.md" ? "" : skillPath.slice(0, -"/SKILL.md".length);
    const content = byPath.get(skillPath);
    if (content === undefined) continue;

    const fm = parseSkillFrontmatter(content);
    if (!fm?.name) continue;

    if (!isAllowedSkillLocation(skillPath, folderPath)) {
      continue;
    }

    const prefix = folderPath ? `${folderPath}/` : "";
    const files = new Map<string, string>();
    for (const [rel, fileContent] of byPath) {
      if (folderPath !== "") {
        if (rel !== skillPath && !rel.startsWith(prefix)) continue;
        if (rel !== skillPath && rel.slice(prefix.length).includes("SKILL.md")) continue;
      } else if (rel !== skillPath && rel.includes("/")) {
        continue;
      }
      const parts = rel.split("/");
      if (parts.some((p) => SKIP_DIRS.has(p))) continue;
      const inner = folderPath === "" ? rel : rel.slice(prefix.length);
      if (!inner) continue;
      files.set(inner, fileContent);
    }

    discovered.push({
      name: fm.name,
      skillPath,
      folderPath,
      files,
    });
  }

  const byName = new Map<string, DiscoveredSkill>();
  for (const s of discovered) {
    byName.set(s.name, s);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function isAllowedSkillLocation(skillPath: string, folderPath: string): boolean {
  if (skillPath === "SKILL.md") {
    return true;
  }
  if (CONTAINER_PREFIXES.some((p) => skillPath.startsWith(p))) {
    const rest = skillPath.slice("skills/".length);
    const depth = rest.split("/").length - 1;
    return depth <= 3;
  }
  if (folderPath.split("/").filter(Boolean).length <= 2) {
    return true;
  }
  return false;
}
