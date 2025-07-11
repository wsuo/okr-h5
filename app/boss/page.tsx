"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { TrendingUp, Users, Award, Building2, Search } from "lucide-react"
import BossHeader from "@/components/boss-header"
import { useRouter } from "next/navigation"
import { safeParseUserInfo } from "@/lib/utils"

export default function BossDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }
  }, [])

  // 模拟全员数据
  const allEmployees = [
    {
      id: "zhangsan",
      name: "张三",
      department: "技术部",
      position: "前端工程师",
      lastScore: 85.2,
      avgScore: 83.5,
      trend: "up",
    },
    {
      id: "wangwu",
      name: "王五",
      department: "技术部",
      position: "后端工程师",
      lastScore: 88.7,
      avgScore: 86.3,
      trend: "up",
    },
    {
      id: "lisi",
      name: "李四",
      department: "技术部",
      position: "技术经理",
      lastScore: 92.1,
      avgScore: 90.5,
      trend: "stable",
    },
    {
      id: "zhaoliu",
      name: "赵六",
      department: "市场部",
      position: "市场经理",
      lastScore: 87.3,
      avgScore: 85.8,
      trend: "up",
    },
  ]

  // 绩效分布数据
  const scoreDistribution = [
    { range: "90-100", count: 1, color: "#10b981" },
    { range: "80-89", count: 3, color: "#3b82f6" },
    { range: "70-79", count: 0, color: "#f59e0b" },
    { range: "60-69", count: 0, color: "#ef4444" },
  ]

  // 部门平均分数据
  const departmentAverage = [
    { department: "技术部", avgScore: 86.8, count: 3 },
    { department: "市场部", avgScore: 85.8, count: 1 },
  ]

  // 趋势数据
  const trendData = [
    { month: "10月", avgScore: 82.5 },
    { month: "11月", avgScore: 84.2 },
    { month: "12月", avgScore: 86.8 },
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "↗️"
    if (trend === "down") return "↘️"
    return "➡️"
  }

  const filteredEmployees = allEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  if (!userInfo) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BossHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">全员绩效看板</h1>
          <p className="text-gray-600">公司整体绩效数据分析</p>
        </div>

        {/* 总体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总员工数</p>
                  <p className="text-2xl font-bold">{allEmployees.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-2xl font-bold text-green-600">86.8</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">优秀率</p>
                  <p className="text-2xl font-bold text-purple-600">25%</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">部门数</p>
                  <p className="text-2xl font-bold text-orange-600">2</p>
                </div>
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 数据图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 绩效分数分布图 */}
          <Card>
            <CardHeader>
              <CardTitle>绩效分数分布</CardTitle>
              <CardDescription>员工绩效分数区间分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 部门平均分对比 */}
          <Card>
            <CardHeader>
              <CardTitle>部门平均分对比</CardTitle>
              <CardDescription>各部门绩效平均分对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentAverage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[70, 100]} />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 绩效趋势图 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>绩效趋势分析</CardTitle>
            <CardDescription>近三个月公司整体绩效趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[75, 90]} />
                <Tooltip />
                <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 员工列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              员工绩效列表
            </CardTitle>
            <CardDescription>查看所有员工的详细绩效信息</CardDescription>

            {/* 搜索和筛选 */}
            <div className="flex gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索员工姓名或职位..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部门</SelectItem>
                  <SelectItem value="技术部">技术部</SelectItem>
                  <SelectItem value="市场部">市场部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <p className="text-sm text-gray-600">
                        {employee.department} · {employee.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor(employee.lastScore)}`}>
                          {employee.lastScore}
                        </span>
                        <span className="text-lg">{getTrendIcon(employee.trend)}</span>
                      </div>
                      <p className="text-sm text-gray-600">最近得分</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">平均得分：</span>
                      <span className={`font-semibold ${getScoreColor(employee.avgScore)}`}>{employee.avgScore}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">绩效等级：</span>
                      <Badge
                        variant="outline"
                        className={
                          employee.lastScore >= 90
                            ? "text-green-600 border-green-600"
                            : employee.lastScore >= 80
                              ? "text-blue-600 border-blue-600"
                              : "text-yellow-600 border-yellow-600"
                        }
                      >
                        {employee.lastScore >= 90 ? "优秀" : employee.lastScore >= 80 ? "良好" : "合格"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => router.push(`/boss/employee/${employee.id}`)}
                  >
                    查看详细绩效
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
