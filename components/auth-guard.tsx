"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  fallbackPath?: string
}

// 认证守卫组件
export function AuthGuard({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallbackPath = '/'
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // 如果未认证，跳转到登录页
      if (!isAuthenticated) {
        router.push(fallbackPath)
        return
      }

      // 只有在用户已认证且有用户信息时才检查权限
      if (isAuthenticated && user) {
        // 检查角色权限
        if (requiredRoles.length > 0) {
          const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role))
          if (!hasRequiredRole) {
            // 没有所需角色，跳转到无权限页面
            router.push('/unauthorized')
            return
          }
        }

        // 检查权限
        if (requiredPermissions.length > 0) {
          const hasRequiredPermission = requiredPermissions.some(permission => 
            user.permissions.includes('*') || user.permissions.includes(permission)
          )
          if (!hasRequiredPermission) {
            // 没有所需权限，跳转到无权限页面
            router.push('/unauthorized')
            return
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router, requiredRoles, requiredPermissions, fallbackPath])

  // 加载中显示加载器
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">正在验证用户身份...</p>
        </div>
      </div>
    )
  }

  // 未认证时不渲染内容
  if (!isAuthenticated) {
    return null
  }

  // 检查权限
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role))
    if (!hasRequiredRole) {
      return null
    }
  }

  if (requiredPermissions.length > 0 && user) {
    const hasRequiredPermission = requiredPermissions.some(permission => 
      user.permissions.includes('*') || user.permissions.includes(permission)
    )
    if (!hasRequiredPermission) {
      return null
    }
  }

  return <>{children}</>
}

// 角色守卫组件
export function RoleGuard({ 
  children, 
  roles, 
  fallbackPath = '/unauthorized' 
}: { 
  children: React.ReactNode
  roles: string[]
  fallbackPath?: string
}) {
  return (
    <AuthGuard requiredRoles={roles} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  )
}

// 权限守卫组件
export function PermissionGuard({ 
  children, 
  permissions, 
  fallbackPath = '/unauthorized' 
}: { 
  children: React.ReactNode
  permissions: string[]
  fallbackPath?: string
}) {
  return (
    <AuthGuard requiredPermissions={permissions} fallbackPath={fallbackPath}>
      {children}
    </AuthGuard>
  )
}

// 管理员守卫
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={['admin']}>
      {children}
    </RoleGuard>
  )
}

// 领导守卫（包括管理员和老板）
export function LeaderGuard({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={['admin', 'boss', 'lead']}>
      {children}
    </RoleGuard>
  )
}