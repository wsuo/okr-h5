"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, Calendar, BarChart3 } from "lucide-react"
import AdminHeader from "@/components/admin-header"
import AssessmentManagement from "@/components/assessment-management"
import TemplateManagement from "@/components/template-management"
import UserManagement from "@/components/user-management"
import { AdminGuard } from "@/components/auth-guard"
import { useEffect, useState } from "react"
import { statisticsService, DashboardStatistics } from "@/lib/statistics"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const res = await statisticsService.getDashboardStatistics()
        if (res.code === 200) setStats(res.data)
      } catch (e: any) {
        console.error('加载统计失败', e)
        setError(e.message || '加载统计失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

      <div className="container mx-auto p-2 sm:p-4 max-w-6xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-600">系统管理与配置中心</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">进行中考核</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? '-' : (stats?.overview.active_assessments ?? 0)}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">系统用户</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? '-' : (stats?.overview.total_users ?? 0)}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">考核模板</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? '-' : (stats?.overview.total_templates ?? 0)}</p>
                </div>
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成率</p>
                  <p className="text-xl sm:text-2xl font-bold">{loading ? '-' : `${(stats?.overview.completion_rate ?? 0).toFixed(1)}%`}</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要功能区域 */}
        <Tabs defaultValue="assessment" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="assessment" className="text-xs sm:text-sm">考核管理</TabsTrigger>
            <TabsTrigger value="template" className="text-xs sm:text-sm">模板管理</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">用户管理</TabsTrigger>
          </TabsList>

          <TabsContent value="assessment">
            <AssessmentManagement />
          </TabsContent>

          <TabsContent value="template">
            <TemplateManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminGuard>
  )
}
