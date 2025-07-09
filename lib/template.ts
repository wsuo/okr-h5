/**
 * 模板管理相关类型定义和服务
 */

import { apiClient, ApiResponse } from './api'

// 评分标准接口
export interface ScoringCriteria {
  excellent: {
    min: number
    description: string
  }
  good: {
    min: number
    description: string
  }
  average: {
    min: number
    description: string
  }
  poor: {
    min: number
    description: string
  }
}

// 评估项目接口
export interface EvaluationItem {
  id: string
  name: string
  weight: number
  max_score: number
  description: string
  // scoring_criteria 已移至公共配置
}

// 评估分类接口
export interface EvaluationCategory {
  id: string
  name: string
  weight: number
  description: string
  items: EvaluationItem[]
  evaluator_types: string[]
  special_attributes?: {
    leader_only?: boolean
    required_role?: string
  }
}

// 评分规则接口
export interface ScoringRules {
  self_evaluation: {
    enabled: boolean
    description: string
    weight_in_final: number
  }
  leader_evaluation: {
    enabled: boolean
    description: string
    weight_in_final: number
  }
  calculation_method: string
}

// 使用说明接口
export interface UsageInstructions {
  for_leaders: string[]
  for_employees: string[]
}

// 模板配置接口
export interface TemplateConfig {
  version: string
  categories: EvaluationCategory[]
  description: string
  total_score: number
  scoring_rules: ScoringRules
  scoring_method: string
  usage_instructions: UsageInstructions
  // 公共评分标准配置
  scoring_criteria: ScoringCriteria
}

// 模板创建者接口
export interface TemplateCreator {
  id: number
  username: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  status: number
  join_date: string
  position?: string
  department_id?: number
  leader_id?: number
  created_at: string
  updated_at: string
}

// 模板接口
export interface Template {
  id: number
  name: string
  description: string
  type: string
  config: TemplateConfig
  is_default: number
  status: number
  created_at: string
  updated_at: string
  creator: TemplateCreator
}

// 模板列表查询参数
export interface TemplateListQuery {
  page?: number
  limit?: number
  name?: string
  type?: string
  status?: number
  is_default?: number
  created_by?: number
}

// 模板列表响应接口
export interface TemplateListResponse {
  items: Template[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 创建模板请求接口
export interface CreateTemplateDto {
  name: string
  description: string
  type: string
  config: TemplateConfig
  is_default?: number
}

// 更新模板请求接口
export interface UpdateTemplateDto {
  name?: string
  description?: string
  type?: string
  config?: TemplateConfig
  is_default?: number
  status?: number
}

// 模板服务类
class TemplateService {
  // 获取模板列表
  async getTemplates(query?: TemplateListQuery): Promise<ApiResponse<TemplateListResponse>> {
    try {
      return await apiClient.get<TemplateListResponse>('/templates', query)
    } catch (error) {
      console.error('Get templates failed:', error)
      throw error
    }
  }

  // 获取模板详情
  async getTemplate(id: number): Promise<ApiResponse<Template>> {
    try {
      return await apiClient.get<Template>(`/templates/${id}`)
    } catch (error) {
      console.error('Get template failed:', error)
      throw error
    }
  }

  // 创建模板
  async createTemplate(templateData: CreateTemplateDto): Promise<ApiResponse<Template>> {
    try {
      return await apiClient.post<Template>('/templates', templateData)
    } catch (error) {
      console.error('Create template failed:', error)
      throw error
    }
  }

  // 更新模板
  async updateTemplate(id: number, templateData: UpdateTemplateDto): Promise<ApiResponse<Template>> {
    try {
      return await apiClient.put<Template>(`/templates/${id}`, templateData)
    } catch (error) {
      console.error('Update template failed:', error)
      throw error
    }
  }

  // 删除模板
  async deleteTemplate(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.delete<{ message: string }>(`/templates/${id}`)
    } catch (error) {
      console.error('Delete template failed:', error)
      throw error
    }
  }

  // 设置默认模板
  async setDefaultTemplate(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.put<{ message: string }>(`/templates/${id}/default`)
    } catch (error) {
      console.error('Set default template failed:', error)
      throw error
    }
  }
}

// 导出模板服务实例
export const templateService = new TemplateService()

// 导出模板相关的工具函数
export const templateUtils = {
  // 格式化模板类型
  formatTemplateType(type: string): string {
    switch (type) {
      case 'okr':
        return 'OKR模板'
      case 'assessment':
        return '考核模板'
      case 'evaluation':
        return '评估模板'
      default:
        return type
    }
  },

  // 格式化模板状态
  formatTemplateStatus(status: number): string {
    return status === 1 ? '启用' : '禁用'
  },

  // 获取模板状态颜色
  getTemplateStatusColor(status: number): string {
    return status === 1 ? 'text-green-600' : 'text-red-600'
  },

  // 格式化创建时间
  formatTemplateDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
  },

  // 格式化是否默认模板
  formatIsDefault(isDefault: number): string {
    return isDefault === 1 ? '是' : '否'
  },

  // 计算模板总权重
  calculateTotalWeight(categories: EvaluationCategory[]): number {
    return categories.reduce((total, category) => total + category.weight, 0)
  },

  // 计算分类下项目总权重
  calculateCategoryItemsWeight(items: EvaluationItem[]): number {
    return items.reduce((total, item) => total + item.weight, 0)
  },

  // 获取模板配置摘要
  getTemplateConfigSummary(config: TemplateConfig): string {
    if (!config || !config.categories || !Array.isArray(config.categories)) {
      return '配置信息不完整'
    }
    const categoryCount = config.categories.length
    const totalItems = config.categories.reduce((total, cat) => {
      return total + (cat.items && Array.isArray(cat.items) ? cat.items.length : 0)
    }, 0)
    return `${categoryCount}个分类，${totalItems}个评估项目`
  }
}