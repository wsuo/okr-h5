function hasRole(roles = [], roleCode) {
  return Array.isArray(roles) && roles.includes(roleCode);
}

function buildLeadNavigationItems({ roles = [], pendingTasksCount = 0, pathname = "" } = {}) {
  const items = [
    {
      key: "lead-home",
      label: "首页",
      path: "/lead",
      isActive: pathname === "/lead",
    },
    {
      key: "leader-evaluation",
      label: "领导评分",
      path: "/lead/evaluation",
      isActive: pathname.startsWith("/lead/evaluation"),
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
  ];

  if (hasRole(roles, "boss")) {
    items.push({
      key: "boss-evaluation",
      label: "老板评分",
      path: "/boss/evaluation",
      isActive: pathname.startsWith("/boss/evaluation"),
    });
  }

  if (hasRole(roles, "employee")) {
    items.push({
      key: "employee-home",
      label: "个人中心",
      path: "/employee",
      isActive: pathname.startsWith("/employee"),
    });
  }

  return items;
}

module.exports = {
  buildLeadNavigationItems,
};
