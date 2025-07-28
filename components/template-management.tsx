"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Settings, Edit, Trash2, AlertTriangle, ChevronDown, ChevronRight, Star, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Template, templateService, templateUtils, TemplateListQuery, CreateTemplateDto, UpdateTemplateDto } from "@/lib/template"
import { ScoringMode, TwoTierScoringConfig } from "@/lib/evaluation"
import { User, userService } from "@/lib/user"
import { toast } from "sonner"

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set())
  
  // 对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedIsDefault, setSelectedIsDefault] = useState<string>("all")
  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string>("all")
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // 新建模板表单数据
  const [formData, setFormData] = useState<CreateTemplateDto>({
    name: "",
    description: "",
    type: "okr",
    config: {
      version: "1.0",
      categories: [],
      description: "",
      total_score: 100,
      scoring_rules: {
        self_evaluation: {
          enabled: true,
          description: "员工自我评估",
          weight_in_final: 0.4
        },
        leader_evaluation: {
          enabled: true,
          description: "直属领导评估",
          weight_in_final: 0.6
        },
        calculation_method: "weighted_average",
        scoring_mode: "simple_weighted"
      },
      scoring_method: "weighted",
      usage_instructions: {
        for_leaders: [],
        for_employees: []
      },
      // 公共评分标准配置
      scoring_criteria: {
        excellent: {
          min: 90,
          description: "优秀：超额完成目标，表现突出"
        },
        good: {
          min: 80,
          description: "良好：完成目标，表现符合预期"
        },
        average: {
          min: 70,
          description: "一般：基本完成目标，表现一般"
        },
        poor: {
          min: 0,
          description: "较差：未完成目标，表现不佳"
        }
      }
    },
    is_default: 0
  })

  // 获取模板列表
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError("")
      
      const queryParams: TemplateListQuery = {
        page: currentPage,
        limit: 10,
      }
      
      if (searchQuery && searchQuery.trim()) {
        queryParams.name = searchQuery.trim()
      }
      
      if (selectedType && selectedType !== "all") {
        queryParams.type = selectedType
      }
      
      if (selectedStatus && selectedStatus !== "all") {
        queryParams.status = parseInt(selectedStatus)
      }
      
      if (selectedIsDefault && selectedIsDefault !== "all") {
        queryParams.is_default = parseInt(selectedIsDefault)
      }
      
      if (selectedCreatedBy && selectedCreatedBy !== "all") {
        queryParams.created_by = parseInt(selectedCreatedBy)
      }
      
      const response = await templateService.getTemplates(queryParams)
      if (response.data) {
        setTemplates(response.data.items || [])
        setTotalPages(response.data.totalPages || 1)
        
        // 默认展开第一个模板
        if (response.data.items && response.data.items.length > 0) {
          setExpandedTemplates(new Set([response.data.items[0].id]))
        }
      }
    } catch (error: any) {
      console.error('Fetch templates error:', error)
      setError(error.message || "获取模板列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 获取管理员用户列表（用于创建者筛选）
  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers({ limit: 100 }) // 获取前100个用户
      if (response.data) {
        // 只显示管理员角色的用户
        const adminUsers = response.data.items?.filter(user => 
          user.roles && user.roles.some(role => role.code === 'admin')
        ) || []
        setUsers(adminUsers)
      }
    } catch (error: any) {
      console.error('Fetch users error:', error)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [currentPage])

  // 初始化时获取用户列表
  useEffect(() => {
    fetchUsers()
  }, [])

  // 筛选条件变化时重置到第一页并立即搜索
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedType, selectedStatus, selectedIsDefault, selectedCreatedBy])

  // 当页码变化时获取模板数据
  useEffect(() => {
    fetchTemplates()
  }, [currentPage])

  // 筛选条件变化时立即搜索
  useEffect(() => {
    if (currentPage === 1) {
      fetchTemplates()
    }
  }, [selectedType, selectedStatus, selectedIsDefault, selectedCreatedBy])

  // 搜索功能
  const handleSearch = () => {
    setCurrentPage(1)
    fetchTemplates()
  }

  // 重置搜索条件
  const handleReset = () => {
    setSearchQuery("")
    setSelectedType("all")
    setSelectedStatus("all")
    setSelectedIsDefault("all")
    setSelectedCreatedBy("all")
    setCurrentPage(1)
    setTimeout(() => {
      fetchTemplates()
    }, 0)
  }

  // 切换模板展开状态
  const toggleTemplateExpansion = (templateId: number) => {
    const newExpanded = new Set(expandedTemplates)
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId)
    } else {
      newExpanded.add(templateId)
    }
    setExpandedTemplates(newExpanded)
  }

  // 删除模板
  const handleDeleteTemplate = async (template: Template) => {
    try {
      setError("")
      await templateService.deleteTemplate(template.id)
      fetchTemplates()
      toast.success("删除成功", {
        description: `模板 "${template.name}" 已成功删除`
      })
    } catch (error: any) {
      console.error('Delete template error:', error)
      setError(error.message || "删除模板失败")
      toast.error("删除失败", {
        description: error.message || "删除模板失败，请稍后重试"
      })
    }
  }

  // 设置默认模板
  const handleSetDefault = async (template: Template) => {
    try {
      setError("")
      await templateService.setDefaultTemplate(template.id)
      fetchTemplates()
      toast.success("设置成功", {
        description: `模板 "${template.name}" 已设置为默认模板`
      })
    } catch (error: any) {
      console.error('Set default template error:', error)
      setError(error.message || "设置默认模板失败")
      toast.error("设置失败", {
        description: error.message || "设置默认模板失败，请稍后重试"
      })
    }
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "okr",
      config: {
        version: "1.0",
        categories: [],
        description: "",
        total_score: 100,
        scoring_rules: {
          self_evaluation: {
            enabled: true,
            description: "员工自我评估",
            weight_in_final: 0.4
          },
          leader_evaluation: {
            enabled: true,
            description: "直属领导评估",
            weight_in_final: 0.6
          },
          calculation_method: "weighted_average",
          scoring_mode: "simple_weighted"
        },
        scoring_method: "weighted",
        usage_instructions: {
          for_leaders: [],
          for_employees: []
        },
        // 公共评分标准配置
        scoring_criteria: {
          excellent: {
            min: 90,
            description: "优秀：超额完成目标，表现突出"
          },
          good: {
            min: 80,
            description: "良好：完成目标，表现符合预期"
          },
          average: {
            min: 70,
            description: "一般：基本完成目标，表现一般"
          },
          poor: {
            min: 0,
            description: "较差：未完成目标，表现不佳"
          }
        }
      },
      is_default: 0
    })
  }

  // 创建模板
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("模板名称不能为空")
      return
    }

    try {
      setSubmitting(true)
      setError("")
      
      // 清理配置：在两层加权模式下移除无用的权重配置
      let cleanedFormData = { ...formData }
      if (cleanedFormData.config.scoring_rules?.scoring_mode === 'two_tier_weighted') {
        // 在两层加权模式下，完全重构 scoring_rules 只保留必要字段
        const cleanedScoringRules = {
          scoring_mode: 'two_tier_weighted' as const,
          calculation_method: cleanedFormData.config.scoring_rules.calculation_method,
          two_tier_config: {
            employee_leader_weight: cleanedFormData.config.scoring_rules.two_tier_config?.employee_leader_weight || 80,
            boss_weight: cleanedFormData.config.scoring_rules.two_tier_config?.boss_weight || 20,
            self_weight_in_employee_leader: cleanedFormData.config.scoring_rules.two_tier_config?.self_weight_in_employee_leader || 60,
            leader_weight_in_employee_leader: cleanedFormData.config.scoring_rules.two_tier_config?.leader_weight_in_employee_leader || 40
            // 不包含 work_performance_weight 和 daily_management_weight
          }
          // 不包含 self_evaluation, leader_evaluation, boss_evaluation
        }
        cleanedFormData.config.scoring_rules = cleanedScoringRules
      }
      
      await templateService.createTemplate(cleanedFormData)
      setIsCreateDialogOpen(false)
      resetForm()
      fetchTemplates()
      toast.success("创建成功", {
        description: `模板 "${formData.name}" 已成功创建`
      })
    } catch (error: any) {
      console.error('Create template error:', error)
      setError(error.message || "创建模板失败")
      toast.error("创建失败", {
        description: error.message || "创建模板失败，请稍后重试"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 开始编辑模板
  const handleEditTemplate = (template: Template) => {
    setEditingTemplateId(template.id)
    if (!expandedTemplates.has(template.id)) {
      setExpandedTemplates(new Set([...expandedTemplates, template.id]))
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingTemplateId(null)
  }

  // 保存模板编辑
  const handleSaveTemplate = async (template: Template) => {
    // 验证权重
    const validation = validateWeights(template)
    if (!validation.isValid) {
      setError("权重验证失败：\n" + validation.errors.join("\n"))
      return
    }

    try {
      setSubmitting(true)
      setError("")
      
      // 清理配置：在两层加权模式下移除无用的权重配置
      let cleanedConfig = { ...template.config }
      if (cleanedConfig.scoring_rules?.scoring_mode === 'two_tier_weighted') {
        // 在两层加权模式下，完全重构 scoring_rules 只保留必要字段
        const cleanedScoringRules = {
          scoring_mode: 'two_tier_weighted' as const,
          calculation_method: cleanedConfig.scoring_rules.calculation_method,
          two_tier_config: {
            employee_leader_weight: cleanedConfig.scoring_rules.two_tier_config?.employee_leader_weight || 80,
            boss_weight: cleanedConfig.scoring_rules.two_tier_config?.boss_weight || 20,
            self_weight_in_employee_leader: cleanedConfig.scoring_rules.two_tier_config?.self_weight_in_employee_leader || 60,
            leader_weight_in_employee_leader: cleanedConfig.scoring_rules.two_tier_config?.leader_weight_in_employee_leader || 40
            // 不包含 work_performance_weight 和 daily_management_weight
          }
          // 不包含 self_evaluation, leader_evaluation, boss_evaluation
        }
        cleanedConfig.scoring_rules = cleanedScoringRules
      }
      
      const updateData: UpdateTemplateDto = {
        name: template.name,
        description: template.description,
        type: template.type,
        config: cleanedConfig,
        is_default: template.is_default,
        status: template.status
      }
      
      await templateService.updateTemplate(template.id, updateData)
      setEditingTemplateId(null)
      fetchTemplates()
      toast.success("保存成功", {
        description: `模板 "${template.name}" 已成功更新`
      })
    } catch (error: any) {
      console.error('Update template error:', error)
      setError(error.message || "更新模板失败")
      toast.error("保存失败", {
        description: error.message || "更新模板失败，请稍后重试"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 添加新分类
  const handleAddCategory = (template: Template) => {
    const newCategory = {
      id: `category_${Date.now()}`,
      name: "新分类",
      weight: 0,
      description: "新分类描述",
      items: [],
      evaluator_types: ["self", "leader"]
    }
    
    const updatedTemplate = {
      ...template,
      config: {
        ...template.config,
        categories: [...template.config.categories, newCategory]
      }
    }
    
    updateTemplateInState(updatedTemplate)
  }

  // 添加新评估项目
  const handleAddItem = (template: Template, categoryId: string) => {
    const newItem = {
      id: `item_${Date.now()}`,
      name: "新评估项目",
      weight: 0,
      max_score: 100,
      description: "新评估项目描述"
      // 不再需要独立的 scoring_criteria，使用公共配置
    }
    
    const updatedTemplate = {
      ...template,
      config: {
        ...template.config,
        categories: template.config.categories.map(cat =>
          cat.id === categoryId
            ? { ...cat, items: [...cat.items, newItem] }
            : cat
        )
      }
    }
    
    updateTemplateInState(updatedTemplate)
  }

  // 删除分类
  const handleDeleteCategory = (template: Template, categoryId: string) => {
    const updatedTemplate = {
      ...template,
      config: {
        ...template.config,
        categories: template.config.categories.filter(cat => cat.id !== categoryId)
      }
    }
    
    updateTemplateInState(updatedTemplate)
  }

  // 删除评估项目
  const handleDeleteItem = (template: Template, categoryId: string, itemId: string) => {
    const updatedTemplate = {
      ...template,
      config: {
        ...template.config,
        categories: template.config.categories.map(cat =>
          cat.id === categoryId
            ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
            : cat
        )
      }
    }
    
    updateTemplateInState(updatedTemplate)
  }

  // 更新分类信息
  const handleUpdateCategory = (template: Template, categoryId: string, updates: any) => {
    const updatedTemplate = {
      ...template,
      config: {
        ...template.config,
        categories: template.config.categories.map(cat =>
          cat.id === categoryId ? { ...cat, ...updates } : cat
        )
      }
    }
    
    updateTemplateInState(updatedTemplate)
  }

  // 更新评估项目信息
  const handleUpdateItem = (template: Template, categoryId: string, itemId: string, updates: any) => {
    const updatedTemplate = {
      ...template,
      config: {
        ...template.config,
        categories: template.config.categories.map(cat =>
          cat.id === categoryId
            ? {
                ...cat,
                items: cat.items.map(item =>
                  item.id === itemId ? { ...item, ...updates } : item
                )
              }
            : cat
        )
      }
    }
    
    updateTemplateInState(updatedTemplate)
  }

  // 在状态中更新模板
  const updateTemplateInState = (updatedTemplate: Template) => {
    setTemplates(templates.map(t =>
      t.id === updatedTemplate.id ? updatedTemplate : t
    ))
  }

  // 计算分类权重总和
  const calculateCategoryWeightSum = (categories: any[]) => {
    return categories.reduce((sum, category) => sum + (category.weight || 0), 0)
  }

  // 计算项目权重总和
  const calculateItemWeightSum = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.weight || 0), 0)
  }

  // 验证权重
  const validateWeights = (template: Template) => {
    const { config } = template
    if (!config || !config.categories) return { isValid: true, errors: [] }

    const errors: string[] = []
    
    // 检查分类权重总和
    const categoryWeightSum = calculateCategoryWeightSum(config.categories)
    if (categoryWeightSum !== 100) {
      errors.push(`分类权重总和为 ${categoryWeightSum}%，应为 100%`)
    }

    // 检查每个分类的项目权重总和
    config.categories.forEach((category, index) => {
      if (category.items && category.items.length > 0) {
        const itemWeightSum = calculateItemWeightSum(category.items)
        if (itemWeightSum !== 100) {
          errors.push(`"${category.name}" 分类下项目权重总和为 ${itemWeightSum}%，应为 100%`)
        }
      }
    })

    // 检查评分规则权重总和
    if (config.scoring_rules) {
      const scoringMode = config.scoring_rules.scoring_mode || 'simple_weighted'
      
      if (scoringMode === 'simple_weighted') {
        // 简单加权模式验证
        const selfWeight = (config.scoring_rules.self_evaluation?.weight_in_final || 0) * 100
        const leaderWeight = (config.scoring_rules.leader_evaluation?.weight_in_final || 0) * 100
        const bossWeight = (config.scoring_rules.boss_evaluation?.weight_in_final || 0) * 100
        const scoringRulesWeightSum = Math.round(selfWeight + leaderWeight + bossWeight)
        if (scoringRulesWeightSum !== 100) {
          errors.push(`评分规则权重总和为 ${scoringRulesWeightSum}%，应为 100%`)
        }
      } else if (scoringMode === 'two_tier_weighted') {
        // 两层加权模式验证
        const twoTierConfig = config.scoring_rules.two_tier_config
        if (twoTierConfig) {
          // 第一层权重验证
          const firstLayerWeight = Math.round(twoTierConfig.employee_leader_weight + twoTierConfig.boss_weight)
          if (firstLayerWeight !== 100) {
            errors.push(`第一层权重总和为 ${firstLayerWeight}%，应为 100%`)
          }
          
          // 第二层权重验证
          const secondLayerWeight = Math.round(twoTierConfig.self_weight_in_employee_leader + twoTierConfig.leader_weight_in_employee_leader)
          if (secondLayerWeight !== 100) {
            errors.push(`第二层权重总和为 ${secondLayerWeight}%，应为 100%`)
          }
        } else {
          errors.push('两层加权模式配置缺失')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 渲染可编辑的模板配置
  const renderEditableTemplateConfig = (template: Template) => {
    const { config } = template
    const isEditing = editingTemplateId === template.id
    
    // 防御性检查
    if (!config || !config.categories || !Array.isArray(config.categories)) {
      return (
        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
          <div className="text-sm text-gray-600">
            模板配置信息不完整或格式错误
          </div>
        </div>
      )
    }

    // 计算权重统计
    const categoryWeightSum = calculateCategoryWeightSum(config.categories)
    const validation = validateWeights(template)
    
    return (
      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              {templateUtils.getTemplateConfigSummary(config)}
            </div>
            {isEditing && (
              <div className="flex items-center gap-4 text-xs">
                <span className={`font-medium ${categoryWeightSum === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  分类权重总和: {categoryWeightSum}%
                </span>
                {!validation.isValid && (
                  <span className="text-red-600">⚠️ 权重配置有误</span>
                )}
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleAddCategory(template)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                添加大项
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancelEdit}
                className="text-xs"
              >
                取消
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleSaveTemplate(template)}
                disabled={submitting || !validation.isValid}
                className="text-xs"
              >
                {submitting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                保存
              </Button>
            </div>
          ) : null}
        </div>
        
        {config.categories.map((category) => {
          const itemWeightSum = category.items ? calculateItemWeightSum(category.items) : 0
          const categoryValid = !category.items || category.items.length === 0 || itemWeightSum === 100
          
          return (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={category.name}
                        onChange={(e) => handleUpdateCategory(template, category.id, { name: e.target.value })}
                        className="font-semibold max-w-40"
                      />
                      <Input
                        type="number"
                        value={category.weight}
                        onChange={(e) => handleUpdateCategory(template, category.id, { weight: parseInt(e.target.value) || 0 })}
                        className="w-16"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm">%</span>
                      {category.items && category.items.length > 0 && (
                        <span className={`text-xs ${categoryValid ? 'text-green-600' : 'text-red-600'}`}>
                          (小项: {itemWeightSum}%)
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold">{category.name}</h4>
                      <Badge variant="outline">{category.weight}%</Badge>
                    </>
                  )}
                  {category.special_attributes?.leader_only && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">仅限领导评分</Badge>
                  )}
                </div>
                {isEditing && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItem(template, category.id)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      添加小项
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(template, category.id)}
                      className="text-xs text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            
              {isEditing && (
                <div className="mb-3">
                  <Input
                    value={category.description}
                    onChange={(e) => handleUpdateCategory(template, category.id, { description: e.target.value })}
                    placeholder="分类描述"
                    className="text-sm"
                  />
                </div>
              )}
              
              {!isEditing && (
                <div className="text-sm text-gray-600 mb-3">
                  {category.description}
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  评估项目 ({category.items && Array.isArray(category.items) ? category.items.length : 0}项):
                </Label>
                <div className="space-y-2">
                  {category.items && Array.isArray(category.items) ? category.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      {isEditing ? (
                        <>
                          <Input
                            value={item.name}
                            onChange={(e) => handleUpdateItem(template, category.id, item.id, { name: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="项目名称"
                          />
                          <Input
                            type="number"
                            value={item.weight}
                            onChange={(e) => handleUpdateItem(template, category.id, item.id, { weight: parseInt(e.target.value) || 0 })}
                            className="w-16 text-sm"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs">%</span>
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateItem(template, category.id, item.id, { description: e.target.value })}
                            className="flex-1 text-sm"
                            placeholder="项目描述"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(template, category.id, item.id)}
                            className="text-xs text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.name}</span>
                            <Badge variant="outline" className="text-xs">{item.weight}%</Badge>
                          </div>
                          {item.description && (
                            <span className="text-xs text-gray-500">{item.description}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500">暂无评估项目</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">总分:</span> {config.total_score}分
          </div>
          <div>
            <span className="font-medium">版本:</span> {config.version}
          </div>
        </div>
      </div>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              模板管理
            </CardTitle>
            <CardDescription>管理绩效考核模板配置</CardDescription>
          </div>
          {/* 新建模板按钮 - 仅管理员可见 */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                新建模板
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新建模板</DialogTitle>
                <DialogDescription>创建一个新的绩效评估模板</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">模板名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入模板名称"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">模板类型 *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择模板类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="okr">OKR模板</SelectItem>
                        <SelectItem value="assessment">考核模板</SelectItem>
                        <SelectItem value="evaluation">评估模板</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">模板描述</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="请输入模板描述"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default"
                    checked={formData.is_default === 1}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked ? 1 : 0 })}
                  />
                  <Label htmlFor="is_default">设为默认模板</Label>
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
                    创建模板
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索和筛选区域 */}
        <div className="space-y-4 mb-6">
          {/* 第一行：搜索框和操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Input
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex gap-2">
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
                重置
              </Button>
            </div>
          </div>
          
          {/* 第二行：筛选条件 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="筛选类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="okr">OKR模板</SelectItem>
                <SelectItem value="assessment">考核模板</SelectItem>
                <SelectItem value="evaluation">评估模板</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="1">启用</SelectItem>
                <SelectItem value="0">禁用</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedIsDefault} onValueChange={setSelectedIsDefault}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="是否默认" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模板</SelectItem>
                <SelectItem value="1">默认模板</SelectItem>
                <SelectItem value="0">非默认模板</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCreatedBy} onValueChange={setSelectedCreatedBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="创建者（管理员）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部管理员</SelectItem>
                {users && users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 模板列表 */}
        <div className="space-y-4">
          {templates && templates.length > 0 ? templates.map((template) => (
            <div key={template.id} className="border rounded-lg">
              {/* 模板头部 - 始终可见 */}
              <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleTemplateExpansion(template.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                      {expandedTemplates.has(template.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {template.name}
                        {template.is_default === 1 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {templateUtils.formatTemplateType(template.type)}
                    </Badge>
                    <Badge variant={template.status === 1 ? "default" : "destructive"}>
                      {templateUtils.formatTemplateStatus(template.status)}
                    </Badge>
                    <div className="flex gap-1 ml-2">
                      {template.is_default !== 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefault(template)
                          }}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTemplate(template)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除模板</AlertDialogTitle>
                            <AlertDialogDescription>
                              您确定要删除模板 "{template.name}" 吗？此操作无法撤销，模板删除后将无法恢复。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTemplate(template)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>

              {/* 模板详情 - 展开时显示 */}
              {expandedTemplates.has(template.id) && (
                <div className="px-4 pb-4">
                  {editingTemplateId === template.id ? (
                    // 编辑模式 - 模板基本信息
                    <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-sm">模板基本信息</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="template-name" className="text-xs">模板名称 *</Label>
                          <Input
                            id="template-name"
                            value={template.name}
                            onChange={(e) => {
                              const updatedTemplate = { ...template, name: e.target.value }
                              updateTemplateInState(updatedTemplate)
                            }}
                            className="text-sm"
                            placeholder="请输入模板名称"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-type" className="text-xs">模板类型 *</Label>
                          <Select
                            value={template.type}
                            onValueChange={(value) => {
                              const updatedTemplate = { ...template, type: value }
                              updateTemplateInState(updatedTemplate)
                            }}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="选择模板类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="okr">OKR模板</SelectItem>
                              <SelectItem value="assessment">考核模板</SelectItem>
                              <SelectItem value="evaluation">评估模板</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="template-description" className="text-xs">模板描述</Label>
                          <Input
                            id="template-description"
                            value={template.description}
                            onChange={(e) => {
                              const updatedTemplate = { ...template, description: e.target.value }
                              updateTemplateInState(updatedTemplate)
                            }}
                            className="text-sm"
                            placeholder="请输入模板描述"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">模板设置</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="template-is-default"
                                checked={template.is_default === 1}
                                onCheckedChange={(checked) => {
                                  const updatedTemplate = { ...template, is_default: checked ? 1 : 0 }
                                  updateTemplateInState(updatedTemplate)
                                }}
                              />
                              <Label htmlFor="template-is-default" className="text-xs">默认模板</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="template-status"
                                checked={template.status === 1}
                                onCheckedChange={(checked) => {
                                  const updatedTemplate = { ...template, status: checked ? 1 : 0 }
                                  updateTemplateInState(updatedTemplate)
                                }}
                              />
                              <Label htmlFor="template-status" className="text-xs">启用状态</Label>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">模板信息</Label>
                          <div className="text-xs text-gray-600 mt-2 space-y-1">
                            <div>创建者: {template.creator?.name || '未知'}</div>
                            <div>创建时间: {templateUtils.formatTemplateDate(template.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* 公共评分标准配置 */}
                  {editingTemplateId === template.id && (
                    <div className="space-y-4 mb-6 p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-sm">公共评分标准配置</h5>
                      <p className="text-xs text-gray-600">设置通用的评分等级标准，适用于所有评估项目</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 优秀等级 */}
                        <div>
                          <Label className="text-xs">优秀等级 (≥ 分数)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="number"
                              value={template.config.scoring_criteria?.excellent?.min || 90}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      ...template.config.scoring_criteria,
                                      excellent: {
                                        ...template.config.scoring_criteria?.excellent,
                                        min: parseInt(e.target.value) || 90
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm w-20"
                              placeholder="90"
                            />
                            <Input
                              value={template.config.scoring_criteria?.excellent?.description || "优秀：超额完成目标，表现突出"}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      excellent: {
                                        min: template.config.scoring_criteria?.excellent?.min || 90,
                                        description: e.target.value
                                      },
                                      good: {
                                        min: template.config.scoring_criteria?.good?.min || 80,
                                        description: template.config.scoring_criteria?.good?.description || "良好：完成目标，表现符合预期"
                                      },
                                      average: {
                                        min: template.config.scoring_criteria?.average?.min || 70,
                                        description: template.config.scoring_criteria?.average?.description || "一般：基本完成目标，表现一般"
                                      },
                                      poor: {
                                        min: template.config.scoring_criteria?.poor?.min || 0,
                                        description: template.config.scoring_criteria?.poor?.description || "较差：未完成目标，表现不佳"
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm flex-1"
                              placeholder="优秀等级描述"
                            />
                          </div>
                        </div>
                        
                        {/* 良好等级 */}
                        <div>
                          <Label className="text-xs">良好等级 (≥ 分数)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="number"
                              value={template.config.scoring_criteria?.good?.min || 80}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      ...template.config.scoring_criteria,
                                      good: {
                                        ...template.config.scoring_criteria?.good,
                                        min: parseInt(e.target.value) || 80
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm w-20"
                              placeholder="80"
                            />
                            <Input
                              value={template.config.scoring_criteria?.good?.description || "良好：完成目标，表现符合预期"}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      excellent: {
                                        min: template.config.scoring_criteria?.excellent?.min || 90,
                                        description: template.config.scoring_criteria?.excellent?.description || "优秀：超额完成目标，表现突出"
                                      },
                                      good: {
                                        min: template.config.scoring_criteria?.good?.min || 80,
                                        description: e.target.value
                                      },
                                      average: {
                                        min: template.config.scoring_criteria?.average?.min || 70,
                                        description: template.config.scoring_criteria?.average?.description || "一般：基本完成目标，表现一般"
                                      },
                                      poor: {
                                        min: template.config.scoring_criteria?.poor?.min || 0,
                                        description: template.config.scoring_criteria?.poor?.description || "较差：未完成目标，表现不佳"
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm flex-1"
                              placeholder="良好等级描述"
                            />
                          </div>
                        </div>
                        
                        {/* 一般等级 */}
                        <div>
                          <Label className="text-xs">一般等级 (≥ 分数)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="number"
                              value={template.config.scoring_criteria?.average?.min || 70}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      ...template.config.scoring_criteria,
                                      average: {
                                        ...template.config.scoring_criteria?.average,
                                        min: parseInt(e.target.value) || 70
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm w-20"
                              placeholder="70"
                            />
                            <Input
                              value={template.config.scoring_criteria?.average?.description || "一般：基本完成目标，表现一般"}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      excellent: {
                                        min: template.config.scoring_criteria?.excellent?.min || 90,
                                        description: template.config.scoring_criteria?.excellent?.description || "优秀：超额完成目标，表现突出"
                                      },
                                      good: {
                                        min: template.config.scoring_criteria?.good?.min || 80,
                                        description: template.config.scoring_criteria?.good?.description || "良好：完成目标，表现符合预期"
                                      },
                                      average: {
                                        min: template.config.scoring_criteria?.average?.min || 70,
                                        description: e.target.value
                                      },
                                      poor: {
                                        min: template.config.scoring_criteria?.poor?.min || 0,
                                        description: template.config.scoring_criteria?.poor?.description || "较差：未完成目标，表现不佳"
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm flex-1"
                              placeholder="一般等级描述"
                            />
                          </div>
                        </div>
                        
                        {/* 较差等级 */}
                        <div>
                          <Label className="text-xs">较差等级 (≥ 分数)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="number"
                              value={template.config.scoring_criteria?.poor?.min || 0}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      ...template.config.scoring_criteria,
                                      poor: {
                                        ...template.config.scoring_criteria?.poor,
                                        min: parseInt(e.target.value) || 0
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm w-20"
                              placeholder="0"
                            />
                            <Input
                              value={template.config.scoring_criteria?.poor?.description || "较差：未完成目标，表现不佳"}
                              onChange={(e) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_criteria: {
                                      excellent: {
                                        min: template.config.scoring_criteria?.excellent?.min || 90,
                                        description: template.config.scoring_criteria?.excellent?.description || "优秀：超额完成目标，表现突出"
                                      },
                                      good: {
                                        min: template.config.scoring_criteria?.good?.min || 80,
                                        description: template.config.scoring_criteria?.good?.description || "良好：完成目标，表现符合预期"
                                      },
                                      average: {
                                        min: template.config.scoring_criteria?.average?.min || 70,
                                        description: template.config.scoring_criteria?.average?.description || "一般：基本完成目标，表现一般"
                                      },
                                      poor: {
                                        min: template.config.scoring_criteria?.poor?.min || 0,
                                        description: e.target.value
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                              className="text-sm flex-1"
                              placeholder="较差等级描述"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 评分规则配置 */}
                  {editingTemplateId === template.id && (
                    <div className="space-y-4 mb-6 p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-sm">评分规则配置</h5>
                      <p className="text-xs text-gray-600">设置评分模式和权重分配</p>
                      
                      {/* 评分模式选择器 */}
                      <div>
                        <Label className="text-xs">评分模式</Label>
                        <Select
                          value={template.config.scoring_rules?.scoring_mode || 'simple_weighted'}
                          onValueChange={(value: ScoringMode) => {
                            let updatedScoringRules = {
                              ...template.config.scoring_rules,
                              scoring_mode: value
                            }
                            
                            if (value === 'two_tier_weighted') {
                              // 切换到两层加权模式：完全重构 scoring_rules
                              updatedScoringRules = {
                                scoring_mode: 'two_tier_weighted',
                                calculation_method: updatedScoringRules.calculation_method,
                                two_tier_config: updatedScoringRules.two_tier_config || {
                                  employee_leader_weight: 80,
                                  boss_weight: 20,
                                  self_weight_in_employee_leader: 60,
                                  leader_weight_in_employee_leader: 40
                                }
                                // 完全移除 self_evaluation, leader_evaluation, boss_evaluation
                              }
                            } else {
                              // 切换到简单加权模式：恢复传统配置
                              updatedScoringRules = {
                                scoring_mode: 'simple_weighted',
                                calculation_method: updatedScoringRules.calculation_method,
                                self_evaluation: {
                                  enabled: true,
                                  description: "员工自我评估",
                                  weight_in_final: 0.4
                                },
                                leader_evaluation: {
                                  enabled: true,
                                  description: "直属领导评估",
                                  weight_in_final: 0.6
                                }
                                // 移除 two_tier_config
                              }
                            }
                            
                            const updatedTemplate = {
                              ...template,
                              config: {
                                ...template.config,
                                scoring_rules: updatedScoringRules
                              }
                            }
                            updateTemplateInState(updatedTemplate)
                          }}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="选择评分模式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple_weighted">简单加权模式</SelectItem>
                            <SelectItem value="two_tier_weighted">两层加权模式</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* 条件渲染：根据评分模式显示不同的配置界面 */}
                      {(template.config.scoring_rules?.scoring_mode || 'simple_weighted') === 'simple_weighted' ? (
                        // 简单加权模式配置
                        <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 员工自评配置 */}
                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium">员工自我评估</Label>
                            <Switch
                              checked={template.config.scoring_rules?.self_evaluation?.enabled || false}
                              onCheckedChange={(checked) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_rules: {
                                      ...template.config.scoring_rules,
                                      self_evaluation: {
                                        enabled: checked,
                                        description: template.config.scoring_rules?.self_evaluation?.description || "员工自我评估",
                                        weight_in_final: template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                            />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">描述</Label>
                              <Input
                                value={template.config.scoring_rules?.self_evaluation?.description || "员工自我评估"}
                                onChange={(e) => {
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        self_evaluation: {
                                          enabled: template.config.scoring_rules?.self_evaluation?.enabled || true,
                                          description: e.target.value,
                                          weight_in_final: template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                                className="text-sm"
                                placeholder="员工自我评估"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">权重 (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round((template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36) * 100)}
                                onChange={(e) => {
                                  const percentage = parseInt(e.target.value) || 0
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        self_evaluation: {
                                          enabled: template.config.scoring_rules?.self_evaluation?.enabled || true,
                                          description: template.config.scoring_rules?.self_evaluation?.description || "员工自我评估",
                                          weight_in_final: percentage / 100
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                                className="text-sm"
                                placeholder="36"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* 领导评分配置 */}
                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium">直属领导评估</Label>
                            <Switch
                              checked={template.config.scoring_rules?.leader_evaluation?.enabled || false}
                              onCheckedChange={(checked) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_rules: {
                                      ...template.config.scoring_rules,
                                      leader_evaluation: {
                                        enabled: checked,
                                        description: template.config.scoring_rules?.leader_evaluation?.description || "直属领导评估",
                                        weight_in_final: template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                            />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">描述</Label>
                              <Input
                                value={template.config.scoring_rules?.leader_evaluation?.description || "直属领导评估"}
                                onChange={(e) => {
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        leader_evaluation: {
                                          enabled: template.config.scoring_rules?.leader_evaluation?.enabled || true,
                                          description: e.target.value,
                                          weight_in_final: template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                                className="text-sm"
                                placeholder="直属领导评估"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">权重 (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round((template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54) * 100)}
                                onChange={(e) => {
                                  const percentage = parseInt(e.target.value) || 0
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        leader_evaluation: {
                                          enabled: template.config.scoring_rules?.leader_evaluation?.enabled || true,
                                          description: template.config.scoring_rules?.leader_evaluation?.description || "直属领导评估",
                                          weight_in_final: percentage / 100
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                                className="text-sm"
                                placeholder="54"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Boss评分配置 */}
                        <div className="p-3 bg-white rounded border">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium">上级(Boss)评估</Label>
                            <Switch
                              checked={template.config.scoring_rules?.boss_evaluation?.enabled || false}
                              onCheckedChange={(checked) => {
                                const updatedTemplate = {
                                  ...template,
                                  config: {
                                    ...template.config,
                                    scoring_rules: {
                                      ...template.config.scoring_rules,
                                      boss_evaluation: {
                                        enabled: checked,
                                        description: template.config.scoring_rules?.boss_evaluation?.description || "上级(Boss)评估",
                                        weight_in_final: template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.10,
                                        is_optional: template.config.scoring_rules?.boss_evaluation?.is_optional !== false
                                      }
                                    }
                                  }
                                }
                                updateTemplateInState(updatedTemplate)
                              }}
                            />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">描述</Label>
                              <Input
                                value={template.config.scoring_rules?.boss_evaluation?.description || "上级(Boss)评估"}
                                onChange={(e) => {
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        boss_evaluation: {
                                          enabled: template.config.scoring_rules?.boss_evaluation?.enabled || false,
                                          description: e.target.value,
                                          weight_in_final: template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.10,
                                          is_optional: template.config.scoring_rules?.boss_evaluation?.is_optional !== false
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                                className="text-sm"
                                placeholder="上级(Boss)评估"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">权重 (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.round((template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.10) * 100)}
                                onChange={(e) => {
                                  const percentage = parseInt(e.target.value) || 0
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        boss_evaluation: {
                                          enabled: template.config.scoring_rules?.boss_evaluation?.enabled || false,
                                          description: template.config.scoring_rules?.boss_evaluation?.description || "上级(Boss)评估",
                                          weight_in_final: percentage / 100,
                                          is_optional: template.config.scoring_rules?.boss_evaluation?.is_optional !== false
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                                className="text-sm"
                                placeholder="10"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="boss-optional"
                                checked={template.config.scoring_rules?.boss_evaluation?.is_optional !== false}
                                onCheckedChange={(checked) => {
                                  const updatedTemplate = {
                                    ...template,
                                    config: {
                                      ...template.config,
                                      scoring_rules: {
                                        ...template.config.scoring_rules,
                                        boss_evaluation: {
                                          enabled: template.config.scoring_rules?.boss_evaluation?.enabled || false,
                                          description: template.config.scoring_rules?.boss_evaluation?.description || "上级(Boss)评估",
                                          weight_in_final: template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.10,
                                          is_optional: checked
                                        }
                                      }
                                    }
                                  }
                                  updateTemplateInState(updatedTemplate)
                                }}
                              />
                              <Label htmlFor="boss-optional" className="text-xs">可选项</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 计算方法 */}
                      <div>
                        <Label className="text-xs">计算方法</Label>
                        <Select
                          value={template.config.scoring_rules?.calculation_method || "weighted_average"}
                          onValueChange={(value) => {
                            const updatedTemplate = {
                              ...template,
                              config: {
                                ...template.config,
                                scoring_rules: {
                                  ...template.config.scoring_rules,
                                  calculation_method: value
                                }
                              }
                            }
                            updateTemplateInState(updatedTemplate)
                          }}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="选择计算方法" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weighted_average">加权平均</SelectItem>
                            <SelectItem value="simple_average">简单平均</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* 权重验证提示 */}
                      {(() => {
                        const selfWeight = (template.config.scoring_rules?.self_evaluation?.weight_in_final || 0.36) * 100
                        const leaderWeight = (template.config.scoring_rules?.leader_evaluation?.weight_in_final || 0.54) * 100
                        const bossWeight = (template.config.scoring_rules?.boss_evaluation?.weight_in_final || 0.10) * 100
                        const total = Math.round(selfWeight + leaderWeight + bossWeight)
                        const isValid = total === 100
                        
                        if (!isValid) {
                          return (
                            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              权重总和为 {total}%，应为 100%
                            </div>
                          )
                        } else {
                          return (
                            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                              权重配置正确 ✓
                            </div>
                          )
                        }
                      })()}
                        </>
                      ) : (
                        // 两层加权模式配置
                        <div className="space-y-6">
                          <div className="p-4 bg-blue-50 rounded-lg border">
                            <h6 className="font-medium text-sm mb-3 text-blue-800">两层加权评分模式</h6>
                            <p className="text-xs text-blue-600 mb-6">
                              采用两层权重分配机制，第一层决定总体评估来源的权重，第二层细化员工+领导评估内部的权重分配
                            </p>
                            
                            {/* 第一层权重配置 */}
                            <div className="mb-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                <Label className="text-sm font-medium text-blue-700">第一层：总体评估权重分配</Label>
                              </div>
                              <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="text-xs text-gray-600 whitespace-nowrap">员工+领导评估</span>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={template.config.scoring_rules?.two_tier_config?.employee_leader_weight || 80}
                                      onChange={(e) => {
                                        const percentage = parseInt(e.target.value) || 80
                                        const updatedTemplate = {
                                          ...template,
                                          config: {
                                            ...template.config,
                                            scoring_rules: {
                                              ...template.config.scoring_rules,
                                              two_tier_config: {
                                                ...template.config.scoring_rules?.two_tier_config,
                                                employee_leader_weight: percentage,
                                                boss_weight: 100 - percentage
                                              }
                                            }
                                          }
                                        }
                                        updateTemplateInState(updatedTemplate)
                                      }}
                                      className="text-sm w-16 h-8"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                  
                                  <span className="text-xs text-gray-600 whitespace-nowrap">Boss评估</span>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={template.config.scoring_rules?.two_tier_config?.boss_weight || 20}
                                      onChange={(e) => {
                                        const percentage = parseInt(e.target.value) || 20
                                        const updatedTemplate = {
                                          ...template,
                                          config: {
                                            ...template.config,
                                            scoring_rules: {
                                              ...template.config.scoring_rules,
                                              two_tier_config: {
                                                ...template.config.scoring_rules?.two_tier_config,
                                                boss_weight: percentage,
                                                employee_leader_weight: 100 - percentage
                                              }
                                            }
                                          }
                                        }
                                        updateTemplateInState(updatedTemplate)
                                      }}
                                      className="text-sm w-16 h-8"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                  
                                  {/* 第一层验证提示 - 内联显示 */}
                                  {(() => {
                                    const config = template.config.scoring_rules?.two_tier_config
                                    if (!config) return null
                                    const firstLayerTotal = Math.round(config.employee_leader_weight + config.boss_weight)
                                    const isFirstLayerValid = firstLayerTotal === 100
                                    
                                    return (
                                      <div className={`px-2 py-1 border rounded text-xs whitespace-nowrap ${isFirstLayerValid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        总计: {firstLayerTotal}% {isFirstLayerValid ? '✓' : '⚠️'}
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                            
                            {/* 第二层权重配置 */}
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                <Label className="text-sm font-medium text-purple-700">第二层：员工+领导评估内部权重分配</Label>
                              </div>
                              <div className="bg-white p-3 rounded-lg border-2 border-purple-200">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="text-xs text-gray-600 whitespace-nowrap">员工自评</span>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={template.config.scoring_rules?.two_tier_config?.self_weight_in_employee_leader || 60}
                                      onChange={(e) => {
                                        const percentage = parseInt(e.target.value) || 60
                                        const updatedTemplate = {
                                          ...template,
                                          config: {
                                            ...template.config,
                                            scoring_rules: {
                                              ...template.config.scoring_rules,
                                              two_tier_config: {
                                                ...template.config.scoring_rules?.two_tier_config,
                                                self_weight_in_employee_leader: percentage,
                                                leader_weight_in_employee_leader: 100 - percentage
                                              }
                                            }
                                          }
                                        }
                                        updateTemplateInState(updatedTemplate)
                                      }}
                                      className="text-sm w-16 h-8"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                  
                                  <span className="text-xs text-gray-600 whitespace-nowrap">领导评分</span>
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={template.config.scoring_rules?.two_tier_config?.leader_weight_in_employee_leader || 40}
                                      onChange={(e) => {
                                        const percentage = parseInt(e.target.value) || 40
                                        const updatedTemplate = {
                                          ...template,
                                          config: {
                                            ...template.config,
                                            scoring_rules: {
                                              ...template.config.scoring_rules,
                                              two_tier_config: {
                                                ...template.config.scoring_rules?.two_tier_config,
                                                leader_weight_in_employee_leader: percentage,
                                                self_weight_in_employee_leader: 100 - percentage
                                              }
                                            }
                                          }
                                        }
                                        updateTemplateInState(updatedTemplate)
                                      }}
                                      className="text-sm w-16 h-8"
                                    />
                                    <span className="text-xs text-gray-500">%</span>
                                  </div>
                                  
                                  {/* 第二层验证提示 - 内联显示 */}
                                  {(() => {
                                    const config = template.config.scoring_rules?.two_tier_config
                                    if (!config) return null
                                    const secondLayerTotal = Math.round(config.self_weight_in_employee_leader + config.leader_weight_in_employee_leader)
                                    const isSecondLayerValid = secondLayerTotal === 100
                                    
                                    return (
                                      <div className={`px-2 py-1 border rounded text-xs whitespace-nowrap ${isSecondLayerValid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        总计: {secondLayerTotal}% {isSecondLayerValid ? '✓' : '⚠️'}
                                      </div>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                            
                            {/* 整体配置状态 */}
                            {(() => {
                              const config = template.config.scoring_rules?.two_tier_config
                              if (!config) return null
                              
                              const firstLayerTotal = Math.round(config.employee_leader_weight + config.boss_weight)
                              const secondLayerTotal = Math.round(config.self_weight_in_employee_leader + config.leader_weight_in_employee_leader)
                              const isFirstLayerValid = firstLayerTotal === 100
                              const isSecondLayerValid = secondLayerTotal === 100
                              const isValid = isFirstLayerValid && isSecondLayerValid
                              
                              if (isValid) {
                                return (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                                    <div className="text-sm font-medium text-green-800">
                                      ✅ 两层加权配置正确
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                      所有权重配置均符合要求，可以保存模板
                                    </div>
                                  </div>
                                )
                              }
                              
                              return null
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!editingTemplateId && (
                    <>
                      {/* 查看模式 - 模板基本信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">创建者：</span>
                          <span className="font-medium">{template.creator?.name || '未知'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">创建时间：</span>
                          <span className="font-medium">{templateUtils.formatTemplateDate(template.created_at)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">默认模板：</span>
                          <span className="font-medium">{templateUtils.formatIsDefault(template.is_default)}</span>
                        </div>
                      </div>
                      
                      {/* 查看模式 - 公共评分标准显示 */}
                      {template.config.scoring_criteria && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h6 className="font-medium text-sm mb-2">公共评分标准</h6>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="p-2 bg-white rounded border">
                              <div className="font-medium text-green-700">优秀 (≥{template.config.scoring_criteria.excellent?.min || 90}分)</div>
                              <div className="text-gray-600 mt-1">{template.config.scoring_criteria.excellent?.description || "优秀等级"}</div>
                            </div>
                            <div className="p-2 bg-white rounded border">
                              <div className="font-medium text-blue-700">良好 (≥{template.config.scoring_criteria.good?.min || 80}分)</div>
                              <div className="text-gray-600 mt-1">{template.config.scoring_criteria.good?.description || "良好等级"}</div>
                            </div>
                            <div className="p-2 bg-white rounded border">
                              <div className="font-medium text-yellow-700">一般 (≥{template.config.scoring_criteria.average?.min || 70}分)</div>
                              <div className="text-gray-600 mt-1">{template.config.scoring_criteria.average?.description || "一般等级"}</div>
                            </div>
                            <div className="p-2 bg-white rounded border">
                              <div className="font-medium text-red-700">较差 (≥{template.config.scoring_criteria.poor?.min || 0}分)</div>
                              <div className="text-gray-600 mt-1">{template.config.scoring_criteria.poor?.description || "较差等级"}</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 查看模式 - 评分规则显示 */}
                      {template.config.scoring_rules && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <h6 className="font-medium text-sm mb-2">评分规则配置</h6>
                          
                          {/* 评分模式显示 */}
                          <div className="mb-3">
                            <span className="text-xs text-gray-600">评分模式: </span>
                            <span className="font-medium text-sm">
                              {(template.config.scoring_rules.scoring_mode || 'simple_weighted') === 'two_tier_weighted' ? '两层加权模式' : '简单加权模式'}
                            </span>
                          </div>
                          
                          {/* 根据评分模式显示不同内容 */}
                          {(template.config.scoring_rules.scoring_mode || 'simple_weighted') === 'two_tier_weighted' ? (
                            // 两层加权模式显示
                            template.config.scoring_rules.two_tier_config ? (
                              <div className="space-y-4">
                                <div className="p-3 bg-blue-50 rounded-lg border">
                                  <h6 className="font-medium text-sm mb-3 text-blue-800">两层加权配置</h6>
                                  
                                  {/* 第一层权重显示 */}
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                                      <span className="text-sm font-medium text-blue-700">第一层：总体评估权重分配</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="p-2 bg-white rounded border">
                                        <div className="text-sm font-medium text-gray-700">员工+领导评估</div>
                                        <div className="text-lg font-bold text-blue-600">
                                          {template.config.scoring_rules.two_tier_config.employee_leader_weight}%
                                        </div>
                                      </div>
                                      <div className="p-2 bg-white rounded border">
                                        <div className="text-sm font-medium text-gray-700">Boss评估</div>
                                        <div className="text-lg font-bold text-purple-600">
                                          {template.config.scoring_rules.two_tier_config.boss_weight}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 第二层权重显示 */}
                                  <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                                      <span className="text-sm font-medium text-purple-700">第二层：员工+领导评估内部权重分配</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="p-2 bg-white rounded border">
                                        <div className="text-sm font-medium text-gray-700">员工自评</div>
                                        <div className="text-lg font-bold text-green-600">
                                          {template.config.scoring_rules.two_tier_config.self_weight_in_employee_leader}%
                                        </div>
                                      </div>
                                      <div className="p-2 bg-white rounded border">
                                        <div className="text-sm font-medium text-gray-700">领导评分</div>
                                        <div className="text-lg font-bold text-orange-600">
                                          {template.config.scoring_rules.two_tier_config.leader_weight_in_employee_leader}%
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* 维度权重配置显示（基于categories） */}
                                  <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">维度权重配置</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {template.config.categories.map((category) => (
                                        <div key={category.id} className="p-2 bg-white rounded border">
                                          <div className="text-xs text-gray-600">{category.name}</div>
                                          <div className="text-sm font-bold text-indigo-600">
                                            {category.weight}%
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {category.description}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* 权重验证状态 */}
                                  <div className="mt-3 pt-3 border-t border-blue-200">
                                    {(() => {
                                      const config = template.config.scoring_rules.two_tier_config
                                      const firstLayerTotal = config.employee_leader_weight + config.boss_weight
                                      const secondLayerTotal = config.self_weight_in_employee_leader + config.leader_weight_in_employee_leader
                                      const isValid = firstLayerTotal === 100 && secondLayerTotal === 100
                                      
                                      return (
                                        <div className={`text-xs px-2 py-1 rounded ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          配置状态: {isValid ? '✅ 权重配置正确' : '⚠️ 权重配置有误'}
                                        </div>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                两层加权配置缺失
                              </div>
                            )
                          ) : (
                            // 简单加权模式显示（原有逻辑）
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* 员工自评 */}
                                <div className="p-2 bg-white rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-medium text-sm text-blue-700">员工自我评估</div>
                                    <div className={`text-xs px-2 py-1 rounded ${template.config.scoring_rules.self_evaluation?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {template.config.scoring_rules.self_evaluation?.enabled ? '启用' : '禁用'}
                                    </div>
                                  </div>
                                  <div className="text-gray-600 text-xs mb-1">
                                    {template.config.scoring_rules.self_evaluation?.description || "员工自我评估"}
                                  </div>
                                  <div className="text-sm font-medium">
                                    权重: {Math.round((template.config.scoring_rules.self_evaluation?.weight_in_final || 0.4) * 100)}%
                                  </div>
                                </div>
                                
                                {/* 领导评分 */}
                                <div className="p-2 bg-white rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="font-medium text-sm text-purple-700">直属领导评估</div>
                                    <div className={`text-xs px-2 py-1 rounded ${template.config.scoring_rules.leader_evaluation?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {template.config.scoring_rules.leader_evaluation?.enabled ? '启用' : '禁用'}
                                    </div>
                                  </div>
                                  <div className="text-gray-600 text-xs mb-1">
                                    {template.config.scoring_rules.leader_evaluation?.description || "直属领导评估"}
                                  </div>
                                  <div className="text-sm font-medium">
                                    权重: {Math.round((template.config.scoring_rules.leader_evaluation?.weight_in_final || 0.6) * 100)}%
                                  </div>
                                </div>
                              </div>
                              
                              {/* 计算方法和权重验证 */}
                              <div className="mt-3 flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-gray-600">计算方法: </span>
                                  <span className="font-medium">
                                    {template.config.scoring_rules.calculation_method === 'weighted_average' ? '加权平均' : '简单平均'}
                                  </span>
                                </div>
                                {(() => {
                                  const selfWeight = (template.config.scoring_rules.self_evaluation?.weight_in_final || 0.36) * 100
                                  const leaderWeight = (template.config.scoring_rules.leader_evaluation?.weight_in_final || 0.54) * 100
                                  const bossWeight = (template.config.scoring_rules.boss_evaluation?.weight_in_final || 0.10) * 100
                                  const total = Math.round(selfWeight + leaderWeight + bossWeight)
                                  const isValid = total === 100
                                  
                                  return (
                                    <div className={`px-2 py-1 rounded ${isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      权重总计: {total}% {isValid ? '✓' : '⚠️'}
                                    </div>
                                  )
                                })()}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {renderEditableTemplateConfig(template)}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              {loading ? "加载中..." : "暂无模板数据"}
            </div>
          )}
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
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
      </CardContent>
    </Card>
  )
}