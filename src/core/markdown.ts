/** Invisible to readers — HTML comment appended to generated files. */
export const WATERMARK =
  "<!-- Created by Vorlaxen Labs Agent Skill Generator With Love <3 -->";

export function withWatermark(content: string): string {
  const trimmed = stripWatermark(content).replace(/\s+$/, "");
  return `${trimmed}\n\n${WATERMARK}\n`;
}

export function stripWatermark(content: string): string {
  return content.replace(new RegExp(`\\n*${escapeRegExp(WATERMARK)}\\n*`, "g"), "").trimEnd();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip YAML frontmatter from SKILL.md / .mdc content for portable paste targets. */
export function stripFrontmatter(content: string): string {
  if (!content.startsWith("---\n")) {
    return content;
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    return content;
  }
  return content.slice(end + 5);
}
