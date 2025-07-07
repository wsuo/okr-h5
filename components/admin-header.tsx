"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface AdminHeaderProps {
  userInfo: {
    name: string
    role: string
  }
}

export default function AdminHeader({ userInfo }: AdminHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo")
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">管理后台</h1>
            <p className="text-xs text-gray-500">OKR绩效考核系统</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
            <p className="text-xs text-gray-500">系统管理员</p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-blue-100 text-blue-600">{userInfo.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
