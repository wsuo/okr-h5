/**
 * 考核管理相关类型定义和服务
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api'

// 考核状态类型
export type AssessmentStatus = 'draft' | 'active' | 'completed' | 'ended'

// 考核参与者接口
export interface AssessmentParticipant {
  id: number
  user_id: number
  assessment_id: number
  user: {
    id: number
    username: string
    name: string
    email?: string
    phone?: string
    avatar?: string
    position?: string
    department?: {
      id: number
      name: string
    }
  }
  self_score?: number
  leader_score?: number
  final_score?: number
  self_completed: boolean
  leader_completed: boolean
  self_submitted_at?: string
  leader_submitted_at?: string
  created_at: string
  updated_at: string
}

// 考核统计信息接口
export interface AssessmentStatistics {
  total_participants: number
  self_completed_count: number
  leader_completed_count: number
  fully_completed_count: number
  average_score: number
  highest_score: number
  lowest_score: number
}

// 考核基本信息接口
export interface Assessment {
  id: number
  title: string
  period: string
  description?: string
  start_date: string
  end_date: string
  deadline: string
  status: AssessmentStatus
  template_id?: number
  template?: {
    id: number
    name: string
    description?: string
  }
  template_config?: any // 模板配置快照（已发布的考核会有此字段）
  participant_ids?: number[] // 参与者ID列表（用于表单回显）
  participants: AssessmentParticipant[]
  statistics: AssessmentStatistics
  created_at: string
  updated_at: string
  deleted_at?: string
}

// 考核列表项接口（简化版）
export interface AssessmentListItem {
  id: number
  title: string
  period: string
  description?: string
  start_date: string
  end_date: string
  deadline: string
  status: AssessmentStatus
  template_id?: number
  template?: {
    id: number
    name: string
  }
  template_config?: any // 模板配置快照（已发布的考核会有此字段）
  statistics: AssessmentStatistics
  created_at: string
  updated_at: string
}

// 创建考核请求接口
export interface CreateAssessmentRequest {
  title: string
  period: string
  description?: string
  start_date: string
  end_date: string
  deadline: string
  template_id?: number
  participant_ids: number[]
}

// 更新考核请求接口
export interface UpdateAssessmentRequest {
  title?: string
  period?: string
  description?: string
  start_date?: string
  end_date?: string
  deadline?: string
  status?: AssessmentStatus
  template_id?: number
}

// 考核查询参数接口
export interface AssessmentQueryParams {
  page?: number
  limit?: number
  status?: AssessmentStatus
  period?: string
  title?: string
  search?: string
}

// 考核结束预检查结果接口
export interface EndValidationResult {
  canEnd: boolean
  errors: string[]
  warnings: string[]
  participantStatus: Array<{
    userId: number
    userName: string
    selfCompleted: boolean
    leaderCompleted: boolean
    missingEvaluations: string[]
  }>
  templateConfig: {
    weightConfig: {
      scoring_rules: {
        self_evaluation: { weight_in_final: number }
        leader_evaluation: { weight_in_final: number }
      }
    }
    requiredEvaluations: string[]
  }
}

// 考核删除预检查结果接口
export interface DeleteValidationResult {
  canDelete: boolean
  errors: string[]
  warnings: string[]
  relatedData: {
    evaluationsCount: number
    okrsCount: number
    hasCompletedEvaluations: boolean
  }
  permissions: {
    canDelete: boolean
  }
}

// 考核发布预检查结果接口
export interface PublishValidationResult {
  canPublish: boolean
  errors: string[]
  warnings: string[]
  checks: {
    title: boolean
    dateConfig: boolean
    template: boolean
    participants: boolean
    permissions: boolean
  }
}

// 编辑考核请求接口
export interface EditAssessmentRequest {
  title?: string
  period?: string
  description?: string
  start_date?: string
  end_date?: string
  deadline?: string
  template_id?: number
  participant_ids?: number[]
}

// 得分计算预览结果接口
export interface ScorePreviewResult {
  participants: Array<{
    userId: number
    userName: string
    selfScore: number
    leaderScore: number
    calculatedFinalScore: number
    scoreBreakdown: Array<{
      category: string
      categoryName: string
      categoryWeight: number
      selfWeight: number
      leaderWeight: number
      selfScore: number
      leaderScore: number
      categoryScore: number
    }>
  }>
  templateConfig: {
    evaluatorWeights: {
      self: number
      leader: number
    }
    categoryWeights: Array<{
      id: string
      weight: number
    }>
  }
}

// 考核管理服务类
export class AssessmentService {
  
  /**
   * 获取考核列表
   */
  async getAssessments(params?: AssessmentQueryParams): Promise<ApiResponse<PaginatedResponse<AssessmentListItem>>> {
    const queryParams: Record<string, any> = {}
    
    if (params?.page) queryParams.page = params.page
    if (params?.limit) queryParams.limit = params.limit
    if (params?.status) queryParams.status = params.status
    if (params?.period) queryParams.period = params.period
    if (params?.title) queryParams.title = params.title
    if (params?.search) queryParams.search = params.search

    return apiClient.get<PaginatedResponse<AssessmentListItem>>('/assessments', queryParams)
  }

  /**
   * 获取考核详情
   */
  async getAssessmentById(id: number): Promise<ApiResponse<Assessment>> {
    return apiClient.get<Assessment>(`/assessments/${id}`)
  }

  /**
   * 创建考核
   */
  async createAssessment(data: CreateAssessmentRequest): Promise<ApiResponse<Assessment>> {
    return apiClient.post<Assessment>('/assessments', data)
  }

  /**
   * 更新考核
   */
  async updateAssessment(id: number, data: UpdateAssessmentRequest): Promise<ApiResponse<Assessment>> {
    return apiClient.put<Assessment>(`/assessments/${id}`, data)
  }

  /**
   * 结束考核
   */
  async endAssessment(id: number): Promise<ApiResponse<Assessment>> {
    return apiClient.post<Assessment>(`/assessments/${id}/end`)
  }

  /**
   * 删除考核（软删除）
   */
  async deleteAssessment(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/assessments/${id}`)
  }

  /**
   * 获取考核统计信息
   */
  async getAssessmentStatistics(id: number): Promise<ApiResponse<AssessmentStatistics>> {
    return apiClient.get<AssessmentStatistics>(`/assessments/${id}/statistics`)
  }

  /**
   * 导出考核数据
   */
  async exportAssessmentData(id: number): Promise<ApiResponse<Blob>> {
    return apiClient.get<Blob>(`/assessments/${id}/export`)
  }

  /**
   * 考核结束预检查
   */
  async endValidation(id: number): Promise<ApiResponse<EndValidationResult>> {
    return apiClient.get<EndValidationResult>(`/assessments/${id}/end-validation`)
  }

  /**
   * 考核删除预检查
   */
  async deleteValidation(id: number): Promise<ApiResponse<DeleteValidationResult>> {
    return apiClient.get<DeleteValidationResult>(`/assessments/${id}/delete-validation`)
  }

  /**
   * 得分计算预览
   */
  async scorePreview(id: number): Promise<ApiResponse<ScorePreviewResult>> {
    return apiClient.get<ScorePreviewResult>(`/assessments/${id}/score-preview`)
  }

  /**
   * 考核发布预检查
   */
  async publishValidation(id: number): Promise<ApiResponse<PublishValidationResult>> {
    return apiClient.get<PublishValidationResult>(`/assessments/${id}/publish-validation`)
  }

  /**
   * 发布考核（草稿→进行中）
   */
  async publishAssessment(id: number): Promise<ApiResponse<Assessment>> {
    return apiClient.post<Assessment>(`/assessments/${id}/publish`)
  }

  /**
   * 编辑考核（仅草稿状态）
   */
  async editAssessment(id: number, data: EditAssessmentRequest): Promise<ApiResponse<Assessment>> {
    return apiClient.put<Assessment>(`/assessments/${id}/edit`, data)
  }
}

// 考核管理服务实例
export const assessmentService = new AssessmentService()

// 工具函数
export const assessmentUtils = {
  /**
   * 获取考核的模板配置（支持快照功能）
   * 优先使用 template_config（快照），降级到 template.config
   */
  getTemplateConfig(assessment: Assessment): any {
    return assessment.template_config || assessment.template?.config || null
  },

  /**
   * 获取状态显示文本
   */
  getStatusText(status: AssessmentStatus): string {
    const statusMap = {
      draft: '草稿',
      active: '进行中',
      completed: '已完成',
      ended: '已结束'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取状态样式类
   */
  getStatusStyle(status: AssessmentStatus): string {
    const styleMap = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      ended: 'bg-red-100 text-red-800 border-red-200'
    }
    return styleMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  },

  /**
   * 检查是否可以编辑
   */
  canEdit(status: AssessmentStatus): boolean {
    return status === 'draft'
  },

  /**
   * 检查是否可以发布
   */
  canPublish(status: AssessmentStatus): boolean {
    return status === 'draft'
  },

  /**
   * 检查是否可以删除
   */
  canDelete(status: AssessmentStatus): boolean {
    return status !== 'active'
  },

  /**
   * 检查是否可以结束
   */
  canEnd(status: AssessmentStatus): boolean {
    return status === 'active'
  },

  /**
   * 检查状态转换是否有效
   */
  canTransitionTo(from: AssessmentStatus, to: AssessmentStatus): boolean {
    const validTransitions: Record<AssessmentStatus, AssessmentStatus[]> = {
      draft: ['active'],
      active: ['completed', 'ended'],
      completed: ['ended'],
      ended: []
    }
    return validTransitions[from]?.includes(to) || false
  },

  /**
   * 计算完成率
   */
  calculateCompletionRate(statistics: AssessmentStatistics): number {
    if (statistics.total_participants === 0) return 0
    return Math.round((statistics.fully_completed_count / statistics.total_participants) * 100)
  },

  /**
   * 格式化日期
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
  },

  /**
   * 格式化周期
   */
  formatPeriod(period: string): string {
    const [year, month] = period.split('-')
    return `${year}年${month}月`
  },

  /**
   * 检查是否过期
   */
  isExpired(deadline: string): boolean {
    return new Date(deadline) < new Date()
  },

  /**
   * 生成CSV数据
   */
  generateCSVData(assessment: Assessment): string {
    const headers = ['姓名', '部门', '职位', '自评完成', '领导评分完成', '自评得分', '领导得分', '最终得分']
    const rows = assessment.participants.map(participant => [
      participant.user.name,
      participant.user.department?.name || '',
      participant.user.position || '',
      participant.self_completed ? '是' : '否',
      participant.leader_completed ? '是' : '否',
      participant.self_score?.toString() || '',
      participant.leader_score?.toString() || '',
      participant.final_score?.toString() || ''
    ])

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
  }
}