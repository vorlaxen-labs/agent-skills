import type { Platform } from "../../core/bundled-catalog.js";
import type { InstallContext, Planner } from "../types.js";
import { planAgentsMd } from "./agents-md.js";
import { planClaudeCode } from "./claude-code.js";
import { planCopilot } from "./copilot.js";
import { planCursor } from "./cursor.js";

const PLANNERS: Record<Platform, Planner> = {
  "agents-md": planAgentsMd,
  cursor: planCursor,
  "claude-code": planClaudeCode,
  copilot: planCopilot,
};

export function planInstall(platform: Platform, ctx: InstallContext) {
  return PLANNERS[platform](ctx);
}
