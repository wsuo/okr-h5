export interface EmployeeNavigationItem {
  key: string;
  label: string;
  path: string;
  isActive: boolean;
  badge?: number;
}

export function buildEmployeeNavigationItems(options?: {
  roles?: string[];
  pendingTasksCount?: number;
  pathname?: string;
}): EmployeeNavigationItem[];
