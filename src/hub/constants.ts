export const HUB_CATALOG_FILENAME = "agent-skills.hub.json";
export const HUBS_SUBSCRIPTION_FILENAME = "agent-skills-hubs.json";
export const HUB_SUBSCRIPTION_VERSION = 1;
export const HUB_CATALOG_VERSION = 1;
export const HUB_DEFAULT_ORG = "vorlaxen-labs";

export function defaultHubRepoSource(hubId: string): string {
  return `${HUB_DEFAULT_ORG}/${hubId}`;
}
