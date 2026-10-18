import { defaultHubRepoSource } from "./constants.js";
import { parseSource } from "../source/parse-source.js";

const GITHUB_SHORTHAND = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;

export interface ResolvedHubAddTarget {
  source: string;
  /** Expected after catalog fetch; may differ when adding by owner/repo */
  hubIdHint?: string;
}

export function resolveHubAddInput(input: string): ResolvedHubAddTarget {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Hub id or source is required.");
  }

  if (
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("/") ||
    GITHUB_SHORTHAND.test(trimmed) ||
    trimmed.startsWith("https://github.com/")
  ) {
    parseSource(trimmed);
    return { source: trimmed };
  }

  return { source: defaultHubRepoSource(trimmed), hubIdHint: trimmed };
}
