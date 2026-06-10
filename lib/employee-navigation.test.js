const assert = require("assert");

const { buildEmployeeNavigationItems } = require("./employee-navigation");

assert.deepStrictEqual(
  buildEmployeeNavigationItems({
    roles: ["employee", "leader"],
    pendingTasksCount: 1,
    pathname: "/employee",
  }).map((item) => ({
    label: item.label,
    path: item.path,
    badge: item.badge,
    isActive: item.isActive,
  })),
  [
    { label: "首页", path: "/employee", badge: undefined, isActive: true },
    { label: "我的考核", path: "/employee/evaluation", badge: 1, isActive: false },
    { label: "领导评分", path: "/lead/evaluation", badge: undefined, isActive: false },
  ],
  "员工兼领导时，应能从员工页面进入领导评分"
);

assert.deepStrictEqual(
  buildEmployeeNavigationItems({
    roles: ["employee"],
    pendingTasksCount: 0,
    pathname: "/employee",
  }).map((item) => item.label),
  ["首页", "我的考核"],
  "普通员工不应显示领导评分入口"
);

console.log("employee navigation rules passed");
