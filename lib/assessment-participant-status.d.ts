export function isEvaluationCompleted(value: unknown): boolean;

export function isParticipantFullyCompleted(participant?: {
  self_completed?: unknown;
  leader_completed?: unknown;
  boss_completed?: unknown;
} | null): boolean;
