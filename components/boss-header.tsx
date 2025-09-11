"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Crown, Home, UserCheck, Bell, BarChart3, Settings, Key } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { evaluationService, evaluationUtils } from "@/lib/evaluation"
import ChangePasswordDialog from "@/components/change-password-dialog"

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
  const [showChangePassword, setShowChangePassword] = useState(false)

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
        const tasksWithOverdueFlag = response.data.map((t: any) => ({
          ...t,
          is_overdue: t?.deadline ? evaluationUtils.isOverdue(t.deadline) : false,
        }))
        const pendingTasks = tasksWithOverdueFlag.filter(task => task.status === 'pending' && !task.is_overdue)
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
    <>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* 主要内容区 */}
      <div className="container mx-auto px-2 sm:px-4">
        {/* 第一行：Logo + 用户信息 */}
        <div className="h-12 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">OKR绩效考核系统</h1>
              <p className="text-xs text-gray-500 hidden xs:block">公司老板</p>
            </div>
            
            {/* 桌面端导航 - 在极小屏幕时隐藏 */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.path}
                    variant={item.isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.path)}
                    className="flex items-center gap-2 relative whitespace-nowrap"
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

          <div className="flex items-center gap-1 sm:gap-3">
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

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">公司老板</p>
            </div>
            
            {/* 用户菜单下拉 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-yellow-100 text-yellow-600 text-sm">
                      {currentUser?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                  <Key className="mr-2 h-4 w-4" />
                  修改密码
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 第二行：导航菜单 - 在桌面端大屏幕时隐藏，小屏幕时显示 */}
        <div className="lg:hidden border-t border-gray-200">
          <div className="py-2">
            {/* 极小屏幕（iPhone4等）使用多行布局 */}
            <div className="grid grid-cols-1 xs:flex xs:flex-wrap gap-1 xs:gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.path}
                    variant={item.isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => router.push(item.path)}
                    className="flex items-center justify-center xs:justify-start gap-2 relative w-full xs:w-auto xs:flex-1"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">{item.label}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-1 h-4 text-xs">
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </Button>
                )
              })}
              
              {/* 在极小屏幕下显示登出按钮 */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="flex xs:hidden items-center justify-center gap-2 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    {/* 修改密码对话框 */}
    <ChangePasswordDialog 
      open={showChangePassword} 
      onOpenChange={setShowChangePassword} 
    />
  </>
  )
}
