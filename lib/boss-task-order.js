function parsePeriodValue(period) {
  if (typeof period !== "string") return Number.NEGATIVE_INFINITY;
  const match = period.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return Number.NEGATIVE_INFINITY;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return Number.NEGATIVE_INFINITY;
  }

  return year * 100 + month;
}

function parseDeadlineValue(deadline) {
  const timestamp = new Date(deadline || "").getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function sortBossTasksByLatestAssessment(tasks = []) {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((left, right) => {
      const periodDiff =
        parsePeriodValue(right.task.assessment_period) -
        parsePeriodValue(left.task.assessment_period);
      if (periodDiff !== 0) return periodDiff;

      const deadlineDiff =
        parseDeadlineValue(right.task.deadline) -
        parseDeadlineValue(left.task.deadline);
      if (deadlineDiff !== 0) return deadlineDiff;

      return left.index - right.index;
    })
    .map(({ task }) => task);
}

module.exports = {
  sortBossTasksByLatestAssessment,
};
