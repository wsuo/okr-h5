function buildBossNavigationItems({ pathname = "", bossTasksCount = 0, leaderTasksCount = 0 } = {}) {
  return [
    {
      key: "workbench",
      label: "工作台",
      path: "/boss",
      isActive: pathname === "/boss",
    },
    {
      key: "boss-evaluation",
      label: "老板评分",
      path: "/boss/evaluation",
      isActive: pathname.startsWith("/boss/evaluation"),
      badge: bossTasksCount > 0 ? bossTasksCount : undefined,
    },
    {
      key: "leader-evaluation",
      label: "领导评分",
      path: "/lead/evaluation",
      isActive: pathname.startsWith("/lead/evaluation"),
      badge: leaderTasksCount > 0 ? leaderTasksCount : undefined,
    },
    {
      key: "reports",
      label: "报表分析",
      path: "/boss/reports",
      isActive: pathname.startsWith("/boss/reports"),
    },
  ];
}

module.exports = {
  buildBossNavigationItems,
};
