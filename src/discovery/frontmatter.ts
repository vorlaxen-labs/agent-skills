export interface SkillFrontmatter {
  name: string;
  description?: string;
}

export function parseSkillFrontmatter(content: string): SkillFrontmatter | null {
  if (!content.startsWith("---\n")) {
    return null;
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    return null;
  }
  const block = content.slice(4, end);
  const nameMatch = /^name:\s*(.+)$/m.exec(block);
  if (!nameMatch) {
    return null;
  }
  const name = nameMatch[1].trim().replace(/^['"]|['"]$/g, "");
  const descMatch = /^description:\s*(.+)$/ms.exec(block);
  const description = descMatch?.[1]?.trim();
  return { name, description };
}
