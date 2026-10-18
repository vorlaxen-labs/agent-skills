import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import type { RemoteFile, SkillSource } from "./types.js";

const SKIP = new Set(["node_modules", ".git", "dist", "build", "__pycache__"]);

async function walkDir(root: string, base: string, files: RemoteFile[]): Promise<void> {
  const entries = await readdir(base, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = join(base, entry.name);
    if (entry.isDirectory()) {
      await walkDir(root, full, files);
    } else if (entry.isFile()) {
      const rel = relative(root, full).replace(/\\/g, "/");
      const content = await readFile(full, "utf8");
      files.push({ relativePath: rel, content });
    }
  }
}

export function createLocalSource(absoluteRoot: string): SkillSource {
  return {
    async fetch(paths: string[]): Promise<RemoteFile[]> {
      const rootStat = await stat(absoluteRoot);
      if (!rootStat.isDirectory()) {
        throw new Error(`Local source is not a directory: ${absoluteRoot}`);
      }

      if (paths.length === 0) {
        const files: RemoteFile[] = [];
        await walkDir(absoluteRoot, absoluteRoot, files);
        return files;
      }

      const files: RemoteFile[] = [];
      for (const rel of paths) {
        const target = join(absoluteRoot, rel);
        const st = await stat(target);
        if (st.isDirectory()) {
          await walkDir(absoluteRoot, target, files);
        } else {
          const content = await readFile(target, "utf8");
          files.push({
            relativePath: relative(absoluteRoot, target).replace(/\\/g, "/"),
            content,
          });
        }
      }
      return files;
    },
  };
}
