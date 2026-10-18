export type Platform = "agents-md" | "cursor" | "claude-code" | "copilot";

export type SkillCategory = "standard";

export interface SkillDefinition {
  id: string;
  label: string;
  category: SkillCategory;
  paths: string[];
  cursorSkillName: string;
  claudeRuleName: string;
  defaultSelected: boolean;
}

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "agents-md", label: "AGENTS.md" },
  { id: "cursor", label: "Cursor" },
  { id: "claude-code", label: "Claude Code" },
  { id: "copilot", label: "Copilot" },
];

/** Bundled engineering standards shipped with the loader (default: global only). */
export const SKILLS: SkillDefinition[] = [
  {
    id: "global",
    label: "Global",
    category: "standard",
    paths: ["AGENTS.md", "skills/global", "rules/global.mdc"],
    cursorSkillName: "global",
    claudeRuleName: "global.md",
    defaultSelected: true,
  },
];

export const GITHUB = {
  owner: "vorlaxen-labs",
  repo: "agent-skills",
  branch: "main",
} as const;
