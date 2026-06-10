export interface BossNavigationItem {
  key: string;
  label: string;
  path: string;
  isActive: boolean;
  badge?: number;
}

export function buildBossNavigationItems(options?: {
  pathname?: string;
  bossTasksCount?: number;
  leaderTasksCount?: number;
}): BossNavigationItem[];
