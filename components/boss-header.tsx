"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Crown, Home, UserCheck } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface BossHeaderProps {
  userInfo?: {
    name: string
    role: string
  }
}

export default function BossHeader({ userInfo }: BossHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const currentUser = userInfo || user

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
      label: "全员看板",
      icon: Home,
      path: "/boss",
      isActive: pathname === "/boss"
    },
    {
      label: "上级评估",
      icon: UserCheck,
      path: "/boss/evaluation",
      isActive: pathname.startsWith("/boss/evaluation")
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
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
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
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
