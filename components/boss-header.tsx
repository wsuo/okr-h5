"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, Crown, Home, UserCheck, Bell, BarChart3 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { evaluationService } from "@/lib/evaluation"

interface BossHeaderProps {
  userInfo?: {
    name: string
    role: string
  }
  pendingTasksCount?: number
}

export default function BossHeader({ userInfo, pendingTasksCount = 0 }: BossHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [actualTasksCount, setActualTasksCount] = useState(pendingTasksCount)
  const [loading, setLoading] = useState(false)

  const currentUser = userInfo || user

  // 加载待办任务数量
  useEffect(() => {
    if (pendingTasksCount === 0) {
      loadTasks()
    } else {
      setActualTasksCount(pendingTasksCount)
    }
  }, [pendingTasksCount])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await evaluationService.getBossTasks()
      if (response.code === 200 && response.data) {
        const pendingTasks = response.data.filter(task => task.status === 'pending')
        setActualTasksCount(pendingTasks.length)
      }
    } catch (error) {
      console.error('加载待办任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error('Logout failed:', error)
      router.push("/")
    }
  }

  // 导航项配置
  const navigationItems = [
    {
      label: "工作台",
      icon: Home,
      path: "/boss",
      isActive: pathname === "/boss"
    },
    {
      label: "评分中心",
      icon: UserCheck,
      path: "/boss/evaluation",
      isActive: pathname.startsWith("/boss/evaluation"),
      badge: actualTasksCount > 0 ? actualTasksCount : undefined
    },
    {
      label: "报表分析",
      icon: BarChart3,
      path: "/boss/reports",
      isActive: pathname.startsWith("/boss/reports")
    }
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">OKR绩效考核系统</h1>
              <p className="text-xs text-gray-500">公司老板</p>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.path}
                  variant={item.isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className="flex items-center gap-2 relative"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-1 h-5 text-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* 通知铃铛 */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={() => router.push('/boss/evaluation')}
          >
            <Bell className="w-4 h-4" />
            {actualTasksCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {actualTasksCount > 9 ? '9+' : actualTasksCount}
              </Badge>
            )}
          </Button>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">公司老板</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-yellow-100 text-yellow-600">
              {currentUser?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 移动端导航 */}
      <div className="md:hidden border-t border-gray-200">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.path}
                  variant={item.isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                  className="flex items-center gap-2 whitespace-nowrap relative"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="destructive" className="ml-1 h-4 text-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
