function pad2(value) {
  return String(value).padStart(2, "0");
}

function buildDefaultAssessmentFields(now = new Date()) {
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = targetMonth.getFullYear();
  const month = targetMonth.getMonth() + 1;
  const monthName = pad2(month);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    title: `${year}年${monthName}月绩效考核`,
    period: `${year}-${monthName}`,
    start_date: `${year}-${monthName}-01`,
    end_date: `${year}-${monthName}-${pad2(lastDay)}`,
    deadline: `${year}-${monthName}-20`,
  };
}

module.exports = {
  buildDefaultAssessmentFields,
};
