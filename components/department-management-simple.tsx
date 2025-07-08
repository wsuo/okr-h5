"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Building, Users, Loader2 } from "lucide-react"
import { Department, departmentService, departmentUtils, CreateDepartmentDto, UpdateDepartmentDto } from "@/lib/department"

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formData, setFormData] = useState<CreateDepartmentDto>({
    name: '',
    description: '',
    sort_order: 0
  })
  const [submitting, setSubmitting] = useState(false)

  // 获取部门列表
  const fetchDepartments = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await departmentService.getDepartments()
      if (response.data) {
        setDepartments(response.data.data)
      }
    } catch (error: any) {
      console.error('Fetch departments error:', error)
      setError(error.message || "获取部门列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sort_order: 0
    })
    setEditingDepartment(null)
  }

  // 创建部门
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("部门名称不能为空")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      console.log('Creating department:', formData)
      await departmentService.createDepartment(formData)
      setIsCreateDialogOpen(false)
      resetForm()
      fetchDepartments()
    } catch (error: any) {
      console.error('Create department error:', error)
      setError(error.message || "创建部门失败")
    } finally {
      setSubmitting(false)
    }
  }

  // 更新部门
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDepartment || !formData.name.trim()) {
      setError("部门名称不能为空")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      console.log('Updating department:', editingDepartment.id, formData)
      await departmentService.updateDepartment(editingDepartment.id, formData as UpdateDepartmentDto)
      setIsEditDialogOpen(false)
      resetForm()
      fetchDepartments()
    } catch (error: any) {
      console.error('Update department error:', error)
      setError(error.message || "更新部门失败")
    } finally {
      setSubmitting(false)
    }
  }

  // 删除部门
  const handleDelete = async (department: Department) => {
    try {
      setError("")
      console.log('Deleting department:', department.id)
      await departmentService.deleteDepartment(department.id)
      fetchDepartments()
    } catch (error: any) {
      console.error('Delete department error:', error)
      setError(error.message || "删除部门失败")
    }
  }

  // 编辑部门
  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || '',
      sort_order: department.sort_order
    })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">部门管理</h2>
          <p className="text-gray-600">管理组织架构和部门信息</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              新建部门
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建部门</DialogTitle>
              <DialogDescription>创建一个新的部门</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">部门名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入部门名称"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">部门描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入部门描述"
                />
              </div>
              <div>
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="排序值"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            部门列表
          </CardTitle>
          <CardDescription>
            当前系统共有 {departments.length} 个部门
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部门名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>员工数量</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      {department.employeeCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    {departmentUtils.formatDepartmentDate(department.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(department)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除部门</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除部门 "{department.name}" 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(department)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 独立的编辑对话框 */}
      {editingDepartment && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑部门</DialogTitle>
              <DialogDescription>修改部门信息</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">部门名称 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入部门名称"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">部门描述</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入部门描述"
                />
              </div>
              <div>
                <Label htmlFor="edit-sort_order">排序</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="排序值"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  更新
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}