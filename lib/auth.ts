/**
 * 认证相关类型定义和服务
 */

import { apiClient, ApiResponse } from './api'

// 用户信息接口
export interface User {
  id: number
  username: string
  name: string
  email: string | null
  phone?: string | null
  avatar: string | null
  join_date?: string
  position?: string
  roles: string[]
  department: {
    id: number
    name: string
  } | null
  leader: {
    id: number
    name: string
  } | null
  permissions: string[]
}

// 登录请求接口
export interface LoginDto {
  username: string
  password: string
}

// 登录响应接口
export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: User
}

// 刷新令牌请求接口
export interface RefreshTokenDto {
  refresh_token: string
}

// 修改密码请求接口
export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
}

// 认证服务类
class AuthService {
  // 用户登录
  async login(loginData: LoginDto): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', loginData)
      
      if (response.data) {
        // 存储认证信息到本地存储
        this.setAuthData(response.data)
      }
      
      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  // 刷新访问令牌
  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    try {
      const refreshToken = this.getRefreshToken()
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post<LoginResponse>('/auth/refresh', {
        refresh_token: refreshToken
      })

      if (response.data) {
        // 更新存储的认证信息
        this.setAuthData(response.data)
      }

      return response
    } catch (error) {
      console.error('Token refresh failed:', error)
      // 刷新失败时清除本地存储
      this.clearAuthData()
      throw error
    }
  }

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<void>('/auth/logout')
      return response
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    } finally {
      // 无论成功失败都清除本地存储
      this.clearAuthData()
    }
  }

  // 获取当前用户信息
  async getProfile(): Promise<ApiResponse<User>> {
    try {
      return await apiClient.get<User>('/auth/profile')
    } catch (error) {
      console.error('Get profile failed:', error)
      throw error
    }
  }

  // 修改密码
  async changePassword(passwordData: ChangePasswordDto): Promise<ApiResponse<void>> {
    try {
      return await apiClient.post<void>('/auth/password', passwordData)
    } catch (error) {
      console.error('Change password failed:', error)
      throw error
    }
  }

  // 检查是否已登录
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('access_token')
    const userInfo = localStorage.getItem('userInfo')
    
    return !!(token && userInfo)
  }

  // 获取当前用户信息（从本地存储）
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null
    
    try {
      const userInfo = localStorage.getItem('userInfo')
      if (!userInfo || userInfo === 'undefined') {
        return null
      }
      return JSON.parse(userInfo)
    } catch (error) {
      console.error('Failed to parse user info:', error)
      // 清除无效数据
      localStorage.removeItem('userInfo')
      return null
    }
  }

  // 获取访问令牌
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  }

  // 获取刷新令牌
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  }

  // 设置认证数据到本地存储
  private setAuthData(authData: LoginResponse): void {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('access_token', authData.access_token)
    localStorage.setItem('refresh_token', authData.refresh_token)
    localStorage.setItem('userInfo', JSON.stringify(authData.user))
    
    // 设置token过期时间
    const expiresAt = Date.now() + (authData.expires_in * 1000)
    localStorage.setItem('token_expires_at', expiresAt.toString())
  }

  // 清除认证数据
  private clearAuthData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token_expires_at')
  }

  // 检查token是否即将过期
  isTokenExpiringSoon(): boolean {
    if (typeof window === 'undefined') return false
    
    const expiresAt = localStorage.getItem('token_expires_at')
    if (!expiresAt) return false
    
    const expiresAtMs = parseInt(expiresAt)
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000 // 5分钟
    
    return (expiresAtMs - now) < fiveMinutes
  }

  // 自动刷新token（如果即将过期）
  async autoRefreshToken(): Promise<void> {
    if (this.isTokenExpiringSoon()) {
      try {
        await this.refreshToken()
      } catch (error) {
        console.error('Auto refresh token failed:', error)
        // 自动刷新失败时抛出错误，让调用者处理
        throw error
      }
    }
  }

  // 获取用户角色
  getUserRoles(): string[] {
    const user = this.getCurrentUser()
    return user?.roles || []
  }

  // 检查用户是否有指定角色
  hasRole(role: string): boolean {
    const roles = this.getUserRoles()
    return roles.includes(role)
  }

  // 检查用户是否有指定权限
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser()
    const permissions = user?.permissions || []
    
    // 如果有通配符权限，表示拥有所有权限
    if (permissions.includes('*')) {
      return true
    }
    
    return permissions.includes(permission)
  }

  // 根据用户角色获取默认路由
  getDefaultRoute(): string {
    const user = this.getCurrentUser()
    if (!user) return '/'
    
    const roles = user.roles
    
    if (roles.includes('admin')) return '/admin'
    if (roles.includes('boss')) return '/boss'
    if (roles.includes('leader')) return '/lead'
    if (roles.includes('employee')) return '/employee'
    
    return '/'
  }
}

// 导出认证服务实例
export const authService = new AuthService()

// 导出认证相关的工具函数
export const authUtils = {
  // 格式化用户显示名称
  formatUserDisplayName(user: User): string {
    return user.name || user.username
  },

  // 格式化用户角色显示
  formatUserRoles(roles: string[]): string {
    const roleMap: Record<string, string> = {
      admin: '系统管理员',
      boss: '公司老板',
      lead: '部门领导',
      employee: '员工'
    }
    
    return roles.map(role => roleMap[role] || role).join('、')
  },

  // 格式化部门信息
  formatDepartmentInfo(user: User): string {
    if (!user.department) return '无部门'
    return user.department.name
  },

  // 格式化领导信息
  formatLeaderInfo(user: User): string {
    if (!user.leader) return '无直属领导'
    return user.leader.name
  }
}