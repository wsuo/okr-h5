/**
 * 角色管理相关类型定义和服务
 */

import { apiClient, ApiResponse } from './api'

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

// 角色列表响应接口
export interface RoleListResponse {
  data: Role[]
}

// 角色服务类
class RoleService {
  // 获取角色列表
  async getRoles(): Promise<ApiResponse<RoleListResponse>> {
    try {
      return await apiClient.get<RoleListResponse>('/roles')
    } catch (error) {
      console.error('Get roles failed:', error)
      throw error
    }
  }
}

// 导出角色服务实例
export const roleService = new RoleService()

// 导出角色相关的工具函数
export const roleUtils = {
  // 格式化角色状态
  formatRoleStatus(status: number): string {
    return status === 1 ? '启用' : '禁用'
  },

  // 获取角色状态颜色
  getRoleStatusColor(status: number): string {
    return status === 1 ? 'text-green-600' : 'text-red-600'
  },

  // 格式化角色创建时间
  formatRoleDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN')
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
  },

  // 根据角色代码获取中文名称
  getRoleDisplayName(roleCode: string): string {
    switch (roleCode) {
      case 'admin':
        return '管理员'
      case 'boss':
        return '老板'
      case 'leader':
        return '领导'
      case 'employee':
        return '员工'
      default:
        return '未知'
    }
  }
}