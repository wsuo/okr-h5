/**
 * 统计分析相关类型定义和服务
 */

import { apiClient, ApiResponse } from './api'

// 仪表板统计数据接口
export interface DashboardStatistics {
  overview: {
    total_users: number
    active_assessments: number
    completed_assessments: number
    total_evaluations: number
    completion_rate: number
    average_score: number
    self_average: number
    leader_average: number
    boss_average: number  // 新增Boss评分平均分
  }
  department_stats: DepartmentStat[]
  recent_assessments: RecentAssessment[]
  score_distribution: ScoreDistribution[] | ScoreDistributionNew  // 支持两种格式
}

// 部门统计数据接口
export interface DepartmentStat {
  id: string
  name: string
  user_count: number
  participant_count: number
  avg_self_score: number
  avg_leader_score: number
  avg_boss_score: number  // 新增Boss评分平均分
  self_completion_rate: number
  leader_completion_rate: number
  boss_completion_rate: number  // 新增Boss评分完成率
}

// 最近考核数据接口
export interface RecentAssessment {
  id: number
  title: string
  period: string
  status: string
  participant_count: number
  completion_rate: number
  created_at: string
}

// 分数分布数据接口
export interface ScoreDistribution {
  range: string
  count: number
  percentage: number
}

// 新的分数分布格式
export interface ScoreDistributionNew {
  excellent: number
  good: number
  average: number
  poor: number
}

// 考核统计数据接口
export interface AssessmentStatistics {
  total_assessments: number
  active_assessments: number
  completed_assessments: number
  average_completion_rate: number
  assessment_list: AssessmentStat[]
}

export interface AssessmentStat {
  id: number
  title: string
  period: string
  status: string
  participant_count: number
  self_completion_rate: number
  leader_completion_rate: number
  boss_completion_rate: number  // 新增Boss评分完成率
  overall_completion_rate: number
  average_score: number
  created_at: string
}

// 用户统计数据接口
export interface UserStatistics {
  total_users: number
  active_users: number
  user_list: UserStat[]
}

export interface UserStat {
  id: number
  name: string
  department: string
  position: string
  total_assessments: number
  completed_assessments: number
  average_score: number
  latest_score: number
  score_trend: 'up' | 'down' | 'stable'
  last_assessment_date: string
}

// 绩效列表数据接口
export interface PerformanceListItem {
  assessment: {
    id: string
    title: string
    period: string
    start_date: string
    end_date: string
    status: string
  }
  employee: {
    id: string
    name: string
    username: string
    position: string
    department: string
  }
  scores: {
    self_score: number
    leader_score: number
    boss_score?: number  // 新增Boss评分
    final_score: number
  }
  completion: {
    self_completed: boolean
    leader_completed: boolean
    boss_completed?: boolean  // 新增Boss评分完成状态
    self_submitted_at: string | null
    leader_submitted_at: string | null
    boss_submitted_at?: string | null  // 新增Boss评分提交时间
  }
}

// 用户统计详细数据接口
export interface UserStatisticsDetail {
  user_id: string
  user_username: string
  user_name: string
  department_name: string
  total_assessments: string
  self_completed: string
  leader_completed: string
  avg_self_score: string
  avg_leader_score: string
}

// 评估统计数据接口
export interface EvaluationStatistics {
  total_evaluations: number
  self_evaluations: number
  leader_evaluations: number
  completion_rate: number
  evaluation_trends: EvaluationTrend[]
}

export interface EvaluationTrend {
  date: string
  self_count: number
  leader_count: number
  total_count: number
}

// 绩效趋势数据接口
export interface PerformanceTrends {
  monthly_trends: MonthlyTrend[]
  department_trends: DepartmentTrend[]
  score_trends: ScoreTrend[]
}

export interface MonthlyTrend {
  month: string
  average_score: number
  self_average: number
  leader_average: number
  completion_rate: number
}

export interface DepartmentTrend {
  department: string
  trend_data: Array<{
    month: string
    average_score: number
  }>
}

export interface ScoreTrend {
  date: string
  score: number
  type: 'self' | 'leader' | 'final'
}

// 统计查询参数接口
export interface StatisticsQueryParams {
  start_date?: string
  end_date?: string
  department_id?: number
  user_id?: number
  assessment_id?: number
  time_dimension?: string
  group_by?: string
}

// 统计服务类
export class StatisticsService {
  /**
   * 获取仪表板统计数据
   */
  async getDashboardStatistics(): Promise<ApiResponse<DashboardStatistics>> {
    return apiClient.get<DashboardStatistics>('/statistics/dashboard')
  }

  /**
   * 获取考核统计数据
   */
  async getAssessmentStatistics(params?: StatisticsQueryParams): Promise<ApiResponse<AssessmentStatistics>> {
    return apiClient.get<AssessmentStatistics>('/statistics/assessments', params)
  }

  /**
   * 获取用户统计数据
   */
  async getUserStatistics(params?: StatisticsQueryParams): Promise<ApiResponse<UserStatistics>> {
    return apiClient.get<UserStatistics>('/statistics/users', params)
  }

  /**
   * 获取部门统计数据
   */
  async getDepartmentStatistics(): Promise<ApiResponse<DepartmentStat[]>> {
    return apiClient.get<DepartmentStat[]>('/statistics/departments')
  }

  /**
   * 获取绩效列表数据
   */
  async getPerformanceList(params?: StatisticsQueryParams): Promise<ApiResponse<PerformanceListItem[]>> {
    return apiClient.get<PerformanceListItem[]>('/statistics/performance-list', params)
  }

  /**
   * 获取用户统计详细数据
   */
  async getUserStatisticsDetail(params?: StatisticsQueryParams): Promise<ApiResponse<UserStatisticsDetail[]>> {
    return apiClient.get<UserStatisticsDetail[]>('/statistics/users', params)
  }

  /**
   * 获取评估统计数据
   */
  async getEvaluationStatistics(params?: StatisticsQueryParams): Promise<ApiResponse<EvaluationStatistics>> {
    return apiClient.get<EvaluationStatistics>('/statistics/evaluations', params)
  }

  /**
   * 获取绩效趋势数据
   */
  async getPerformanceTrends(params?: StatisticsQueryParams): Promise<ApiResponse<PerformanceTrends>> {
    return apiClient.get<PerformanceTrends>('/statistics/trends', params)
  }
}

// 导出统计服务实例
export const statisticsService = new StatisticsService()
