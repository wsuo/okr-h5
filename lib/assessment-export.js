function hasScoreValue(score) {
  return score !== null && score !== undefined;
}

function formatScore(score) {
  return hasScoreValue(score) ? String(score) : "";
}

function getFinalScoreForSort(participant) {
  return hasScoreValue(participant.final_score)
    ? Number(participant.final_score)
    : Number.NEGATIVE_INFINITY;
}

function escapeCSVField(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function generateAssessmentRankingCSV(assessment) {
  const headers = ["排名", "姓名", "部门", "自评得分", "领导得分", "老板评分", "最终得分"];
  const participants = Array.isArray(assessment?.participants) ? assessment.participants : [];
  const rows = participants
    .slice()
    .sort((left, right) => getFinalScoreForSort(right) - getFinalScoreForSort(left))
    .map((participant, index) => [
      index + 1,
      participant.user?.name || "",
      participant.user?.department?.name || "",
      formatScore(participant.self_score),
      formatScore(participant.leader_score),
      formatScore(participant.boss_score),
      formatScore(participant.final_score),
    ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCSVField).join(","))
    .join("\n");
}

module.exports = {
  generateAssessmentRankingCSV,
};
