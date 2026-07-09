function hasScoreValue(score) {
  return score !== null && score !== undefined && score !== "";
}

function formatScore(score) {
  return hasScoreValue(score) ? String(score) : "";
}

function toNumber(score) {
  if (!hasScoreValue(score)) return null;
  const num = Number(score);
  return Number.isFinite(num) ? num : null;
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

/**
 * 解析考核模板配置中的权重
 * 支持传统模式和两层加权模式
 */
function parseWeights(templateConfig) {
  const config =
    typeof templateConfig === "string" ? JSON.parse(templateConfig) : templateConfig;

  if (!config?.scoring_rules) {
    // 默认权重：传统模式 40% 自评 + 60% 领导
    return {
      mode: "traditional",
      selfWeight: 0.4,
      leaderWeight: 0.6,
      bossWeight: 0,
    };
  }

  const rules = config.scoring_rules;

  if (rules.scoring_mode === "two_tier_weighted" && rules.two_tier_config) {
    const tc = rules.two_tier_config;
    return {
      mode: "two_tier_weighted",
      // 两层模式：老板评分权重
      bossWeight: (tc.boss_weight ?? 0) / 100,
      // 员工+领导层的权重
      employeeLeaderWeight: (tc.employee_leader_weight ?? 100) / 100,
      // 员工层内部：自评占比
      selfWeight: (tc.self_weight_in_employee_leader ?? 40) / 100,
      // 员工层内部：领导占比
      leaderWeight: (tc.leader_weight_in_employee_leader ?? 60) / 100,
    };
  }

  // 传统模式
  return {
    mode: "traditional",
    selfWeight: rules.self_evaluation?.weight_in_final ?? 0.4,
    leaderWeight: rules.leader_evaluation?.weight_in_final ?? 0.6,
    bossWeight: 0,
  };
}

/**
 * 根据权重计算最终得分
 */
function calculateFinalScore({ selfScore, leaderScore, bossScore, weights }) {
  const self = toNumber(selfScore);
  const leader = toNumber(leaderScore);
  const boss = toNumber(bossScore);

  if (weights.mode === "two_tier_weighted") {
    // 两层加权：老板权重 + (自评*self比例 + 领导*leader比例) * 员工领导层权重
    const employeeLayer =
      (self ?? 0) * weights.selfWeight + (leader ?? 0) * weights.leaderWeight;
    const final = (boss ?? 0) * weights.bossWeight + employeeLayer * weights.employeeLeaderWeight;
    return final;
  }

  // 传统模式：自评*self比例 + 领导*leader比例
  const final = (self ?? 0) * weights.selfWeight + (leader ?? 0) * weights.leaderWeight;
  return final;
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

/**
 * 生成带公式的 Excel 考核排名数据
 * @param {object} assessment 考核详情
 * @param {number} defaultBossScore 默认老板评分（缺省老板评分时使用）
 * @returns {ArrayBuffer} Excel 文件二进制数据
 */
function generateAssessmentRankingExcel(assessment, defaultBossScore = 90) {
  const XLSX = require("xlsx");

  const weights = parseWeights(assessment?.template_config);
  const participants = Array.isArray(assessment?.participants) ? assessment.participants : [];
  const defaultBossNum = Number(defaultBossScore);

  // 构建工作表数据：先准备值，再给最终得分/排名列写入公式
  // 列顺序：A排名 B姓名 C部门 D自评得分 E领导得分 F实际老板评分 G默认老板评分 H最终得分 I原始最终得分
  const headers = [
    "排名",
    "姓名",
    "部门",
    "自评得分",
    "领导得分",
    "实际老板评分",
    "默认老板评分",
    "最终得分",
    "系统最终得分",
  ];

  // 先计算填充后的最终得分用于排序（仅用于行排序，公式里不依赖此值）
  const enrichedParticipants = participants.map((p) => {
    const actualBoss = toNumber(p.boss_score);
    const usedBoss = actualBoss ?? defaultBossNum;
    const final = calculateFinalScore({
      selfScore: p.self_score,
      leaderScore: p.leader_score,
      bossScore: usedBoss,
      weights,
    });
    return {
      participant: p,
      actualBoss,
      usedBoss,
      final,
    };
  });

  // 按最终得分降序排列
  enrichedParticipants.sort((left, right) => right.final - left.final);

  const rows = enrichedParticipants.map(({ participant, actualBoss, usedBoss }, index) => {
    const rowIndex = index + 2; // 第1行是表头，数据从第2行开始

    const selfScoreCell = `D${rowIndex}`;
    const leaderScoreCell = `E${rowIndex}`;
    const actualBossCell = `F${rowIndex}`;
    const defaultBossCell = `G${rowIndex}`;
    const finalScoreCell = `H${rowIndex}`;

    // 默认老板评分列：如果实际有值则显示空，否则显示默认值
    const defaultBossValue = actualBoss !== null ? "" : defaultBossNum;

    // 最终得分公式：优先用实际老板评分，没有则用默认老板评分
    let finalFormula;
    if (weights.mode === "two_tier_weighted") {
      const bw = weights.bossWeight;
      const elw = weights.employeeLeaderWeight;
      const sw = weights.selfWeight;
      const lw = weights.leaderWeight;
      // IF(F2="",G2,F2) 选择实际或默认老板评分
      const bossRef = `IF(ISNUMBER(${actualBossCell}),${actualBossCell},${defaultBossCell})`;
      finalFormula = `=(${bossRef}*${bw}+(${selfScoreCell}*${sw}+${leaderScoreCell}*${lw})*${elw})`;
    } else {
      const sw = weights.selfWeight;
      const lw = weights.leaderWeight;
      finalFormula = `=(${selfScoreCell}*${sw}+${leaderScoreCell}*${lw})`;
    }

    // 排名公式：按最终得分降序排名
    const lastRow = enrichedParticipants.length + 1;
    const rankFormula = `=RANK(${finalScoreCell},$H$2:$H$${lastRow},0)`;

    return {
      A: { f: rankFormula },
      B: participant.user?.name || "",
      C: participant.user?.department?.name || "",
      D: toNumber(participant.self_score) ?? "",
      E: toNumber(participant.leader_score) ?? "",
      F: actualBoss ?? "",
      G: defaultBossValue,
      H: { f: finalFormula },
      I: toNumber(participant.final_score) ?? "",
    };
  });

  const worksheetData = [headers];
  rows.forEach((row) => {
    worksheetData.push([
      row.A,
      row.B,
      row.C,
      row.D,
      row.E,
      row.F,
      row.G,
      row.H,
      row.I,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 设置列宽
  worksheet["!cols"] = [
    { wch: 8 },   // 排名
    { wch: 12 },  // 姓名
    { wch: 16 },  // 部门
    { wch: 12 },  // 自评得分
    { wch: 12 },  // 领导得分
    { wch: 14 },  // 实际老板评分
    { wch: 14 },  // 默认老板评分
    { wch: 12 },  // 最终得分
    { wch: 14 },  // 系统最终得分
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "考核排名");

  // 生成二进制文件
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

module.exports = {
  generateAssessmentRankingCSV,
  generateAssessmentRankingExcel,
};
