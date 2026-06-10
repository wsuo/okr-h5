export interface LeadNavigationItem {
  key: string;
  label: string;
  path: string;
  isActive: boolean;
  badge?: number;
}

export function buildLeadNavigationItems(options?: {
  roles?: string[];
  pendingTasksCount?: number;
  pathname?: string;
}): LeadNavigationItem[];
