function hasRole(roles = [], roleCode) {
  return Array.isArray(roles) && roles.includes(roleCode);
}

function buildEmployeeNavigationItems({ roles = [], pendingTasksCount = 0, pathname = "" } = {}) {
  const items = [
    {
      key: "employee-home",
      label: "首页",
      path: "/employee",
      isActive: pathname === "/employee",
    },
    {
      key: "employee-evaluation",
      label: "我的考核",
      path: "/employee/evaluation",
      isActive: pathname.startsWith("/employee/evaluation"),
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
  ];

  if (hasRole(roles, "leader")) {
    items.push({
      key: "leader-evaluation",
      label: "领导评分",
      path: "/lead/evaluation",
      isActive: pathname.startsWith("/lead/evaluation"),
    });
  }

  return items;
}

module.exports = {
  buildEmployeeNavigationItems,
};
