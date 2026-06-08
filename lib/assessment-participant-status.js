function isEvaluationCompleted(value) {
  return value === true || value === 1 || value === "1";
}

function isParticipantFullyCompleted(participant) {
  return (
    isEvaluationCompleted(participant?.self_completed) &&
    isEvaluationCompleted(participant?.leader_completed) &&
    isEvaluationCompleted(participant?.boss_completed)
  );
}

module.exports = {
  isEvaluationCompleted,
  isParticipantFullyCompleted,
};
