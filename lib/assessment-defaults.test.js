const assert = require("assert");

const { buildDefaultAssessmentFields } = require("./assessment-defaults");

assert.deepStrictEqual(
  buildDefaultAssessmentFields(new Date("2026-06-08T10:00:00+08:00")),
  {
    title: "2026年05月绩效考核",
    period: "2026-05",
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    deadline: "2026-05-20",
  },
  "6月创建考核时，应默认填写5月考核参数"
);

assert.deepStrictEqual(
  buildDefaultAssessmentFields(new Date("2026-03-08T10:00:00+08:00")),
  {
    title: "2026年02月绩效考核",
    period: "2026-02",
    start_date: "2026-02-01",
    end_date: "2026-02-28",
    deadline: "2026-02-20",
  },
  "非闰年2月结束日期应为28号"
);

assert.deepStrictEqual(
  buildDefaultAssessmentFields(new Date("2024-03-08T10:00:00+08:00")),
  {
    title: "2024年02月绩效考核",
    period: "2024-02",
    start_date: "2024-02-01",
    end_date: "2024-02-29",
    deadline: "2024-02-20",
  },
  "闰年2月结束日期应为29号"
);

assert.deepStrictEqual(
  buildDefaultAssessmentFields(new Date("2026-01-08T10:00:00+08:00")),
  {
    title: "2025年12月绩效考核",
    period: "2025-12",
    start_date: "2025-12-01",
    end_date: "2025-12-31",
    deadline: "2025-12-20",
  },
  "1月创建考核时，应默认填写上一年12月考核参数"
);

console.log("assessment default field rules passed");
