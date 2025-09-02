"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Users, Edit, Trash2, Key, UserX, UserCheck, Loader2, RotateCcw } from "lucide-react"
import DepartmentManagement from "./department-management-simple"
import { User, userService, userUtils, CreateUserDto, UpdateUserDto } from "@/lib/user"
import { Role, roleService } from "@/lib/role"
import { Department, departmentService } from "@/lib/department"
import { toast } from "sonner"

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaders, setLeaders] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [resetPasswordResult, setResetPasswordResult] = useState("")

  // 表单数据
  const [formData, setFormData] = useState<CreateUserDto>({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    department_id: undefined,
    leader_id: undefined,
    role_ids: [],
    join_date: "",
  })

  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>()
  const [selectedRole, setSelectedRole] = useState<string | undefined>()

  // 手动搜索
  const handleSearch = () => {
    setCurrentPage(1)
    fetchUsers()
  }

  // 重置搜索条件
  const handleReset = () => {
    setSearchQuery("")
    setSelectedDepartment(undefined)
    setSelectedRole(undefined)
    setCurrentPage(1)
    // 重置后立即获取所有用户
    setTimeout(() => {
      fetchUsers()
    }, 0)
  }

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError("")
      
      // 构建查询参数，过滤掉空值
      const queryParams: any = {
        page: currentPage,
        limit: 10,
      }
      
      if (searchQuery && searchQuery.trim()) {
        queryParams.search = searchQuery.trim()
      }
      
      if (selectedDepartment) {
        queryParams.department_id = selectedDepartment
      }
      
      if (selectedRole) {
        queryParams.role = selectedRole
      }
      
      const response = await userService.getUsers(queryParams)
      if (response.data) {
        setUsers(response.data.items || [])
        setTotalPages(response.data.totalPages || 1)
      }
    } catch (error: any) {
      console.error('Fetch users error:', error)
      setError(error.message || "获取用户列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const response = await roleService.getRoles()
      console.log('Roles API response:', response)
      if (response.data) {
        // 根据角色API的响应结构调整
        const rolesData = response.data.data || response.data.items || response.data
        console.log('Roles data:', rolesData)
        setRoles(rolesData)
      }
    } catch (error: any) {
      console.error('Fetch roles error:', error)
    }
  }

  // 获取领导列表
  const fetchLeaders = async () => {
    try {
      const response = await userService.getLeaders()
      console.log('Leaders API response:', response)
      if (response.data) {
        const leadersData = response.data.data || response.data
        console.log('Leaders data:', leadersData)
        setLeaders(leadersData)
      }
    } catch (error: any) {
      console.error('Fetch leaders error:', error)
    }
  }

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments()
      console.log('Departments API response:', response)
      if (response.data && response.data.data) {
        console.log('Departments data:', response.data.data)
        setDepartments(response.data.data)
      }
    } catch (error: any) {
      console.error('Fetch departments error:', error)
    }
  }

  // 初始化数据
  useEffect(() => {
    fetchRoles()
    fetchLeaders()
    fetchDepartments()
  }, [])

  // 搜索条件变化时重置到第一页（部门和角色筛选立即触发）
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDepartment, selectedRole])

  // 当页码变化时获取用户数据
  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  // 部门和角色筛选变化时立即搜索
  useEffect(() => {
    if (currentPage === 1) {
      fetchUsers()
    }
  }, [selectedDepartment, selectedRole])

  // 重置表单
  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      position: "",
      department_id: undefined,
      leader_id: undefined,
      role_ids: [],
      join_date: "",
    })
    setEditingUser(null)
  }

  // 创建用户
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.username.trim()) {
      setError("姓名和用户名不能为空")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      
      // 过滤掉空字符串字段，只传递有值的字段
      const createData: any = {
        username: formData.username.trim(),
        password: formData.password.trim(),
        name: formData.name.trim(),
        role_ids: formData.role_ids,
      }
      
      // 只有当字段有值时才添加到请求数据中
      if (formData.email?.trim()) createData.email = formData.email.trim()
      if (formData.phone?.trim()) createData.phone = formData.phone.trim()
      if (formData.position?.trim()) createData.position = formData.position.trim()
      if (formData.department_id) createData.department_id = formData.department_id
      if (formData.leader_id) createData.leader_id = formData.leader_id
      if (formData.join_date?.trim()) createData.join_date = formData.join_date.trim()
      
      await userService.createUser(createData as CreateUserDto)
      setIsCreateDialogOpen(false)
      resetForm()
      // 创建成功后刷新用户和领导列表，保证下拉框有最新领导
      fetchUsers()
      fetchLeaders()
      toast.success("创建成功", {
        description: `用户 "${formData.name}" 已成功创建`
      })
    } catch (error: any) {
      console.error('Create user error:', error)
      setError(error.message || "创建用户失败")
      toast.error("创建失败", {
        description: error.message || "创建用户失败，请稍后重试"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 更新用户
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !formData.name.trim()) {
      setError("姓名不能为空")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      
      // 过滤掉空字符串字段，只传递有值的字段
      const updateData: any = {
        name: formData.name.trim(),
        role_ids: formData.role_ids,
      }
      
      // 只有当字段有值时才添加到请求数据中
      if (formData.email?.trim()) updateData.email = formData.email.trim()
      if (formData.phone?.trim()) updateData.phone = formData.phone.trim()
      if (formData.position?.trim()) updateData.position = formData.position.trim()
      if (formData.department_id) updateData.department_id = formData.department_id
      if (formData.leader_id) updateData.leader_id = formData.leader_id
      if (formData.join_date?.trim()) updateData.join_date = formData.join_date.trim()
      
      await userService.updateUser(editingUser.id, updateData as UpdateUserDto)
      setIsEditDialogOpen(false)
      // 更新后刷新用户和领导列表（角色/部门变更会影响领导列表）
      fetchUsers()
      fetchLeaders()
      toast.success("更新成功", {
        description: `用户 "${formData.name}" 信息已成功更新`
      })
    } catch (error: any) {
      console.error('Update user error:', error)
      setError(error.message || "更新用户失败")
      toast.error("更新失败", {
        description: error.message || "更新用户失败，请稍后重试"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 删除用户
  const handleDelete = async (user: User) => {
    try {
      setError("")
      await userService.deleteUser(user.id)
      fetchUsers()
      toast.success("删除成功", {
        description: `用户 "${user.name}" 已成功删除`
      })
    } catch (error: any) {
      console.error('Delete user error:', error)
      setError(error.message || "删除用户失败")
      toast.error("删除失败", {
        description: error.message || "删除用户失败，请稍后重试"
      })
    }
  }

  // 编辑用户
  const handleEdit = (user: User) => {
    console.log('Editing user:', user)
    setEditingUser(user)
    setError("")  // 重置错误状态
    const editFormData = {
      username: user.username,
      password: "", // 编辑时不需要密码
      name: user.name,
      email: user.email || "",
      phone: user.phone || "",
      position: user.position || "",
      department_id: user.department?.id,
      leader_id: user.leader?.id,
      role_ids: user.roles ? user.roles.map(role => role.id) : [],
      join_date: user.join_date ? user.join_date.split('T')[0] : "",
    }
    console.log('Edit form data:', editFormData)
    setFormData(editFormData)
    setIsEditDialogOpen(true)
  }

  // 重置密码
  const handleResetPassword = async (user: User) => {
    try {
      setError("")
      await userService.resetPassword(user.id, { password: "123456" })
      setResetPasswordResult(`已重置用户 ${user.name} 的密码为：123456`)
      setIsResetPasswordDialogOpen(true)
      toast.success("重置成功", {
        description: `用户 "${user.name}" 的密码已重置为 123456`
      })
    } catch (error: any) {
      console.error('Reset password error:', error)
      setError(error.message || "重置密码失败")
      toast.error("重置失败", {
        description: error.message || "重置密码失败，请稍后重试"
      })
    }
  }

  // 切换用户状态
  const handleToggleStatus = async (user: User) => {
    try {
      setError("")
      await userService.toggleUserStatus(user.id)
      fetchUsers()
      const newStatus = user.status === 1 ? "禁用" : "启用"
      toast.success("状态更新成功", {
        description: `用户 "${user.name}" 已${newStatus}`
      })
    } catch (error: any) {
      console.error('Toggle status error:', error)
      setError(error.message || "切换状态失败")
      toast.error("状态更新失败", {
        description: error.message || "切换用户状态失败，请稍后重试"
      })
    }
  }

  // 获取可选领导列表
  const getAvailableLeaders = () => {
    // 如果有从接口获取的领导数据，直接使用并按部门筛选
    if (leaders && leaders.length > 0) {
      return leaders.filter(leader => 
        !formData.department_id || leader.department?.id === formData.department_id
      )
    }
    
    // 回退到原来的逻辑：从用户列表中筛选具有领导角色的用户
    if (!users || users.length === 0) return []
    return users.filter(user => 
      user.roles && user.roles.length > 0 &&
      // 角色代码修正为 'leader'
      user.roles.some(role => role.code === 'leader') && 
      (!formData.department_id || user.department?.id === formData.department_id)
    )
  }

  // 获取角色Badge
  const getRoleBadge = (roles: Role[]) => {
    if (!roles || roles.length === 0) return <Badge variant="outline">无角色</Badge>
    const primaryRole = roles[0]
    return (
      <Badge className={userUtils.getRoleBadgeStyle(primaryRole.code)}>
        {primaryRole.name}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
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
            <div className="space-y-4">
              {/* 顶部操作栏 */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                {/* 搜索和筛选区域 */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-1">
                  <Input
                    placeholder="搜索用户..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <Select value={selectedDepartment?.toString() || ""} onValueChange={(value) => setSelectedDepartment(value && value !== "all" ? parseInt(value) : undefined)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="筛选部门" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部部门</SelectItem>
                        {departments && departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedRole || ""} onValueChange={(value) => setSelectedRole(value && value !== "all" ? value : undefined)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="筛选角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部角色</SelectItem>
                        {roles && roles.length > 0 ? roles.map((role) => (
                          <SelectItem key={role.id} value={role.code}>
                            {role.name}
                          </SelectItem>
                        )) : (
                          <SelectItem value="no-roles" disabled>暂无角色数据</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex gap-2 sm:gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSearch}
                      disabled={loading}
                      className="flex-1 sm:flex-none"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜索"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                      disabled={loading}
                      className="flex-1 sm:flex-none"
                    >
                      <RotateCcw className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">重置</span>
                    </Button>
                  </div>
                </div>
                
                {/* 添加用户按钮 */}
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                  setIsCreateDialogOpen(open)
                  if (!open) {
                    resetForm()
                    setError("")  // 关闭时重置错误状态
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      resetForm()
                      setError("")  // 打开时也重置错误状态
                    }} className="w-full lg:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      添加用户
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>添加新用户</DialogTitle>
                      <DialogDescription>创建一个新的系统用户账户</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">用户名 *</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="请输入用户名"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">密码 *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="请输入密码"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="name">姓名 *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="请输入姓名"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">邮箱</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="请输入邮箱"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">电话</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="请输入电话"
                          />
                        </div>
                        <div>
                          <Label htmlFor="position">职位</Label>
                          <Input
                            id="position"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            placeholder="请输入职位"
                          />
                        </div>
                        <div>
                          <Label htmlFor="department">部门</Label>
                          <Select
                            value={formData.department_id?.toString() || ""}
                            onValueChange={(value) => setFormData({ ...formData, department_id: value && value !== "none" ? parseInt(value) : undefined, leader_id: undefined })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择部门" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">不选择部门</SelectItem>
                              {departments && departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="leader">直属领导</Label>
                          <Select
                            value={formData.leader_id?.toString() || ""}
                            onValueChange={(value) => setFormData({ ...formData, leader_id: value && value !== "none" ? parseInt(value) : undefined })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择直属领导" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">不选择领导</SelectItem>
                              {getAvailableLeaders().map((leader) => (
                                <SelectItem key={leader.id} value={leader.id.toString()}>
                                  {leader.name} ({leader.position || "未知职位"})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="roles">角色 *</Label>
                          <Select
                            value={formData.role_ids[0]?.toString() || ""}
                            onValueChange={(value) => setFormData({ ...formData, role_ids: value ? [parseInt(value)] : [] })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择角色" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles && roles.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="join_date">入职时间</Label>
                          <Input
                            id="join_date"
                            type="date"
                            value={formData.join_date}
                            onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          取消
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          创建
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 用户列表 */}
              <div className="space-y-4">
                {users && users.length > 0 ? users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.roles)}
                        <Badge variant={user.status === 1 ? "default" : "destructive"}>
                          {userUtils.formatUserStatus(user.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                      {user.department && (
                        <div>
                          <span className="text-gray-600">部门：</span>
                          <span className="font-medium">{user.department.name}</span>
                        </div>
                      )}
                      {user.leader && (
                        <div>
                          <span className="text-gray-600">直属领导：</span>
                          <span className="font-medium">{user.leader.name}</span>
                        </div>
                      )}
                      {user.position && (
                        <div>
                          <span className="text-gray-600">职位：</span>
                          <span className="font-medium">{user.position}</span>
                        </div>
                      )}
                      {user.join_date && (
                        <div>
                          <span className="text-gray-600">入职时间：</span>
                          <span className="font-medium">{userUtils.formatJoinDate(user.join_date)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(user)}>
                        <Key className="w-4 h-4 mr-1" />
                        重置密码
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleStatus(user)}
                        className={user.status === 1 ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                      >
                        {user.status === 1 ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            禁用
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            启用
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除用户 "{user.name}" 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? "加载中..." : "暂无用户数据"}
                  </div>
                )}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    第 {currentPage} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </div>

            {/* 编辑用户对话框 */}
            {editingUser && (
              <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                setIsEditDialogOpen(open)
                if (!open) {
                  resetForm()
                  setError("")  // 关闭时重置错误状态
                }
              }}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>编辑用户信息</DialogTitle>
                    <DialogDescription>修改用户的基本信息和权限设置</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    {console.log('Rendering edit form with formData:', formData)}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">姓名 *</Label>
                        <Input
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="请输入姓名"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email">邮箱</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="请输入邮箱"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">电话</Label>
                        <Input
                          id="edit-phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="请输入电话"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-position">职位</Label>
                        <Input
                          id="edit-position"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          placeholder="请输入职位"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-department">部门</Label>
                        <Select
                          value={formData.department_id?.toString() || ""}
                          onValueChange={(value) => setFormData({ ...formData, department_id: value && value !== "none" ? parseInt(value) : undefined, leader_id: undefined })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择部门" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不选择部门</SelectItem>
                            {departments && departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-leader">直属领导</Label>
                        <Select
                          value={formData.leader_id?.toString() || ""}
                          onValueChange={(value) => setFormData({ ...formData, leader_id: value && value !== "none" ? parseInt(value) : undefined })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择直属领导" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不选择领导</SelectItem>
                            {getAvailableLeaders().map((leader) => (
                              <SelectItem key={leader.id} value={leader.id.toString()}>
                                {leader.name} ({leader.position || "未知职位"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-roles">角色 *</Label>
                        <Select
                          value={formData.role_ids[0]?.toString() || ""}
                          onValueChange={(value) => setFormData({ ...formData, role_ids: value ? [parseInt(value)] : [] })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles && roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="edit-join_date">入职时间</Label>
                        <Input
                          id="edit-join_date"
                          type="date"
                          value={formData.join_date}
                          onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        取消
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        保存修改
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentManagement onDepartmentChange={fetchDepartments} />
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>

      {/* 重置密码成功对话框 */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>密码重置成功</AlertDialogTitle>
            <AlertDialogDescription>
              {resetPasswordResult}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsResetPasswordDialogOpen(false)}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
