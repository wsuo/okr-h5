type AssignableLeaderUser = {
  department?: {
    id?: number;
  } | null;
  roles?: Array<{
    code?: string;
  }>;
};

export function getAssignableLeaders<T extends AssignableLeaderUser>(params?: {
  leaders?: T[];
  users?: T[];
  departmentId?: number;
}): T[];
