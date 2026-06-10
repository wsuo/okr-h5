const assert = require("assert");

const { buildLeadNavigationItems } = require("./lead-navigation");

assert.deepStrictEqual(
  buildLeadNavigationItems({
    roles: ["boss", "leader"],
    pendingTasksCount: 2,
    pathname: "/lead/evaluation",
  }).map((item) => ({
    label: item.label,
    path: item.path,
    badge: item.badge,
    isActive: item.isActive,
  })),
  [
    { label: "首页", path: "/lead", badge: undefined, isActive: false },
    { label: "领导评分", path: "/lead/evaluation", badge: 2, isActive: true },
    { label: "老板评分", path: "/boss/evaluation", badge: undefined, isActive: false },
  ],
  "boss 从领导评分页面应能直接回到老板评分"
);

assert.deepStrictEqual(
  buildLeadNavigationItems({
    roles: ["leader"],
    pendingTasksCount: 0,
    pathname: "/lead",
  }).map((item) => item.label),
  ["首页", "领导评分"],
  "普通领导不应显示老板评分入口"
);

console.log("lead navigation rules passed");
