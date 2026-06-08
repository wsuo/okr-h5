const assert = require("assert");

const {
  isEvaluationCompleted,
  isParticipantFullyCompleted,
} = require("./assessment-participant-status");

assert.strictEqual(isEvaluationCompleted(0), false, "数字0应视为未完成");
assert.strictEqual(isEvaluationCompleted(1), true, "数字1应视为已完成");
assert.strictEqual(isEvaluationCompleted(false), false, "false应视为未完成");
assert.strictEqual(isEvaluationCompleted(true), true, "true应视为已完成");
assert.strictEqual(isEvaluationCompleted("0"), false, "字符串0应视为未完成");
assert.strictEqual(isEvaluationCompleted("1"), true, "字符串1应视为已完成");

assert.strictEqual(
  isParticipantFullyCompleted({
    self_completed: 0,
    leader_completed: 0,
    boss_completed: 0,
  }),
  false,
  "全部为数字0时不应渲染完成进度"
);

assert.strictEqual(
  isParticipantFullyCompleted({
    self_completed: 1,
    leader_completed: true,
    boss_completed: "1",
  }),
  true,
  "数字1、true、字符串1都应能组成已完成状态"
);

console.log("assessment participant status rules passed");
