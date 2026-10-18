export interface HubSkillEntry {
  source: string;
  ref?: string;
  skill?: string;
  description?: string;
}

export interface HubCatalog {
  version: number;
  id: string;
  skills: Record<string, HubSkillEntry>;
}

export interface HubSubscription {
  hubId: string;
  source: string;
  ref: string;
  manifestPath: string;
  addedAt: string;
}

export interface HubsSubscriptionFile {
  version: number;
  hubs: Record<string, HubSubscription>;
}

export interface ResolvedHubInstall {
  alias: string;
  source: string;
  ref: string;
  skillName: string;
}
