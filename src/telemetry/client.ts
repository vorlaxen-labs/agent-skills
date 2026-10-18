import { logVerbose } from "../core/output.js";
import type { TelemetryEvent } from "./types.js";

export const TELEMETRY_URL = "https://api.vorlaxen.com/api/v1/telemetry/events";
export const TELEMETRY_TIMEOUT_MS = 3000;

export async function sendTelemetryEvent(
  event: TelemetryEvent,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);

  try {
    const response = await fetchFn(TELEMETRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: controller.signal,
    });

    if (!response.ok) {
      logVerbose(`Telemetry request failed with status ${response.status}`);
    }
  } catch (err) {
    logVerbose(
      `Telemetry request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
