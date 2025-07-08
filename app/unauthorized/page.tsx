"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { authService } from "@/lib/auth"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleGoBack = () => {
    if (user) {
      const defaultRoute = authService.getDefaultRoute()
      router.push(defaultRoute)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">访问被拒绝</CardTitle>
          <CardDescription>
            抱歉，您没有权限访问此页面。请联系管理员获取相应权限。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user && (
              <div className="p-4 bg-gray-50 rounded-lg text-left">
                <h3 className="font-medium text-gray-900 mb-2">当前用户信息：</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>姓名：{user.name}</div>
                  <div>用户名：{user.username}</div>
                  <div>角色：{user.roles.join('、')}</div>
                </div>
              </div>
            )}
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回主页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}