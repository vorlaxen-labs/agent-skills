import { createHash } from "node:crypto";
import { stripWatermark } from "../core/markdown.js";

export function hashContent(content: string): string {
  const normalized = stripWatermark(content).trim();
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
