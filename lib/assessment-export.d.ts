export function generateAssessmentRankingCSV(assessment: {
  participants?: Array<{
    user?: {
      name?: string;
      department?: {
        name?: string;
      } | null;
    };
    self_score?: number | string | null;
    leader_score?: number | string | null;
    boss_score?: number | string | null;
    final_score?: number | string | null;
  }>;
}): string;
