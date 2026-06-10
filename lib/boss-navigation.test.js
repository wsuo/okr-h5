const assert = require("assert");

const { buildBossNavigationItems } = require("./boss-navigation");

const navigationItems = buildBossNavigationItems({
  pathname: "/boss",
  bossTasksCount: 3,
  leaderTasksCount: 2,
});

assert.deepStrictEqual(
  navigationItems.map((item) => ({
    label: item.label,
    path: item.path,
    badge: item.badge,
    isActive: item.isActive,
  })),
  [
    { label: "工作台", path: "/boss", badge: undefined, isActive: true },
    { label: "老板评分", path: "/boss/evaluation", badge: 3, isActive: false },
    { label: "领导评分", path: "/lead/evaluation", badge: 2, isActive: false },
    { label: "报表分析", path: "/boss/reports", badge: undefined, isActive: false },
  ],
  "boss 作为直属领导时，应同时显示老板评分和领导评分入口"
);

assert.strictEqual(
  buildBossNavigationItems({
    pathname: "/lead/evaluation",
    bossTasksCount: 0,
    leaderTasksCount: 0,
  }).find((item) => item.path === "/lead/evaluation").isActive,
  true,
  "进入领导评分页面时，boss 导航中的领导评分入口应保持选中"
);

console.log("boss navigation rules passed");
