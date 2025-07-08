"use client"

import { Settings } from "lucide-react"
import UserDropdown from "./user-dropdown"

interface AdminHeaderProps {
  userInfo?: {
    name: string
    role: string
  }
}

export default function AdminHeader({ userInfo }: AdminHeaderProps) {
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

        <UserDropdown />
      </div>
    </header>
  )
}
