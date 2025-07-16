import { apiClient } from './api'

// 团队成员相关类型定义
export interface TeamMemberAssessment {
  assessment_id: number
  assessment_title: string
  status: 'active' | 'completed' | 'draft'
  start_date: string
  end_date: string
  period: string
}

export interface TeamMemberEvaluationStatus {
  self_completed: boolean
  leader_completed: boolean
  self_completed_at: string | null
  leader_completed_at: string | null
  final_score: number | null
  self_score: number | null
  leader_score: number | null
}

export interface TeamMember {
  user_id: number
  user_name: string
  email: string
  department: string
  position: string
  has_active_assessment: boolean
  is_historical: boolean
  current_assessment: TeamMemberAssessment
  evaluation_status: TeamMemberEvaluationStatus
  last_updated: string
}

export interface TeamMembersResponse {
  members: TeamMember[]
  total_members: number
  active_assessments_count: number
  self_completed_count: number
  leader_completed_count: number
}

// 员工评估统计类型
export interface EmployeeEvaluationStats {
  user_id: number
  user_name: string
  total_assessments: number
  completed_assessments: number
  average_score: number
  latest_score: number
  score_trend: 'up' | 'down' | 'stable'
  score_history: Array<{
    assessment_id: number
    assessment_title: string
    final_score: number
    completed_at: string
  }>
}

// 员工考核历史
export interface EmployeeAssessmentHistory {
  assessment_id: number
  assessment_title: string
  period: string
  status: 'completed' | 'in_progress' | 'pending'
  start_date: string
  end_date: string
  self_evaluation: {
    completed: boolean
    score: number | null
    completed_at: string | null
  }
  leader_evaluation: {
    completed: boolean
    score: number | null
    completed_at: string | null
  }
  final_score: number | null
  final_level: string | null
}

// 团队服务类
class TeamService {
  /**
   * 获取团队成员列表
   */
  async getTeamMembers() {
    return apiClient.get<TeamMembersResponse>('/users/team-members')
  }

  /**
   * 获取员工评估统计信息
   */
  async getEmployeeStats(userId: number) {
    return apiClient.get<EmployeeEvaluationStats>(`/users/${userId}/evaluation-stats`)
  }

  /**
   * 获取员工考核历史
   */
  async getEmployeeAssessmentHistory(userId: number) {
    return apiClient.get<EmployeeAssessmentHistory[]>(`/users/${userId}/assessments-history`)
  }

  /**
   * 获取员工在特定考核中的完整评估信息
   */
  async getEmployeeAssessmentDetail(assessmentId: number, userId: number) {
    return apiClient.get(`/evaluations/assessment/${assessmentId}/user/${userId}/complete`)
  }
}

// 工具函数
export const teamUtils = {
  /**
   * 格式化评估状态
   */
  formatEvaluationStatus(member: TeamMember): string {
    const { evaluation_status } = member
    
    if (!evaluation_status) {
      return '未知'
    }
    
    if (evaluation_status.self_completed && evaluation_status.leader_completed) {
      return '已完成'
    } else if (evaluation_status.self_completed) {
      return '待领导评分'
    } else if (evaluation_status.leader_completed) {
      return '已评分'
    } else {
      return '待开始'
    }
  },

  /**
   * 获取评估状态的颜色类名
   */
  getStatusColor(member: TeamMember): string {
    const { evaluation_status } = member
    
    if (!evaluation_status) {
      return 'text-gray-600 bg-gray-100 border-gray-200'
    }
    
    if (evaluation_status.self_completed && evaluation_status.leader_completed) {
      return 'text-green-600 bg-green-100 border-green-200'
    } else if (evaluation_status.self_completed) {
      return 'text-orange-600 bg-orange-100 border-orange-200'
    } else if (evaluation_status.leader_completed) {
      return 'text-blue-600 bg-blue-100 border-blue-200'
    } else {
      return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  },

  /**
   * 计算得分等级
   */
  getScoreLevel(score: number | null): string {
    if (!score) return '--'
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 70) return '合格'
    return '待改进'
  },

  /**
   * 获取得分颜色
   */
  getScoreColor(score: number | null): string {
    if (!score) return 'text-gray-400'
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  },

  /**
   * 格式化日期
   */
  formatDate(dateString: string): string {
    if (!dateString) return '--'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch {
      return '--'
    }
  },

  /**
   * 格式化日期时间
   */
  formatDateTime(dateString: string): string {
    if (!dateString) return '--'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '--'
    }
  },

  /**
   * 判断考核是否过期
   */
  isAssessmentOverdue(assessment: TeamMemberAssessment): boolean {
    if (assessment.status === 'completed') return false
    const endDate = new Date(assessment.end_date)
    const now = new Date()
    return now > endDate
  },

  /**
   * 计算剩余天数
   */
  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }
}

// 导出服务实例
export const teamService = new TeamService()