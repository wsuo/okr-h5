"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface BossHeaderProps {
  userInfo?: {
    name: string
    role: string
  }
}

export default function BossHeader({ userInfo }: BossHeaderProps) {
  const router = useRouter()
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">全员看板</h1>
            <p className="text-xs text-gray-500">OKR绩效考核系统</p>
          </div>
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
    </header>
  )
}
