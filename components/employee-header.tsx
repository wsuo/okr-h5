"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, FileText, Home, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { evaluationService } from "@/lib/evaluation"

interface EmployeeHeaderProps {
  userInfo: {
    name: string
    role: string
    id?: number
  }
}

export default function EmployeeHeader({ userInfo }: EmployeeHeaderProps) {
  const router = useRouter()
  const [pendingTasksCount, setPendingTasksCount] = useState(0)

  useEffect(() => {
    loadPendingTasksCount()
  }, [])

  const loadPendingTasksCount = async () => {
    try {
      const response = await evaluationService.getMyEvaluationTasks()
      if (response.code === 200 && response.data) {
        const pendingCount = response.data.filter(task => 
          task.status === 'pending' || task.status === 'in_progress'
        ).length
        setPendingTasksCount(pendingCount)
      }
    } catch (error) {
      console.warn('获取待处理任务数量失败:', error)
      setPendingTasksCount(0)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo")
    router.push("/")
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">个人中心</h1>
            <p className="text-xs text-gray-500">OKR绩效考核系统</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleNavigation('/employee')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">首页</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/employee/evaluation')}
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

          <div className="w-px h-6 bg-gray-200" />
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
            <p className="text-xs text-gray-500">员工</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-green-100 text-green-600">{userInfo.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
