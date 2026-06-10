const assert = require("assert");

const { sortBossTasksByLatestAssessment } = require("./boss-task-order");

const inputTasks = [
  { id: "april-a", assessment_period: "2026-04", deadline: "2026-04-20" },
  { id: "unknown-old", assessment_period: "", deadline: "2026-03-20" },
  { id: "may-a", assessment_period: "2026-05", deadline: "2026-05-20" },
  { id: "may-b", assessment_period: "2026-05", deadline: "2026-05-18" },
  { id: "invalid", assessment_period: "bad-value", deadline: "bad-date" },
];

const sortedTasks = sortBossTasksByLatestAssessment(inputTasks);

assert.deepStrictEqual(
  sortedTasks.map((task) => task.id),
  ["may-a", "may-b", "april-a", "unknown-old", "invalid"],
  "Boss评分任务应按考核周期倒序展示，最新月份排在前面"
);

assert.deepStrictEqual(
  inputTasks.map((task) => task.id),
  ["april-a", "unknown-old", "may-a", "may-b", "invalid"],
  "排序不应修改原始任务数组"
);

console.log("boss task order rules passed");
