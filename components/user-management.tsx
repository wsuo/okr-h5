"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Users, Edit, Trash2, Key, Building2 } from "lucide-react"
import DepartmentManagement from "./department-management-simple"

interface User {
  id: string
  name: string
  username: string
  role: "admin" | "boss" | "lead" | "employee"
  department?: string
  leaderId?: string
  leaderName?: string
  joinDate?: string
}

interface Department {
  id: string
  name: string
  description: string
  employeeCount: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    { id: "admin", name: "系统管理员", username: "admin", role: "admin", joinDate: "2023-01-01" },
    { id: "boss", name: "公司老板", username: "boss", role: "boss", joinDate: "2022-01-01" },
    { id: "lisi", name: "李四", username: "lisi", role: "lead", department: "技术部", joinDate: "2022-08-10" },
    { id: "zhaoliu", name: "赵六", username: "zhaoliu", role: "lead", department: "市场部", joinDate: "2022-12-05" },
    {
      id: "zhangsan",
      name: "张三",
      username: "zhangsan",
      role: "employee",
      department: "技术部",
      leaderId: "lisi",
      leaderName: "李四",
      joinDate: "2023-03-15",
    },
    {
      id: "wangwu",
      name: "王五",
      username: "wangwu",
      role: "employee",
      department: "技术部",
      leaderId: "lisi",
      leaderName: "李四",
      joinDate: "2023-05-20",
    },
  ])

  const [departments, setDepartments] = useState<Department[]>([
    { id: "tech", name: "技术部", description: "负责产品研发和技术支持", employeeCount: 3 },
    { id: "marketing", name: "市场部", description: "负责市场推广和销售", employeeCount: 1 },
    { id: "hr", name: "人事部", description: "负责人力资源管理", employeeCount: 0 },
    { id: "finance", name: "财务部", description: "负责财务管理和会计", employeeCount: 0 },
  ])

  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    role: "employee" as const,
    department: "",
    leaderId: "",
    joinDate: "",
  })

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  })

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false)

  // 添加编辑状态管理
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isEditDepartmentDialogOpen, setIsEditDepartmentDialogOpen] = useState(false)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">管理员</Badge>
      case "boss":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">老板</Badge>
      case "lead":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">领导</Badge>
      case "employee":
        return <Badge className="bg-green-100 text-green-800 border-green-200">员工</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getLeaders = () => {
    return users.filter((user) => user.role === "lead")
  }

  const handleAddUser = () => {
    const leaderName = newUser.leaderId ? users.find((u) => u.id === newUser.leaderId)?.name : undefined

    const user: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      department: newUser.department || undefined,
      leaderId: newUser.leaderId || undefined,
      leaderName,
      joinDate: newUser.joinDate,
    }

    setUsers([...users, user])

    // 更新部门员工数量
    if (newUser.department) {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.name === newUser.department ? { ...dept, employeeCount: dept.employeeCount + 1 } : dept,
        ),
      )
    }

    setNewUser({ name: "", username: "", role: "employee", department: "", leaderId: "", joinDate: "" })
    setIsUserDialogOpen(false)
  }

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user?.department) {
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.name === user.department ? { ...dept, employeeCount: Math.max(0, dept.employeeCount - 1) } : dept,
        ),
      )
    }
    setUsers(users.filter((user) => user.id !== userId))
  }

  const handleResetPassword = (userId: string) => {
    alert(`已重置用户 ${users.find((u) => u.id === userId)?.name} 的密码为：123456`)
  }

  const handleAddDepartment = () => {
    const department: Department = {
      id: `dept-${Date.now()}`,
      name: newDepartment.name,
      description: newDepartment.description,
      employeeCount: 0,
    }

    setDepartments([...departments, department])
    setNewDepartment({ name: "", description: "" })
    setIsDepartmentDialogOpen(false)
  }

  const handleDeleteDepartment = (departmentId: string) => {
    const department = departments.find((d) => d.id === departmentId)
    if (department && department.employeeCount > 0) {
      alert(`无法删除部门"${department.name}"，该部门还有 ${department.employeeCount} 名员工`)
      return
    }
    setDepartments(departments.filter((dept) => dept.id !== departmentId))
  }

  // 添加编辑用户的函数
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditUserDialogOpen(true)
  }

  const handleUpdateUser = () => {
    if (!editingUser) return

    const originalUser = users.find((u) => u.id === editingUser.id)
    const leaderName = editingUser.leaderId ? users.find((u) => u.id === editingUser.leaderId)?.name : undefined

    // 处理部门变更
    if (originalUser?.department !== editingUser.department) {
      // 从原部门减少员工数
      if (originalUser?.department) {
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.name === originalUser.department
              ? { ...dept, employeeCount: Math.max(0, dept.employeeCount - 1) }
              : dept,
          ),
        )
      }
      // 向新部门增加员工数
      if (editingUser.department) {
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.name === editingUser.department ? { ...dept, employeeCount: dept.employeeCount + 1 } : dept,
          ),
        )
      }
    }

    setUsers(users.map((user) => (user.id === editingUser.id ? { ...editingUser, leaderName } : user)))
    setEditingUser(null)
    setIsEditUserDialogOpen(false)
  }

  // 添加编辑部门的函数
  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setIsEditDepartmentDialogOpen(true)
  }

  const handleUpdateDepartment = () => {
    if (!editingDepartment) return

    const originalDepartment = departments.find((d) => d.id === editingDepartment.id)

    // 如果部门名称发生变更，需要更新所有相关用户的部门信息
    if (originalDepartment?.name !== editingDepartment.name) {
      setUsers(
        users.map((user) =>
          user.department === originalDepartment?.name ? { ...user, department: editingDepartment.name } : user,
        ),
      )
    }

    setDepartments(departments.map((dept) => (dept.id === editingDepartment.id ? editingDepartment : dept)))
    setEditingDepartment(null)
    setIsEditDepartmentDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          用户管理
        </CardTitle>
        <CardDescription>管理系统用户账户、权限和部门信息</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="departments">部门管理</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">用户列表</h3>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新用户</DialogTitle>
                    <DialogDescription>创建一个新的系统用户账户</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input
                        id="name"
                        placeholder="请输入姓名"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        placeholder="请输入用户名（登录账号）"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joinDate">入职时间</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={newUser.joinDate}
                        onChange={(e) => setNewUser({ ...newUser, joinDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">角色</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">员工</SelectItem>
                          <SelectItem value="lead">部门领导</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="boss">老板</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newUser.role === "lead" || newUser.role === "employee") && (
                      <div className="space-y-2">
                        <Label htmlFor="department">部门</Label>
                        <Select
                          value={newUser.department}
                          onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择部门" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {newUser.role === "employee" && (
                      <div className="space-y-2">
                        <Label htmlFor="leader">直属领导</Label>
                        <Select
                          value={newUser.leaderId}
                          onValueChange={(value) => setNewUser({ ...newUser, leaderId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择直属领导" />
                          </SelectTrigger>
                          <SelectContent>
                            {getLeaders()
                              .filter((leader) => leader.department === newUser.department)
                              .map((leader) => (
                                <SelectItem key={leader.id} value={leader.id}>
                                  {leader.name} ({leader.department})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      onClick={handleAddUser}
                      className="w-full"
                      disabled={!newUser.name || !newUser.username || !newUser.joinDate}
                    >
                      添加用户
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                    <div className="flex items-center gap-2">{getRoleBadge(user.role)}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                    {user.department && (
                      <div>
                        <span className="text-gray-600">部门：</span>
                        <span className="font-medium">{user.department}</span>
                      </div>
                    )}
                    {user.leaderName && (
                      <div>
                        <span className="text-gray-600">直属领导：</span>
                        <span className="font-medium">{user.leaderName}</span>
                      </div>
                    )}
                    {user.joinDate && (
                      <div>
                        <span className="text-gray-600">入职时间：</span>
                        <span className="font-medium">{user.joinDate}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">角色：</span>
                      <span className="font-medium">
                        {user.role === "admin"
                          ? "管理员"
                          : user.role === "boss"
                            ? "老板"
                            : user.role === "lead"
                              ? "部门领导"
                              : "员工"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                      <Edit className="w-4 h-4 mr-1" />
                      编辑
                    </Button>
                    {/* 添加编辑用户对话框 */}
                    <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>编辑用户信息</DialogTitle>
                          <DialogDescription>修改用户的基本信息和权限设置</DialogDescription>
                        </DialogHeader>
                        {editingUser && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">姓名</Label>
                              <Input
                                id="edit-name"
                                placeholder="请输入姓名"
                                value={editingUser.name}
                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-username">用户名</Label>
                              <Input
                                id="edit-username"
                                placeholder="请输入用户名（登录账号）"
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-joinDate">入职时间</Label>
                              <Input
                                id="edit-joinDate"
                                type="date"
                                value={editingUser.joinDate || ""}
                                onChange={(e) => setEditingUser({ ...editingUser, joinDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-role">角色</Label>
                              <Select
                                value={editingUser.role}
                                onValueChange={(value: any) =>
                                  setEditingUser({
                                    ...editingUser,
                                    role: value,
                                    department:
                                      value === "admin" || value === "boss" ? undefined : editingUser.department,
                                    leaderId: value !== "employee" ? undefined : editingUser.leaderId,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="选择角色" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">员工</SelectItem>
                                  <SelectItem value="lead">部门领导</SelectItem>
                                  <SelectItem value="admin">管理员</SelectItem>
                                  <SelectItem value="boss">老板</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {(editingUser.role === "lead" || editingUser.role === "employee") && (
                              <div className="space-y-2">
                                <Label htmlFor="edit-department">部门</Label>
                                <Select
                                  value={editingUser.department || ""}
                                  onValueChange={(value) =>
                                    setEditingUser({
                                      ...editingUser,
                                      department: value,
                                      leaderId: editingUser.role === "employee" ? "" : editingUser.leaderId,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择部门" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.name}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {editingUser.role === "employee" && editingUser.department && (
                              <div className="space-y-2">
                                <Label htmlFor="edit-leader">直属领导</Label>
                                <Select
                                  value={editingUser.leaderId || ""}
                                  onValueChange={(value) => setEditingUser({ ...editingUser, leaderId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择直属领导" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getLeaders()
                                      .filter((leader) => leader.department === editingUser.department)
                                      .map((leader) => (
                                        <SelectItem key={leader.id} value={leader.id}>
                                          {leader.name} ({leader.department})
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                                取消
                              </Button>
                              <Button onClick={handleUpdateUser} disabled={!editingUser.name || !editingUser.username}>
                                保存修改
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id)}>
                      <Key className="w-4 h-4 mr-1" />
                      重置密码
                    </Button>
                    {user.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
