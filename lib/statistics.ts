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
  }
  department_stats: DepartmentStat[]
  recent_assessments: RecentAssessment[]
  score_distribution: ScoreDistribution[]
}

// 部门统计数据接口
export interface DepartmentStat {
  id: string
  name: string
  user_count: number
  participant_count: number
  avg_self_score: number
  avg_leader_score: number
  self_completion_rate: number
  leader_completion_rate: number
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

// OKR统计数据接口
export interface OkrStatistics {
  total_okrs: number
  completed_okrs: number
  average_progress: number
  okr_list: OkrStat[]
}

export interface OkrStat {
  id: number
  objective: string
  user_name: string
  department: string
  progress: number
  self_rating: number
  status: string
  created_at: string
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
   * 获取OKR统计数据
   */
  async getOkrStatistics(params?: StatisticsQueryParams): Promise<ApiResponse<OkrStatistics>> {
    return apiClient.get<OkrStatistics>('/statistics/okrs', params)
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
