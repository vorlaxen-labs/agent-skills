import { statSync } from "node:fs";
import { GITHUB } from "../core/bundled-catalog.js";
import { createBundledSource } from "./bundled.js";
import { createGitHubSource, type GitHubSourceOptions } from "./github.js";
import type { SkillSource } from "./types.js";

/** undefined/false → bundled; true → package version tag; string → explicit git ref */
export type RemoteRef = boolean | string | undefined;

export interface SourceOptions extends GitHubSourceOptions {}

export function resolveRemoteRef(
  remote: RemoteRef,
  packageVersion: string,
): string | null {
  if (remote === undefined || remote === false) {
    return null;
  }
  if (remote === true) {
    return `v${packageVersion}`;
  }
  return remote;
}

export function resolveSource(
  remote: RemoteRef,
  packageVersion: string,
  bundledRoot: string,
  options: SourceOptions = {},
): SkillSource {
  const ref = resolveRemoteRef(remote, packageVersion);

  if (ref === null) {
    try {
      statSync(bundledRoot);
      return createBundledSource(bundledRoot);
    } catch {
      return createGitHubSource(
        GITHUB.owner,
        GITHUB.repo,
        `v${packageVersion}`,
        options,
      );
    }
  }

  return createGitHubSource(GITHUB.owner, GITHUB.repo, ref, options);
}
