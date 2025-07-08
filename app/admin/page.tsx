"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, Calendar, BarChart3 } from "lucide-react"
import AdminHeader from "@/components/admin-header"
import AssessmentManagement from "@/components/assessment-management"
import TemplateManagement from "@/components/template-management"
import UserManagement from "@/components/user-management"
import { AdminGuard } from "@/components/auth-guard"

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />

      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
          <p className="text-gray-600">系统管理与配置中心</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">进行中考核</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">系统用户</p>
                  <p className="text-2xl font-bold">6</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">考核模板</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成率</p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 主要功能区域 */}
        <Tabs defaultValue="assessment" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assessment">考核管理</TabsTrigger>
            <TabsTrigger value="template">模板管理</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
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
