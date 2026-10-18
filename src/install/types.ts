import type { SkillDefinition } from "../core/bundled-catalog.js";
import type { RemoteFile } from "../source/types.js";
import type { PlannedAction, PlannedWrite } from "./planned.js";

export type { PlannedAction, PlannedWrite } from "./planned.js";

export interface InstallContext {
  cwd: string;
  skills: SkillDefinition[];
  files: RemoteFile[];
}

export interface InstallResult {
  written: string[];
  skipped: string[];
  planned?: PlannedAction[];
}

export type Planner = (ctx: InstallContext) => PlannedWrite[];
