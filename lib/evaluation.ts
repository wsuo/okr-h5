/**
 * 评估管理相关类型定义和服务
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api'

// 评估类型
export type EvaluationType = 'self' | 'leader'

// 评估状态
export type EvaluationStatus = 'draft' | 'submitted' | 'completed'

// 评估任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

// 评估基本信息接口
export interface Evaluation {
  id: number
  assessment_id: number
  evaluator_id: number
  evaluatee_id: number
  type: EvaluationType
  status: EvaluationStatus
  score?: number
  self_review?: string
  leader_review?: string
  feedback?: string  // Backend alias for leader_review
  strengths?: string
  improvements?: string
  submitted_at?: string
  created_at: string
  updated_at: string
  // 关联对象
  evaluatee?: {
    id: number
    name: string
    department?: {
      id: number
      name: string
    }
  }
  assessment?: {
    id: number
    title: string
    period: string
    deadline: string
  }
}

// 评估详细信息接口
export interface DetailedEvaluation extends Evaluation {
  detailed_scores: DetailedScore[]
}

// 详细评分数据结构
export interface DetailedScore {
  categoryId: string
  categoryScore: number
  items: DetailedScoreItem[]
}

export interface DetailedScoreItem {
  itemId: string
  score: number
  comment?: string
}

// 评分模板结构
export interface EvaluationTemplate {
  assessment_id: number
  assessment_title: string
  assessment_period: string
  version: string
  scoring_method: string
  total_score: number
  scoring_rules: ScoringRules
  categories: EvaluationCategory[]
}

export interface ScoringRules {
  self_evaluation: {
    enabled: boolean
    weight_in_final: number
  }
  leader_evaluation: {
    enabled: boolean
    weight_in_final: number
  }
  calculation_method: string
}

export interface EvaluationCategory {
  id: string
  name: string
  description: string
  weight: number
  evaluator_types: EvaluationType[]
  items: EvaluationItem[]
}

export interface EvaluationItem {
  id: string
  name: string
  description: string
  weight: number
  max_score: number
  scoring_criteria: ScoringCriteria
}

export interface ScoringCriteria {
  excellent: { min: number; description: string }
  good: { min: number; description: string }
  average: { min: number; description: string }
  poor: { min: number; description: string }
}

// 评估任务接口
export interface EvaluationTask {
  id: string
  assessment_id: number
  assessment_title: string
  assessment_period: string
  type: EvaluationType
  evaluatee_id: number
  evaluatee_name: string
  evaluatee_department: string
  status: TaskStatus
  deadline: string
  is_overdue: boolean
  evaluation_id?: number
  last_updated?: string
}

// 评估进度接口
export interface EvaluationProgress {
  assessment_id: number
  assessment_title: string
  total_participants: number
  self_completed_count: number
  leader_completed_count: number
  fully_completed_count: number
  self_completion_rate: number
  leader_completion_rate: number
  overall_completion_rate: number
  participants: ProgressParticipant[]
  deadline: string
  days_remaining: number
  is_overdue: boolean
}

export interface ProgressParticipant {
  user_id: number
  user_name: string
  department: string
  self_status: 'pending' | 'completed'
  leader_status: 'pending' | 'completed'
  self_completed_at?: string
  leader_completed_at?: string
}

// 下属评分任务接口
export interface SubordinateTask {
  subordinate_id: number
  subordinate_name: string
  subordinate_department: string
  status: 'pending' | 'in_progress' | 'completed'
  self_evaluation_completed: boolean
  self_evaluation_completed_at?: string
  leader_evaluation_id?: number
  leader_evaluation_completed_at?: string
  last_updated?: string
}

// 评估对比结果接口
export interface EvaluationComparison {
  assessment_id: number
  user_id: number
  user_name: string
  self_evaluation?: ComparisonEvaluation
  leader_evaluation?: ComparisonEvaluation
  comparison: ComparisonResult
}

export interface ComparisonEvaluation {
  id: number
  score: number
  detailed_scores: DetailedScore[]
  submitted_at: string
}

export interface ComparisonResult {
  overall_difference: number
  category_differences: CategoryDifference[]
}

export interface CategoryDifference {
  categoryId: string
  category_name: string
  self_score: number
  leader_score: number
  difference: number
  item_differences: ItemDifference[]
}

export interface ItemDifference {
  itemId: string
  item_name: string
  self_score: number
  leader_score: number
  difference: number
}

// 评估查询参数
export interface EvaluationQueryParams {
  page?: number
  limit?: number
  assessment_id?: number
  evaluatee_id?: number
  evaluator_id?: number
  type?: EvaluationType
  status?: EvaluationStatus
}

// 创建评估草稿请求
export interface CreateEvaluationDraftRequest {
  assessment_id: number
  type: EvaluationType
  evaluatee_id?: number
  self_review?: string
  leader_review?: string
  strengths?: string
  improvements?: string
  detailed_scores?: DetailedScore[]
}

// 更新评估草稿请求
export interface UpdateEvaluationDraftRequest {
  self_review?: string
  leader_review?: string
  strengths?: string
  improvements?: string
  detailed_scores?: DetailedScore[]
}

// 提交详细自评请求
export interface SubmitDetailedSelfRequest {
  assessment_id: number
  self_review: string
  strengths?: string
  improvements?: string
  detailed_scores: DetailedScore[]
}

// 提交详细领导评分请求
export interface SubmitDetailedLeaderRequest {
  assessment_id: number
  evaluatee_id: number
  leader_review: string
  strengths?: string
  improvements?: string
  detailed_scores: DetailedScore[]
}

// 传统评分请求（兼容性）
export interface SubmitSelfEvaluationRequest {
  assessment_id: number
  score: number
  self_review: string
  strengths?: string
  improvements?: string
}

export interface SubmitLeaderEvaluationRequest {
  assessment_id: number
  evaluatee_id: number
  score: number
  leader_review: string
  strengths?: string
  improvements?: string
}

// 更新评估请求
export interface UpdateEvaluationRequest {
  score?: number
  self_review?: string
  leader_review?: string
  strengths?: string
  improvements?: string
  detailed_scores?: DetailedScore[]
}

// 考核状态检查结果接口
export interface AssessmentStatusCheckResult {
  canEvaluate: boolean
  status: string
  isEnded: boolean
  message?: string
}

// 评估管理服务类
export class EvaluationService {
  
  /**
   * 0. 检查考核状态
   */
  async checkAssessmentStatus(assessmentId: number): Promise<ApiResponse<AssessmentStatusCheckResult>> {
    return apiClient.get<AssessmentStatusCheckResult>(`/assessments/${assessmentId}/status`)
  }

  /**
   * 1. 获取评估列表
   */
  async getEvaluations(params?: EvaluationQueryParams): Promise<ApiResponse<PaginatedResponse<Evaluation>>> {
    const queryParams: Record<string, any> = {}
    
    if (params?.page) queryParams.page = params.page
    if (params?.limit) queryParams.limit = params.limit
    if (params?.assessment_id) queryParams.assessment_id = params.assessment_id
    if (params?.evaluatee_id) queryParams.evaluatee_id = params.evaluatee_id
    if (params?.evaluator_id) queryParams.evaluator_id = params.evaluator_id
    if (params?.type) queryParams.type = params.type
    if (params?.status) queryParams.status = params.status

    return apiClient.get<PaginatedResponse<Evaluation>>('/evaluations', queryParams)
  }

  /**
   * 2. 获取我的评估记录
   */
  async getMyEvaluations(assessment_id?: number): Promise<ApiResponse<Evaluation[]>> {
    const queryParams: Record<string, any> = {}
    if (assessment_id) queryParams.assessment_id = assessment_id

    return apiClient.get<Evaluation[]>('/evaluations/my', queryParams)
  }

  /**
   * 3. 获取需要我评分的评估
   */
  async getEvaluationsToGive(): Promise<ApiResponse<Evaluation[]>> {
    return apiClient.get<Evaluation[]>('/evaluations/to-give')
  }

  /**
   * 4. 获取评估详情
   */
  async getEvaluationById(id: number): Promise<ApiResponse<Evaluation>> {
    return apiClient.get<Evaluation>(`/evaluations/${id}`)
  }

  /**
   * 5. 获取评分模板结构
   */
  async getEvaluationTemplate(assessmentId: number): Promise<ApiResponse<EvaluationTemplate>> {
    return apiClient.get<EvaluationTemplate>(`/evaluations/template/${assessmentId}`)
  }

  /**
   * 6. 获取用户专用评分模板
   */
  async getUserEvaluationTemplate(assessmentId: number, userId: number): Promise<ApiResponse<EvaluationTemplate>> {
    return apiClient.get<EvaluationTemplate>(`/evaluations/template/${assessmentId}/user/${userId}`)
  }

  /**
   * 7. 提交详细自评
   */
  async submitDetailedSelfEvaluation(data: SubmitDetailedSelfRequest): Promise<ApiResponse<DetailedEvaluation>> {
    return apiClient.post<DetailedEvaluation>('/evaluations/detailed-self', data)
  }

  /**
   * 8. 提交详细领导评分
   */
  async submitDetailedLeaderEvaluation(data: SubmitDetailedLeaderRequest): Promise<ApiResponse<DetailedEvaluation>> {
    return apiClient.post<DetailedEvaluation>('/evaluations/detailed-leader', data)
  }

  /**
   * 9. 创建评估草稿
   */
  async createEvaluationDraft(data: CreateEvaluationDraftRequest): Promise<ApiResponse<DetailedEvaluation>> {
    return apiClient.post<DetailedEvaluation>('/evaluations/draft', data)
  }

  /**
   * 10. 保存评估草稿
   */
  async updateEvaluationDraft(id: number, data: UpdateEvaluationDraftRequest): Promise<ApiResponse<DetailedEvaluation>> {
    return apiClient.put<DetailedEvaluation>(`/evaluations/draft/${id}`, data)
  }

  /**
   * 11. 获取我的评估任务列表
   */
  async getMyEvaluationTasks(assessment_id?: number): Promise<ApiResponse<EvaluationTask[]>> {
    const queryParams: Record<string, any> = {}
    if (assessment_id) queryParams.assessment_id = assessment_id

    return apiClient.get<EvaluationTask[]>('/evaluations/my-tasks', queryParams)
  }

  /**
   * 12. 获取考核评分进度
   */
  async getEvaluationProgress(assessmentId: number): Promise<ApiResponse<EvaluationProgress>> {
    return apiClient.get<EvaluationProgress>(`/evaluations/progress/${assessmentId}`)
  }

  /**
   * 13. 获取下属评分任务
   */
  async getSubordinateEvaluationTasks(assessmentId: number): Promise<ApiResponse<SubordinateTask[]>> {
    return apiClient.get<SubordinateTask[]>(`/evaluations/subordinates/${assessmentId}`)
  }

  /**
   * 14. 获取详细评分记录
   */
  async getDetailedEvaluation(id: number): Promise<ApiResponse<DetailedEvaluation>> {
    return apiClient.get<DetailedEvaluation>(`/evaluations/detailed/${id}`)
  }

  /**
   * 15. 获取自评与领导评分对比
   */
  async getEvaluationComparison(assessmentId: number, userId: number): Promise<ApiResponse<EvaluationComparison>> {
    return apiClient.get<EvaluationComparison>(`/evaluations/comparison/${assessmentId}/${userId}`)
  }

  /**
   * 16. 提交自评（兼容性）
   */
  async submitSelfEvaluation(data: SubmitSelfEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    return apiClient.post<Evaluation>('/evaluations/self', data)
  }

  /**
   * 17. 提交领导评分（兼容性）
   */
  async submitLeaderEvaluation(data: SubmitLeaderEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    return apiClient.post<Evaluation>('/evaluations/leader', data)
  }

  /**
   * 18. 更新评估
   */
  async updateEvaluation(id: number, data: UpdateEvaluationRequest): Promise<ApiResponse<Evaluation>> {
    return apiClient.put<Evaluation>(`/evaluations/${id}`, data)
  }

  /**
   * 19. 删除评估
   */
  async deleteEvaluation(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/evaluations/${id}`)
  }
}

// 评估管理服务实例
export const evaluationService = new EvaluationService()

// 工具函数
export const evaluationUtils = {
  /**
   * 获取评估状态显示文本
   */
  getStatusText(status: EvaluationStatus): string {
    const statusMap = {
      draft: '草稿',
      submitted: '已提交',
      completed: '已完成'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取评估状态样式类
   */
  getStatusStyle(status: EvaluationStatus): string {
    const styleMap = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      submitted: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200'
    }
    return styleMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  },

  /**
   * 获取任务状态显示文本
   */
  getTaskStatusText(status: TaskStatus): string {
    const statusMap = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      overdue: '已逾期'
    }
    return statusMap[status] || '未知'
  },

  /**
   * 获取任务状态样式类
   */
  getTaskStatusStyle(status: TaskStatus): string {
    const styleMap = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200'
    }
    return styleMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  },

  /**
   * 获取评估类型显示文本
   */
  getTypeText(type: EvaluationType): string {
    const typeMap = {
      self: '自评',
      leader: '领导评分'
    }
    return typeMap[type] || '未知'
  },

  /**
   * 计算详细评分总分
   */
  calculateDetailedScore(detailed_scores: DetailedScore[], template: EvaluationTemplate): number {
    let totalScore = 0
    let totalWeight = 0

    detailed_scores.forEach(categoryScore => {
      const category = template.categories.find(c => c.id === categoryScore.categoryId)
      if (category) {
        totalScore += categoryScore.categoryScore * (category.weight / 100)
        totalWeight += category.weight
      }
    })

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0
  },

  /**
   * 计算分类评分
   */
  calculateCategoryScore(items: DetailedScoreItem[], category: EvaluationCategory): number {
    let totalScore = 0
    let totalWeight = 0

    items.forEach(item => {
      const itemConfig = category.items.find(i => i.id === item.itemId)
      if (itemConfig) {
        totalScore += item.score * (itemConfig.weight / 100)
        totalWeight += itemConfig.weight
      }
    })

    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0
  },

  /**
   * 检查是否逾期
   */
  isOverdue(deadline: string): boolean {
    return new Date(deadline) < new Date()
  },

  /**
   * 计算剩余天数
   */
  getDaysRemaining(deadline: string): number {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  },

  /**
   * 格式化日期
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN')
  },

  /**
   * 获取评分等级
   */
  getScoreLevel(score: number): string {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '合格'
    return '待改进'
  },

  /**
   * 获取评分颜色
   */
  getScoreColor(score: number): string {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  },

  /**
   * 验证评分数据
   */
  validateDetailedScores(detailed_scores: DetailedScore[], template: EvaluationTemplate): string[] {
    const errors: string[] = []

    detailed_scores.forEach(categoryScore => {
      const category = template.categories.find(c => c.id === categoryScore.categoryId)
      if (!category) {
        errors.push(`未找到分类：${categoryScore.categoryId}`)
        return
      }

      if (categoryScore.categoryScore < 0 || categoryScore.categoryScore > 100) {
        errors.push(`分类"${category.name}"的分数必须在0-100之间`)
      }

      categoryScore.items.forEach(item => {
        const itemConfig = category.items.find(i => i.id === item.itemId)
        if (!itemConfig) {
          errors.push(`未找到评分项：${item.itemId}`)
          return
        }

        if (item.score < 0 || item.score > itemConfig.max_score) {
          errors.push(`评分项"${itemConfig.name}"的分数必须在0-${itemConfig.max_score}之间`)
        }
      })
    })

    return errors
  },

  /**
   * 检查考核状态
   */
  checkAssessmentStatus: (assessment: any) => {
    if (assessment.status === 'completed' || assessment.status === 'ended') {
      return {
        canEvaluate: false,
        message: '考核已结束，只能查看评估结果',
        showViewOnly: true
      }
    }
    return { canEvaluate: true }
  },

  /**
   * 处理评分提交错误
   */
  handleEvaluationError: (error: any, onAssessmentEnded?: () => void) => {
    if (error.message && error.message.includes('考核已结束')) {
      if (onAssessmentEnded) {
        onAssessmentEnded()
      }
      return {
        shouldShowDialog: true,
        title: '考核已结束',
        message: '此考核已结束，无法进行评分操作。页面将切换为查看模式。',
        type: 'warning' as const
      }
    }
    return {
      shouldShowDialog: false,
      message: error.message || '操作失败',
      type: 'error' as const
    }
  },

  /**
   * 生成评估任务ID
   */
  generateTaskId(type: EvaluationType, assessmentId: number, evaluateeId: number): string {
    return `${type}_${assessmentId}_${evaluateeId}`
  }
}