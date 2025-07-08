"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Key, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ChangePasswordDialog from "./change-password-dialog"
import { authUtils } from "@/lib/auth"

export default function UserDropdown() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error('Logout failed:', error)
      router.push("/")
    }
  }

  if (!user) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-2 gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {authUtils.formatUserRoles(user.roles)}
              </p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">@{user.username}</p>
            {user.department && (
              <p className="text-xs text-gray-500">{user.department.name}</p>
            )}
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={() => setChangePasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            修改密码
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog 
        open={isChangePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  )
}