"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { authService, User } from '@/lib/auth'
import { sentryOKR } from '@/lib/sentry'

// 认证状态接口
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 认证动作类型
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' }

// 认证Context接口
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUserProfile: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  clearError: () => void
}

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// 状态reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    default:
      return state
  }
}

// 创建Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// AuthProvider组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // 检查本地存储的认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // 检查是否有存储的认证信息
        if (authService.isAuthenticated()) {
          const user = authService.getCurrentUser()
          if (user) {
            // 尝试获取最新的用户信息
            try {
              const response = await authService.getProfile()
              if (response.data) {
                dispatch({ type: 'SET_USER', payload: response.data })
              } else {
                dispatch({ type: 'SET_USER', payload: user })
              }
            } catch (error) {
              // 如果获取用户信息失败，使用本地存储的信息
              console.warn('Failed to fetch fresh user profile, using cached data')
              dispatch({ type: 'SET_USER', payload: user })
            }
          } else {
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [])

  // 设置自动刷新token的定时器
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await authService.autoRefreshToken()
        } catch (error) {
          console.error('Auto refresh token failed:', error)
          // 静默失败，不要自动登出用户，让用户在下次操作时处理
          // 这样可以避免在用户正在输入时突然清空表单
        }
      }, 4 * 60 * 1000) // 每4分钟检查一次

      return () => clearInterval(interval)
    }
  }, [state.isAuthenticated])

  // 登录函数
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'CLEAR_ERROR' })

      sentryOKR.addBreadcrumb('login', `用户尝试登录: ${username}`)

      const response = await authService.login({ username, password })
      
      if (response.data && response.data.user) {
        dispatch({ type: 'SET_USER', payload: response.data.user })
        
        // 设置Sentry用户上下文
        sentryOKR.setUserContext({
          id: response.data.user.id,
          username: response.data.user.username,
          name: response.data.user.name,
          role: response.data.user.role as any,
          department: response.data.user.department
        })

        sentryOKR.addBreadcrumb('login', `用户登录成功: ${username}`, {
          userId: response.data.user.id,
          role: response.data.user.role
        })

        return true
      } else {
        const errorMsg = '登录失败：未收到用户信息'
        dispatch({ type: 'SET_ERROR', payload: errorMsg })
        
        sentryOKR.captureBusinessError(
          new Error(errorMsg), 
          'login',
          { userId: username }
        )
        
        return false
      }
    } catch (error: any) {
      const errorMessage = error.message || '登录失败，请稍后重试'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      
      // 记录登录错误到Sentry
      sentryOKR.captureBusinessError(
        error,
        'login',
        { userId: username }
      )
      
      return false
    }
  }

  // 登出函数
  const logout = async (): Promise<void> => {
    try {
      const currentUser = state.user
      
      sentryOKR.addBreadcrumb('logout', `用户登出: ${currentUser?.username || 'unknown'}`)
      
      await authService.logout()
      
      sentryOKR.addBreadcrumb('logout', `用户登出成功: ${currentUser?.username || 'unknown'}`)
    } catch (error) {
      console.error('Logout failed:', error)
      sentryOKR.captureBusinessError(
        error as Error,
        'logout',
        { userId: state.user?.id }
      )
    } finally {
      // 清除Sentry用户上下文
      sentryOKR.clearUserContext()
      dispatch({ type: 'LOGOUT' })
    }
  }

  // 刷新用户信息
  const refreshUserProfile = async (): Promise<void> => {
    try {
      const response = await authService.getProfile()
      if (response.data) {
        dispatch({ type: 'SET_USER', payload: response.data })
      }
    } catch (error) {
      console.error('Refresh user profile failed:', error)
      throw error
    }
  }

  // 修改密码
  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' })
      await authService.changePassword({ oldPassword, newPassword })
      return true
    } catch (error: any) {
      const errorMessage = error.message || '修改密码失败'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return false
    }
  }

  // 清除错误
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUserProfile,
    changePassword,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 使用Context的Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// 权限检查Hook
export function usePermission() {
  const { user } = useAuth()

  return {
    hasRole: (role: string) => authService.hasRole(role),
    hasPermission: (permission: string) => authService.hasPermission(permission),
    hasAnyRole: (roles: string[]) => roles.some(role => authService.hasRole(role)),
    hasAnyPermission: (permissions: string[]) => 
      permissions.some(permission => authService.hasPermission(permission)),
    isAdmin: () => authService.hasRole('admin'),
    isBoss: () => authService.hasRole('boss'),
    isLead: () => authService.hasRole('leader'),
    isEmployee: () => authService.hasRole('employee'),
    
    // Boss评分权限检查
    canDoBossEvaluation: (targetUser: any) => {
      if (!user || !targetUser) return false
      // 检查当前用户是否是目标用户的上级（即目标用户直属领导的领导）
      return user.id === targetUser?.leader?.leader?.id
    },
    
    // 检查是否可以查看Boss评分结果
    canViewBossEvaluation: (targetUser: any) => {
      if (!user) return false
      // 管理员和Boss角色可以查看所有人的Boss评分
      if (authService.hasRole('admin') || authService.hasRole('boss')) return true
      // 目标用户本人可以查看自己的Boss评分
      if (user.id === targetUser?.id) return true
      // 直属领导可以查看下属的Boss评分
      if (user.id === targetUser?.leader?.id) return true
      // Boss可以查看自己评分过的用户
      if (user.id === targetUser?.leader?.leader?.id) return true
      return false
    }
  }
}

// Boss评分权限检查Hook
export function useBossEvaluationPermission() {
  const { user } = useAuth()
  const permission = usePermission()

  return {
    // 检查是否可以对指定用户进行Boss评分
    canEvaluate: (targetUserId: number, targetUser?: any) => {
      return permission.canDoBossEvaluation(targetUser)
    },
    
    // 检查是否可以查看Boss评分任务列表
    canViewTasks: () => {
      // 只有Boss角色或管理员可以看到Boss评分任务
      return authService.hasRole('boss') || authService.hasRole('admin')
    },
    
    // 检查是否可以查看Boss评分结果
    canViewResults: (targetUser: any) => {
      return permission.canViewBossEvaluation(targetUser)
    },
    
    // 获取当前用户可以进行Boss评分的下属列表
    getEvaluableSubordinates: (allUsers: any[]) => {
      if (!user || !allUsers) return []
      
      // 找到当前用户作为leader.leader的所有用户
      return allUsers.filter(targetUser => 
        targetUser?.leader?.leader?.id === user.id
      )
    }
  }
}