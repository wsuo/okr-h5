const ASSIGNABLE_LEADER_ROLE_CODES = new Set(["leader", "boss"]);

function hasAssignableLeaderRole(user) {
  return Boolean(
    user?.roles?.some((role) => ASSIGNABLE_LEADER_ROLE_CODES.has(role.code))
  );
}

function isBossUser(user) {
  return Boolean(user?.roles?.some((role) => role.code === "boss"));
}

function isInDepartment(user, departmentId) {
  return !departmentId || user?.department?.id === departmentId;
}

function canAssignAsLeader(user, departmentId) {
  return isBossUser(user) || isInDepartment(user, departmentId);
}

function getAssignableLeaders({ leaders = [], users = [], departmentId } = {}) {
  const source =
    Array.isArray(leaders) && leaders.length > 0
      ? leaders
      : users.filter(hasAssignableLeaderRole);

  return source.filter((user) => canAssignAsLeader(user, departmentId));
}

module.exports = {
  getAssignableLeaders,
};
