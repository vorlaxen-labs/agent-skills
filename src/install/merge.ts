import { stripWatermark } from "../core/markdown.js";
import type { AppendOrder } from "../conflict/types.js";

export const SECTION_SEPARATOR = "\n\n---\n\n";

function normalize(content: string): string {
  return stripWatermark(content).trim();
}

export function mergeContent(
  existing: string,
  incoming: string,
  order: AppendOrder,
): string {
  const cleanExisting = normalize(existing);
  const cleanIncoming = normalize(incoming);

  if (!cleanExisting) return cleanIncoming;
  if (!cleanIncoming) return cleanExisting;

  if (cleanExisting.includes(cleanIncoming) || cleanIncoming.includes(cleanExisting)) {
    return order === "existing-first" ? cleanExisting : cleanIncoming;
  }

  return order === "existing-first"
    ? `${cleanExisting}${SECTION_SEPARATOR}${cleanIncoming}`
    : `${cleanIncoming}${SECTION_SEPARATOR}${cleanExisting}`;
}

export function contentAlreadyPresent(existing: string, incoming: string): boolean {
  const cleanExisting = normalize(existing);
  const cleanIncoming = normalize(incoming);
  if (!cleanIncoming) return true;
  return cleanExisting.includes(cleanIncoming);
}
