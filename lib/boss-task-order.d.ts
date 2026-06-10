export function sortBossTasksByLatestAssessment<T extends {
  assessment_period?: string;
  deadline?: string;
}>(tasks?: T[]): T[];
