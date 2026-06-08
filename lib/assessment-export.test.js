const assert = require("assert");

const { generateAssessmentRankingCSV } = require("./assessment-export");

const csv = generateAssessmentRankingCSV({
  participants: [
    {
      user: {
        name: "低分员工",
        department: { name: "运营部" },
      },
      self_score: 86,
      leader_score: 88,
      boss_score: 0,
      final_score: 88,
    },
    {
      user: {
        name: "高分,员工",
        department: { name: '销售"一部' },
      },
      self_score: 95.1,
      leader_score: 93.76,
      boss_score: 90,
      final_score: 93.3296,
    },
    {
      user: {
        name: "未出分员工",
        department: null,
      },
      self_score: null,
      leader_score: undefined,
      boss_score: undefined,
      final_score: undefined,
    },
  ],
});

assert.strictEqual(
  csv,
  [
    "排名,姓名,部门,自评得分,领导得分,老板评分,最终得分",
    '1,"高分,员工","销售""一部",95.1,93.76,90,93.3296',
    "2,低分员工,运营部,86,88,0,88",
    "3,未出分员工,,,,,",
  ].join("\n"),
  "导出的考核数据应按最终得分降序输出截图指定字段"
);

console.log("assessment ranking export rules passed");
