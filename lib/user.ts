/**
 * 用户管理相关类型定义和服务
 */

import { apiClient, ApiResponse } from './api'

// 用户信息接口
export interface User {
  id: number
  username: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  status: number
  join_date?: string
  position?: string
  department?: Department
  leader?: Leader
  roles: Role[]
  created_at: string
  updated_at: string
}

// 部门信息接口（精简版）
export interface Department {
  id: number
  name: string
  description?: string
  parent_id?: number
  sort_order: number
  status: number
  employeeCount: number
  created_at: string
  updated_at: string
}

// 直属领导接口
export interface Leader {
  id: number
  username: string
  name: string
  position?: string
}

// 角色接口
export interface Role {
  id: number
  code: string
  name: string
  description?: string
  permissions?: string[]
  status: number
  created_at: string
  updated_at: string
}

// 创建用户请求接口
export interface CreateUserDto {
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  position?: string
  department_id?: number
  leader_id?: number
  role_ids: number[]
  join_date?: string
}

// 更新用户请求接口
export interface UpdateUserDto {
  name?: string
  email?: string
  phone?: string
  position?: string
  department_id?: number
  leader_id?: number
  role_ids?: number[]
  join_date?: string
}

// 用户列表查询参数
export interface UserListQuery {
  page?: number
  limit?: number
  department_id?: number
  role?: string
  search?: string
}

// 用户列表响应接口
export interface UserListResponse {
  items: User[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 评估历史记录接口
export interface AssessmentHistory {
  assessment_id: number
  assessment_title: string
  period: string
  status: 'completed' | 'in_progress' | 'pending'
  start_date: string
  end_date: string
  self_evaluation: {
    completed: boolean
    score: number | null
    submitted_at: string | null
    last_updated?: string | null
  }
  leader_evaluation: {
    completed: boolean
    score: number | null
    submitted_at: string | null
    last_updated?: string | null
    leader_id?: number
    leader_name?: string
  }
  boss_evaluation?: {
    completed: boolean
    score?: number
    boss_id?: number
    boss_name?: string
    submitted_at?: string
    last_updated?: string
    required?: boolean
  }
  current_employee_score: number | null
  final_score: number | null
  final_level: string | null
  weight_config?: any
}
export interface ResetPasswordDto {
  password: string
}

// 领导列表响应接口
export interface LeaderListResponse {
  data: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 用户服务类
class UserService {
  // 获取用户列表
  async getUsers(query?: UserListQuery): Promise<ApiResponse<UserListResponse>> {
    try {
      return await apiClient.get<UserListResponse>('/users', query)
    } catch (error) {
      console.error('Get users failed:', error)
      throw error
    }
  }

  // 获取用户详情
  async getUser(id: number): Promise<ApiResponse<User>> {
    try {
      return await apiClient.get<User>(`/users/${id}`)
    } catch (error) {
      console.error('Get user failed:', error)
      throw error
    }
  }

  // 创建用户
  async createUser(userData: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      return await apiClient.post<User>('/users', userData)
    } catch (error) {
      console.error('Create user failed:', error)
      throw error
    }
  }

  // 更新用户
  async updateUser(id: number, userData: UpdateUserDto): Promise<ApiResponse<User>> {
    try {
      return await apiClient.patch<User>(`/users/${id}`, userData)
    } catch (error) {
      console.error('Update user failed:', error)
      throw error
    }
  }

  // 删除用户
  async deleteUser(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.delete<{ message: string }>(`/users/${id}`)
    } catch (error) {
      console.error('Delete user failed:', error)
      throw error
    }
  }

  // 重置密码
  async resetPassword(id: number, passwordData: ResetPasswordDto): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.post<{ message: string }>(`/users/${id}/reset-password`, passwordData)
    } catch (error) {
      console.error('Reset password failed:', error)
      throw error
    }
  }

  // 切换用户状态
  async toggleUserStatus(id: number): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiClient.post<{ message: string }>(`/users/${id}/toggle-status`)
    } catch (error) {
      console.error('Toggle user status failed:', error)
      throw error
    }
  }

  // 获取领导列表
  async getLeaders(): Promise<ApiResponse<LeaderListResponse>> {
    try {
      return await apiClient.get<LeaderListResponse>('/users/leaders/list')
    } catch (error) {
      console.error('Get leaders failed:', error)
      throw error
    }
  }

  // 获取用户考核历史记录
  async getAssessmentsHistory(params?: { completion_stage?: 'self_only' | 'self_leader' | 'all_completed', year?: number }): Promise<ApiResponse<AssessmentHistory[]>> {
    try {
      return await apiClient.get<AssessmentHistory[]>('/users/me/assessments-history', params)
    } catch (error) {
      console.error('Get assessments history failed:', error)
      throw error
    }
  }
}

// 导出用户服务实例
export const userService = new UserService()

// 导出用户相关的工具函数
export const userUtils = {
  // 格式化用户状态
  formatUserStatus(status: number): string {
    return status === 1 ? '启用' : '禁用'
  },

  // 获取用户状态颜色
  getUserStatusColor(status: number): string {
    return status === 1 ? 'text-green-600' : 'text-red-600'
  },

  // 格式化用户创建时间
  formatUserDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
  },

  // 格式化入职时间
  formatJoinDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
  },

  // 获取用户主要角色
  getPrimaryRole(roles: Role[]): Role | null {
    if (!roles || roles.length === 0) return null
    return roles[0]
  },

  // 获取用户角色名称列表
  getRoleNames(roles: Role[]): string[] {
    return roles.map(role => role.name)
  },

  // 根据角色代码获取角色Badge样式
  getRoleBadgeStyle(roleCode: string): string {
    switch (roleCode) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'boss':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'leader':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
}