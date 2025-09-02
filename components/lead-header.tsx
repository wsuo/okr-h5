"use client"

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
import { LogOut, Users, FileText, Home, Key } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { evaluationService } from "@/lib/evaluation"
import { useAuth } from "@/contexts/auth-context"
import ChangePasswordDialog from "@/components/change-password-dialog"

interface LeadHeaderProps {
  userInfo: {
    name: string
    role: string
    id?: number
  }
  pendingTasksCount?: number  // 可选的待办任务数量
}

export default function LeadHeader({ userInfo, pendingTasksCount: propPendingTasksCount }: LeadHeaderProps) {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [pendingTasksCount, setPendingTasksCount] = useState(0)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const currentUser = userInfo || user

  useEffect(() => {
    // 如果从props传入了数量，使用传入的值；否则自己获取
    if (propPendingTasksCount !== undefined) {
      setPendingTasksCount(propPendingTasksCount)
    } else {
      loadPendingTasksCount()
    }
  }, [propPendingTasksCount])

  const loadPendingTasksCount = async () => {
    try {
      const response = await evaluationService.getEvaluationsToGive()
      if (response.code === 200 && response.data) {
        const pendingCount = response.data.filter(evaluation => 
          evaluation.status !== 'submitted'
        ).length
        setPendingTasksCount(pendingCount)
      }
    } catch (error) {
      console.warn('获取待处理任务数量失败:', error)
      setPendingTasksCount(0)
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

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <>
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">团队管理</h1>
            <p className="text-xs text-gray-500">OKR绩效考核系统</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNavigation('/lead')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">首页</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNavigation('/lead/evaluation')}
            className="flex items-center gap-2 relative"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">评估中心</span>
            {pendingTasksCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {pendingTasksCount > 9 ? '9+' : pendingTasksCount}
              </Badge>
            )}
          </Button>

          <div className="w-px h-6 bg-gray-200 hidden sm:block" />
          
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
            <p className="text-xs text-gray-500">部门领导</p>
          </div>
          
          {/* 用户菜单下拉 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-100 text-purple-600">
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
                    {currentUser?.username || userInfo.name}
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
    </header>
    
    {/* 修改密码对话框 */}
    <ChangePasswordDialog 
      open={showChangePassword} 
      onOpenChange={setShowChangePassword} 
    />
  </>
  )
}
