"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Plus, Calendar, Users, CheckCircle, Clock, Loader2, Trash2, AlertTriangle, UserCheck, UserMinus, Edit, Send, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { assessmentService, AssessmentListItem, CreateAssessmentRequest, EditAssessmentRequest, PublishValidationResult, assessmentUtils } from "@/lib/assessment"
import { userService, User } from "@/lib/user"
import { templateService, Template } from "@/lib/template"
import { roleService, Role, roleUtils } from "@/lib/role"

export default function AssessmentManagement() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<AssessmentListItem | null>(null)
  const [publishingId, setPublishingId] = useState<number | null>(null)
  const [publishValidation, setPublishValidation] = useState<PublishValidationResult | null>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  
  // 检查URL参数中是否有编辑ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const editId = urlParams.get('edit')
    
    if (editId && assessments.length > 0) {
      const assessmentToEdit = assessments.find(a => a.id === parseInt(editId))
      if (assessmentToEdit && assessmentUtils.canEdit(assessmentToEdit.status)) {
        // 异步调用编辑函数
        handleEditClick(assessmentToEdit)
        // 清除URL参数
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [assessments])
  
  // 生成默认考核标题
  const generateDefaultTitle = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthName = month < 10 ? `0${month}` : `${month}`
    
    // 生成标题格式：年份 + 月份 + "月绩效考核"
    return `${year}年${monthName}月绩效考核`
  }

  const [newAssessment, setNewAssessment] = useState<CreateAssessmentRequest>({
    title: generateDefaultTitle(), // 初始就设置默认标题
    period: "",
    description: "",
    start_date: "",
    end_date: "",
    deadline: "",
    template_id: undefined,
    participant_ids: [],
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  
  // 新增角色相关状态
  const [selectedRole, setSelectedRole] = useState<string>('employee')
  const [usersByRole, setUsersByRole] = useState<Record<string, User[]>>({})
  const [roleSelections, setRoleSelections] = useState<Record<string, 'all' | 'partial' | 'none'>>({})

  // 工具函数：按角色分组用户
  const groupUsersByRole = (users: User[]): Record<string, User[]> => {
    const grouped: Record<string, User[]> = {
      admin: [],
      boss: [],
      leader: [],
      employee: []
    }
    
    users.forEach(user => {
      // 用户可能有多个角色，我们取主要角色或第一个角色
      const primaryRole = user.roles.find(role => ['admin', 'boss', 'leader', 'employee'].includes(role.code))
      if (primaryRole) {
        grouped[primaryRole.code].push(user)
      }
    })
    
    return grouped
  }

  // 获取员工角色用户
  const getEmployeeUsers = (): User[] => {
    return usersByRole.employee || []
  }

  // 计算角色选择状态
  const calculateRoleSelectionStatus = (roleCode: string): 'all' | 'partial' | 'none' => {
    const roleUsers = usersByRole[roleCode] || []
    if (roleUsers.length === 0) return 'none'
    
    const selectedInRole = roleUsers.filter(user => selectedParticipants.includes(user.id))
    
    if (selectedInRole.length === 0) return 'none'
    if (selectedInRole.length === roleUsers.length) return 'all'
    return 'partial'
  }

  // 更新角色选择状态
  const updateRoleSelections = () => {
    const newRoleSelections: Record<string, 'all' | 'partial' | 'none'> = {}
    Object.keys(usersByRole).forEach(roleCode => {
      newRoleSelections[roleCode] = calculateRoleSelectionStatus(roleCode)
    })
    setRoleSelections(newRoleSelections)
  }

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  // 更新角色选择状态
  useEffect(() => {
    updateRoleSelections()
  }, [selectedParticipants, usersByRole])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 并行加载考核列表、用户列表、模板列表和角色列表
      const [assessmentsRes, usersRes, templatesRes, rolesRes] = await Promise.all([
        assessmentService.getAssessments({ limit: 50 }),
        userService.getUsers({ limit: 100 }),
        templateService.getTemplates({ limit: 50 }),
        roleService.getRoles()
      ])
      
      if (assessmentsRes.code === 200) {
        setAssessments(assessmentsRes.data?.items || [])
      }
      
      if (usersRes.code === 200) {
        const usersList = usersRes.data?.items || []
        setUsers(usersList)
        
        // 按角色分组用户
        const grouped = groupUsersByRole(usersList)
        setUsersByRole(grouped)
        
        // 默认选择所有员工
        const employeeUsers = grouped.employee || []
        setSelectedParticipants(employeeUsers.map(user => user.id))
      }
      
      if (templatesRes.code === 200) {
        setTemplates(templatesRes.data?.items || [])
      }
      
      if (rolesRes.code === 200) {
        setRoles(rolesRes.data?.data || [])
      }
      
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.period || !newAssessment.deadline || !newAssessment.start_date || !newAssessment.end_date || selectedParticipants.length === 0) {
      toast.error('请填写完整信息并选择参与者')
      return
    }

    try {
      setSubmitting(true)
      
      const createData: CreateAssessmentRequest = {
        ...newAssessment,
        participant_ids: selectedParticipants
      }

      const response = await assessmentService.createAssessment(createData)
      
      if (response.code === 200) {
        toast.success('创建成功', {
          description: `考核 "${newAssessment.title}" 已成功创建为草稿`
        })
        
        // 重新加载考核列表
        await loadData()
        
        // 重置表单
        resetForm()
        handleDialogOpen(false)
      } else {
        toast.error('创建失败', {
          description: response.message || '请检查输入信息'
        })
      }
    } catch (error: any) {
      console.error('创建考核失败:', error)
      toast.error('创建失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAssessment = async () => {
    if (!editingAssessment || !newAssessment.title || !newAssessment.period || !newAssessment.deadline || !newAssessment.start_date || !newAssessment.end_date || selectedParticipants.length === 0) {
      toast.error('请填写完整信息并选择参与者')
      return
    }

    try {
      setSubmitting(true)
      
      const editData: EditAssessmentRequest = {
        title: newAssessment.title,
        period: newAssessment.period,
        description: newAssessment.description,
        start_date: newAssessment.start_date,
        end_date: newAssessment.end_date,
        deadline: newAssessment.deadline,
        template_id: newAssessment.template_id,
        participant_ids: selectedParticipants
      }

      const response = await assessmentService.editAssessment(editingAssessment.id, editData)
      
      if (response.code === 200) {
        toast.success('编辑成功', {
          description: `考核 "${newAssessment.title}" 已成功更新`
        })
        
        // 重新加载考核列表
        await loadData()
        
        // 重置表单
        resetForm()
        handleDialogOpen(false)
      } else {
        toast.error('编辑失败', {
          description: response.message || '请检查输入信息'
        })
      }
    } catch (error: any) {
      console.error('编辑考核失败:', error)
      toast.error('编辑失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setNewAssessment({
      title: generateDefaultTitle(), // 自动生成标题
      period: "",
      description: "",
      start_date: "",
      end_date: "",
      deadline: "",
      template_id: undefined,
      participant_ids: [],
    })
    
    // 重置为默认状态：选中员工角色并全选所有员工
    setSelectedRole('employee')
    const employeeUsers = usersByRole.employee || []
    setSelectedParticipants(employeeUsers.map(user => user.id))
    
    // 重置编辑状态
    setEditingAssessment(null)
  }

  const handlePublishAssessment = async (assessment: AssessmentListItem) => {
    try {
      setPublishingId(assessment.id)
      
      // 先进行发布前校验
      const validationResponse = await assessmentService.publishValidation(assessment.id)
      
      if (validationResponse.code !== 200) {
        toast.error('预检查失败', {
          description: validationResponse.message || '无法获取考核状态'
        })
        return
      }
      
      const validation = validationResponse.data
      setPublishValidation(validation)
      
      // 显示确认对话框，无论是否可以发布
      // 对话框中会显示错误信息或警告信息
      setShowPublishDialog(true)
      
    } catch (error: any) {
      console.error('发布预检查失败:', error)
      toast.error('预检查失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setPublishingId(null)
    }
  }

  const confirmPublishAssessment = async () => {
    if (!publishValidation || publishingId === null) return
    
    try {
      setPublishingId(publishingId)
      
      // 执行发布操作
      const response = await assessmentService.publishAssessment(publishingId)
      
      if (response.code === 200) {
        toast.success('发布成功', {
          description: '考核已发布，参与者可以开始评估'
        })
        
        // 重新加载考核列表
        await loadData()
        
        // 关闭对话框
        setShowPublishDialog(false)
        setPublishValidation(null)
      } else {
        toast.error('发布失败', {
          description: response.message || '无法发布该考核'
        })
      }
    } catch (error: any) {
      console.error('发布考核失败:', error)
      toast.error('发布失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setPublishingId(null)
    }
  }

  const handleEditClick = async (assessment: AssessmentListItem) => {
    try {
      // 获取完整的考核详情
      const detailResponse = await assessmentService.getAssessmentById(assessment.id)
      
      if (detailResponse.code !== 200 || !detailResponse.data) {
        toast.error('加载失败', {
          description: detailResponse.message || '无法获取考核详情'
        })
        return
      }
      
      const detail = detailResponse.data
      setEditingAssessment(assessment)
      
      // 填充表单数据，使用详情接口返回的完整数据
      setNewAssessment({
        title: detail.title,
        period: detail.period,
        description: detail.description || "",
        start_date: detail.start_date, // 使用格式化的日期字段
        end_date: detail.end_date,
        deadline: detail.deadline,
        template_id: detail.template_id,
        participant_ids: detail.participant_ids || [], // 使用详情接口返回的参与者ID列表
      })
      
      // 设置选中的参与者
      setSelectedParticipants(detail.participant_ids || [])
      
      // 打开对话框
      handleDialogOpen(true)
    } catch (error: any) {
      console.error('获取考核详情失败:', error)
      toast.error('加载失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    }
  }

  const handleDeleteAssessment = async (id: number) => {
    try {
      // 先进行预检查
      const validationResponse = await assessmentService.deleteValidation(id)
      
      if (validationResponse.code !== 200) {
        toast.error('预检查失败', {
          description: validationResponse.message || '无法获取考核状态'
        })
        return
      }
      
      const validation = validationResponse.data
      
      // 如果检查失败，显示错误信息
      if (!validation.canDelete) {
        const errorMessage = validation.errors.join('\n')
        toast.error('无法删除考核', {
          description: errorMessage,
          duration: 5000
        })
        return
      }
      
      // 如果有警告，显示警告信息
      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join('\n')
        toast.warning('删除风险提示', {
          description: warningMessage,
          duration: 4000
        })
      }
      
      // 如果检查通过，执行删除操作
      const response = await assessmentService.deleteAssessment(id)
      
      if (response.code === 200) {
        toast.success('删除成功', {
          description: '考核已成功删除'
        })
        
        // 重新加载考核列表
        await loadData()
      } else {
        toast.error('删除失败', {
          description: response.message || '无法删除该考核'
        })
      }
    } catch (error: any) {
      console.error('删除考核失败:', error)
      toast.error('删除失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    }
  }

  const handleEndAssessment = async (id: number) => {
    try {
      // 先进行预检查
      const validationResponse = await assessmentService.endValidation(id)
      
      if (validationResponse.code !== 200) {
        toast.error('预检查失败', {
          description: validationResponse.message || '无法获取考核状态'
        })
        return
      }
      
      const validation = validationResponse.data
      
      // 如果检查失败，显示错误信息
      if (!validation.canEnd) {
        const errorMessage = validation.errors.join('\n')
        toast.error('无法结束考核', {
          description: errorMessage,
          duration: 5000
        })
        return
      }
      
      // 如果有警告，显示警告信息
      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join('\n')
        toast.warning('注意事项', {
          description: warningMessage,
          duration: 4000
        })
      }
      
      // 如果检查通过，执行结束操作
      const response = await assessmentService.endAssessment(id)
      
      if (response.code === 200) {
        toast.success('考核已结束', {
          description: '已自动计算最终得分'
        })
        
        // 重新加载考核列表
        await loadData()
      } else {
        toast.error('结束失败', {
          description: response.message || '无法结束该考核'
        })
      }
    } catch (error: any) {
      console.error('结束考核失败:', error)
      toast.error('结束失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    }
  }

  const handleParticipantChange = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedParticipants(prev => [...prev, userId])
    } else {
      setSelectedParticipants(prev => prev.filter(id => id !== userId))
    }
  }

  // 全选当前角色
  const handleSelectAllInRole = (roleCode: string) => {
    const roleUsers = usersByRole[roleCode] || []
    const roleUserIds = roleUsers.map(user => user.id)
    setSelectedParticipants(prev => {
      const newSelected = new Set(prev)
      roleUserIds.forEach(id => newSelected.add(id))
      return Array.from(newSelected)
    })
  }

  // 清除当前角色
  const handleClearAllInRole = (roleCode: string) => {
    const roleUsers = usersByRole[roleCode] || []
    const roleUserIds = roleUsers.map(user => user.id)
    setSelectedParticipants(prev => prev.filter(id => !roleUserIds.includes(id)))
  }

  // 处理对话框打开
  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open)
    if (open) {
      // 对话框打开时，确保标题是最新的
      if (!newAssessment.title || newAssessment.title === "") {
        setNewAssessment(prev => ({ ...prev, title: generateDefaultTitle() }))
      }
    }
  }

  // 快速选择所有员工
  const handleSelectAllEmployees = () => {
    const employeeUsers = usersByRole.employee || []
    const employeeIds = employeeUsers.map(user => user.id)
    setSelectedParticipants(prev => {
      const newSelected = new Set(prev)
      employeeIds.forEach(id => newSelected.add(id))
      return Array.from(newSelected)
    })
  }

  // 角色切换
  const handleRoleChange = (roleCode: string) => {
    setSelectedRole(roleCode)
  }

  // 获取角色选择状态图标
  const getRoleSelectionIcon = (roleCode: string) => {
    const status = roleSelections[roleCode]
    switch (status) {
      case 'all':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'none':
      default:
        return <Users className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyle = assessmentUtils.getStatusStyle(status as any)
    const statusText = assessmentUtils.getStatusText(status as any)
    return <Badge className={statusStyle}>{statusText}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                考核管理
              </CardTitle>
              <CardDescription>创建和管理绩效考核任务</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              考核管理
            </CardTitle>
            <CardDescription>创建和管理绩效考核任务</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                发布新考核
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssessment ? '编辑考核' : '发布新考核'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssessment ? '编辑考核基本信息和参与者' : '创建一个新的绩效考核任务'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">考核标题</Label>
                    <Input
                      id="title"
                      placeholder="例如：2025年7月绩效考核"
                      value={newAssessment.title}
                      onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">考核周期</Label>
                    <Input
                      id="period"
                      type="month"
                      value={newAssessment.period}
                      onChange={(e) => setNewAssessment({ ...newAssessment, period: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">开始日期</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newAssessment.start_date}
                      onChange={(e) => setNewAssessment({ ...newAssessment, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">结束日期</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newAssessment.end_date}
                      onChange={(e) => setNewAssessment({ ...newAssessment, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">提交截止日期</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newAssessment.deadline}
                    onChange={(e) => setNewAssessment({ ...newAssessment, deadline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">考核模板（可选）</Label>
                  <Select 
                    value={newAssessment.template_id?.toString()} 
                    onValueChange={(value) => setNewAssessment({ ...newAssessment, template_id: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择考核模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>参与人员</Label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={handleSelectAllEmployees}
                      className="text-xs"
                    >
                      快速选择所有员工
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 左侧角色列表 */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">角色列表</Label>
                      <div className="border rounded-md p-2 space-y-1">
                        {['admin', 'boss', 'leader', 'employee'].map((roleCode) => {
                          const roleUsers = usersByRole[roleCode] || []
                          const isSelected = selectedRole === roleCode
                          const selectionStatus = roleSelections[roleCode] || 'none'
                          
                          return (
                            <div
                              key={roleCode}
                              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                              onClick={() => handleRoleChange(roleCode)}
                            >
                              <div className="flex items-center space-x-2 flex-1">
                                {getRoleSelectionIcon(roleCode)}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${roleUtils.getRoleBadgeStyle(roleCode)}`}>
                                  {roleUtils.getRoleDisplayName(roleCode)}
                                </span>
                                <span className="text-xs text-gray-500">{roleUsers.length} 人</span>
                                {selectionStatus === 'partial' && (
                                  <span className="text-xs text-yellow-600 bg-yellow-50 px-1 py-0.5 rounded">
                                    部分
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* 右侧用户列表 */}
                    <div className="lg:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-600 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${roleUtils.getRoleBadgeStyle(selectedRole)}`}>
                            {roleUtils.getRoleDisplayName(selectedRole)}
                          </span>
                          人员列表
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectAllInRole(selectedRole)}
                            className="text-xs"
                            disabled={(usersByRole[selectedRole] || []).length === 0}
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            全选
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearAllInRole(selectedRole)}
                            className="text-xs"
                            disabled={(usersByRole[selectedRole] || []).filter(user => selectedParticipants.includes(user.id)).length === 0}
                          >
                            <UserMinus className="w-3 h-3 mr-1" />
                            清除
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-3 max-h-60 overflow-y-auto bg-gray-50">
                        {(usersByRole[selectedRole] || []).length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500">该角色暂无用户</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(usersByRole[selectedRole] || []).map((user) => (
                              <div 
                                key={user.id} 
                                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                  selectedParticipants.includes(user.id) 
                                    ? 'bg-blue-50 border border-blue-200' 
                                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <Checkbox
                                  id={`user-${user.id}`}
                                  checked={selectedParticipants.includes(user.id)}
                                  onCheckedChange={(checked) => handleParticipantChange(user.id, checked as boolean)}
                                />
                                <Label htmlFor={`user-${user.id}`} className="text-sm cursor-pointer flex-1">
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {user.department?.name || '未分配部门'} · {user.position || '未设置职位'}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="text-xs text-gray-600 flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            当前角色：{(usersByRole[selectedRole] || []).filter(user => selectedParticipants.includes(user.id)).length}/{(usersByRole[selectedRole] || []).length}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="w-3 h-3" />
                            总计：{selectedParticipants.length} 人
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">考核说明</Label>
                  <Textarea
                    id="description"
                    placeholder="请填写本次考核的相关说明..."
                    value={newAssessment.description || ""}
                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => { resetForm(); handleDialogOpen(false) }} className="flex-1">
                    取消
                  </Button>
                  <Button
                    onClick={editingAssessment ? handleEditAssessment : handleCreateAssessment}
                    className="flex-1"
                    disabled={submitting || !newAssessment.title || !newAssessment.period || !newAssessment.deadline || !newAssessment.start_date || !newAssessment.end_date || selectedParticipants.length === 0}
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingAssessment ? '保存修改' : '创建考核'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无考核数据</p>
              <p className="text-sm">点击"发布新考核"开始创建</p>
            </div>
          ) : (
            assessments.map((assessment) => (
              <div key={assessment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{assessment.title}</h3>
                    <p className="text-sm text-gray-600">
                      考核周期：{assessmentUtils.formatPeriod(assessment.period)}
                      {assessment.template && <span className="ml-2">• 模板：{assessment.template.name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(assessment.status)}
                    {assessmentUtils.isExpired(assessment.deadline) && assessment.status === 'active' && (
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        已过期
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>截止：{assessmentUtils.formatDate(assessment.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>参与：{assessment.statistics.total_participants}人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span>完成：{assessment.statistics.fully_completed_count}人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>创建：{assessmentUtils.formatDate(assessment.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/assessment/${assessment.id}`)}>
                      查看详情
                    </Button>
                    <Button variant="outline" size="sm">
                      导出数据
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {assessmentUtils.canEdit(assessment.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(assessment)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                    )}
                    
                    {assessmentUtils.canPublish(assessment.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublishAssessment(assessment)}
                        disabled={publishingId === assessment.id}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        {publishingId === assessment.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-1" />
                        )}
                        发布
                      </Button>
                    )}
                    
                    {assessmentUtils.canEnd(assessment.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            结束考核
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认结束考核</AlertDialogTitle>
                            <AlertDialogDescription>
                              结束考核后，未完成的评分将无法继续进行，系统将自动计算最终得分。此操作不可撤销，请确认是否继续？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleEndAssessment(assessment.id)}>
                              确认结束
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {assessmentUtils.canDelete(assessment.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            删除
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除考核</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除考核"{assessment.title}"吗？删除后相关数据将无法恢复。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAssessment(assessment.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {/* 发布确认对话框 */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              确认发布考核
            </AlertDialogTitle>
            <AlertDialogDescription>
              发布后考核将进入进行中状态，参与者可以开始评估。发布后将无法再编辑基本信息。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {publishValidation && (
            <div className="space-y-4">
              {/* 错误信息显示 */}
              {publishValidation.errors && publishValidation.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    发布检查失败
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {publishValidation.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 警告信息显示 */}
              {publishValidation.warnings && publishValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    注意事项
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {publishValidation.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 检查项目状态 - 仅在有 checks 字段且可以发布时显示 */}
              {publishValidation.checks && publishValidation.canPublish && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-800 mb-2">发布检查项</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${publishValidation.checks.title ? 'text-green-500' : 'text-red-500'}`} />
                      <span>标题配置</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${publishValidation.checks.dateConfig ? 'text-green-500' : 'text-red-500'}`} />
                      <span>时间配置</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${publishValidation.checks.template ? 'text-green-500' : 'text-red-500'}`} />
                      <span>模板配置</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${publishValidation.checks.participants ? 'text-green-500' : 'text-red-500'}`} />
                      <span>参与者配置</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishingId !== null}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPublishAssessment} 
              disabled={publishingId !== null || (publishValidation && !publishValidation.canPublish)}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishingId !== null && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {publishValidation && !publishValidation.canPublish ? '无法发布' : '确认发布'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
