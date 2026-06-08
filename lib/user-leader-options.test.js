const assert = require("assert");

const { getAssignableLeaders } = require("./user-leader-options");

const users = [
  {
    id: 2,
    name: "公司老板",
    department: null,
    roles: [{ code: "boss" }],
  },
  {
    id: 3,
    name: "技术经理",
    department: { id: 1, name: "技术部" },
    roles: [{ code: "leader" }],
  },
  {
    id: 4,
    name: "市场经理",
    department: { id: 2, name: "市场部" },
    roles: [{ code: "leader" }],
  },
  {
    id: 5,
    name: "普通员工",
    department: { id: 1, name: "技术部" },
    roles: [{ code: "employee" }],
  },
];

const directLeaders = users.slice(0, 3);

function ids(items) {
  return items.map((item) => item.id);
}

assert.deepStrictEqual(
  ids(getAssignableLeaders({ leaders: directLeaders, users: [], departmentId: 1 })),
  [2, 3],
  "公司老板没有同部门时，仍应出现在直属领导候选中"
);

assert.deepStrictEqual(
  ids(getAssignableLeaders({ leaders: [], users, departmentId: 1 })),
  [2, 3],
  "接口候选为空时，回退用户列表也应允许 boss 作为直属领导"
);

assert.deepStrictEqual(
  ids(getAssignableLeaders({ leaders: directLeaders, users: [], departmentId: undefined })),
  [2, 3, 4],
  "未选择部门时，应展示全部可评分上级"
);

console.log("user leader option rules passed");
