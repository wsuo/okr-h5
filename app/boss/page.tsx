"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, Award, Building2, Search, Activity, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import BossHeader from "@/components/boss-header"
import { useRouter } from "next/navigation"
import { safeParseUserInfo } from "@/lib/utils"
import {
  statisticsService,
  DashboardStatistics,
  UserStatistics,
  DepartmentStat,
  AssessmentStatistics,
  PerformanceTrends,
  EvaluationStatistics,
  PerformanceListItem,
  UserStatisticsDetail
} from "@/lib/statistics"
import { toast } from "sonner"

export default function BossDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  // Statistics data states
  const [dashboardData, setDashboardData] = useState<DashboardStatistics | null>(null)
  const [userStats, setUserStats] = useState<UserStatistics | null>(null)
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([])
  const [assessmentStats, setAssessmentStats] = useState<AssessmentStatistics | null>(null)
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrends | null>(null)
  const [evaluationStats, setEvaluationStats] = useState<EvaluationStatistics | null>(null)
  const [performanceList, setPerformanceList] = useState<PerformanceListItem[]>([])
  const [userStatsDetail, setUserStatsDetail] = useState<UserStatisticsDetail[]>([])

  // Date range for API queries
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end_date: new Date().toISOString().split('T')[0] // today
  })

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
      loadAllStatistics()
    } else {
      router.push('/')
      return
    }
  }, [])

  const loadAllStatistics = async () => {
    try {
      setLoading(true)
      setError("")

      // Load all statistics data in parallel
      const [
        dashboardResponse,
        userStatsResponse,
        departmentStatsResponse,
        assessmentStatsResponse,
        trendsResponse,
        evaluationStatsResponse,
        performanceListResponse,
        userStatsDetailResponse
      ] = await Promise.all([
        statisticsService.getDashboardStatistics(),
        statisticsService.getUserStatistics(),
        statisticsService.getDepartmentStatistics(),
        statisticsService.getAssessmentStatistics(),
        statisticsService.getPerformanceTrends(),
        statisticsService.getEvaluationStatistics(),
        statisticsService.getPerformanceList(dateRange),
        statisticsService.getUserStatisticsDetail({
          ...dateRange,
          time_dimension: 'week',
          group_by: 'user'
        })
      ])

      // Set data if requests are successful
      if (dashboardResponse.code === 200) {
        setDashboardData(dashboardResponse.data)
      }
      if (userStatsResponse.code === 200) {
        setUserStats(userStatsResponse.data)
      }
      if (departmentStatsResponse.code === 200) {
        setDepartmentStats(departmentStatsResponse.data || [])
      }
      if (assessmentStatsResponse.code === 200) {
        setAssessmentStats(assessmentStatsResponse.data)
      }
      if (trendsResponse.code === 200) {
        setPerformanceTrends(trendsResponse.data)
      }
      if (evaluationStatsResponse.code === 200) {
        setEvaluationStats(evaluationStatsResponse.data)
      }
      if (performanceListResponse.code === 200) {
        setPerformanceList(performanceListResponse.data || [])
      }
      if (userStatsDetailResponse.code === 200) {
        setUserStatsDetail(userStatsDetailResponse.data || [])
      }

    } catch (error: any) {
      console.error('Failed to load statistics:', error)
      setError(error.message || '加载统计数据失败')
      toast.error('加载统计数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for data processing
  const processScoreDistribution = () => {
    if (!dashboardData?.score_distribution) return []
    // 兼容API可能返回对象而非数组的情况
    const distribution = Array.isArray(dashboardData.score_distribution)
      ? dashboardData.score_distribution
      : Object.entries(dashboardData.score_distribution).map(([range, count]) => ({ range, count: count as number, percentage: 0 /* 可以在此计算百分比 */ }))

    return distribution.map(item => ({
      ...item,
      color: item.range.includes('90-100') ? '#10b981' :
             item.range.includes('80-89') ? '#3b82f6' :
             item.range.includes('70-79') ? '#f59e0b' : '#ef4444'
    }))
  }

  const processDepartmentData = () => {
    return departmentStats.map(dept => ({
      department: dept.name,
      avgScore: ((dept.avg_self_score + dept.avg_leader_score) / 2),
      selfScore: dept.avg_self_score,
      leaderScore: dept.avg_leader_score,
      count: dept.user_count,
      completionRate: ((dept.self_completion_rate + dept.leader_completion_rate) / 2)
    }))
  }

  const processTrendData = () => {
    if (!performanceTrends?.monthly_trends) return []
    return performanceTrends.monthly_trends.map(trend => ({
      month: trend.month,
      avgScore: trend.average_score,
      selfAverage: trend.self_average,
      leaderAverage: trend.leader_average,
      completionRate: trend.completion_rate
    }))
  }

  const processEmployeeData = () => {
    if (!performanceList || performanceList.length === 0) return []
    return performanceList.map(item => ({
      id: item.employee.id,
      name: item.employee.name,
      username: item.employee.username,
      department: item.employee.department,
      position: item.employee.position,
      lastScore: item.scores.final_score,
      avgScore: (item.scores.self_score + item.scores.leader_score) / 2,
      selfScore: item.scores.self_score,
      leaderScore: item.scores.leader_score,
      finalScore: item.scores.final_score,
      trend: item.scores.leader_score > item.scores.self_score ? 'up' :
             item.scores.leader_score < item.scores.self_score ? 'down' : 'stable',
      assessment: item.assessment,
      completion: item.completion,
      selfCompleted: item.completion.self_completed,
      leaderCompleted: item.completion.leader_completed,
      selfSubmittedAt: item.completion.self_submitted_at,
      leaderSubmittedAt: item.completion.leader_submitted_at
    }))
  }

  const processUserStatsDetailData = () => {
    return userStatsDetail.map(user => ({
      userId: user.user_id,
      username: user.user_username,
      name: user.user_name,
      department: user.department_name,
      totalAssessments: parseInt(user.total_assessments),
      selfCompleted: parseInt(user.self_completed),
      leaderCompleted: parseInt(user.leader_completed),
      avgSelfScore: parseFloat(user.avg_self_score),
      avgLeaderScore: parseFloat(user.avg_leader_score),
      selfCompletionRate: (parseInt(user.self_completed) / parseInt(user.total_assessments)) * 100,
      leaderCompletionRate: (parseInt(user.leader_completed) / parseInt(user.total_assessments)) * 100
    }))
  }

  // Get processed data
  const allEmployees = processEmployeeData()
  const userStatsDetailProcessed = processUserStatsDetailData()
  const scoreDistribution = processScoreDistribution()
  const departmentAverage = processDepartmentData()
  const trendData = processTrendData()

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

  // Get unique departments for filter
  const availableDepartments = Array.from(new Set(allEmployees.map(emp => emp.department)))

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-lg">正在加载统计数据...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadAllStatistics}>重新加载</Button>
            </div>
          </div>
        </div>
      </div>
    )
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总员工数</p>
                  <p className="text-2xl font-bold">{dashboardData?.overview.total_users || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    活跃考核: {dashboardData?.overview.active_assessments || 0}
                  </p>
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
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData?.overview.average_score?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    自评: {dashboardData?.overview.self_average?.toFixed(1) || '0.0'} |
                    领导: {dashboardData?.overview.leader_average?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成率</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData?.overview.completion_rate?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    总评估: {dashboardData?.overview.total_evaluations || 0}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">部门数</p>
                  <p className="text-2xl font-bold text-orange-600">{departmentStats.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    已完成考核: {dashboardData?.overview.completed_assessments || 0}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 新增统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">评估统计</p>
                  <p className="text-2xl font-bold text-cyan-600">
                    {evaluationStats?.total_evaluations || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    自评: {evaluationStats?.self_evaluations || 0} |
                    领导: {evaluationStats?.leader_evaluations || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">考核统计</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {assessmentStats?.total_assessments || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    活跃: {assessmentStats?.active_assessments || 0} |
                    完成: {assessmentStats?.completed_assessments || 0}
                  </p>
                </div>
                <Award className="w-8 h-8 text-emerald-600" />
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
                  <Tooltip
                    formatter={(value, name) => [
                      `${value}人 (${((value as number) / (dashboardData?.overview.total_users || 1) * 100).toFixed(1)}%)`,
                      '人数'
                    ]}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 部门平均分对比 */}
          <Card>
            <CardHeader>
              <CardTitle>部门绩效对比</CardTitle>
              <CardDescription>各部门自评与领导评分对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentAverage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)}分`,
                      name === 'selfScore' ? '自评平均分' :
                      name === 'leaderScore' ? '领导评分' : '综合平均分'
                    ]}
                  />
                  <Bar dataKey="selfScore" fill="#3b82f6" name="自评" />
                  <Bar dataKey="leaderScore" fill="#10b981" name="领导评分" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 用户统计详细分析图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 员工完成率对比 */}
          <Card>
            <CardHeader>
              <CardTitle>员工完成率分析</CardTitle>
              <CardDescription>各员工自评与领导评分完成率对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={userStatsDetailProcessed.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)}%`,
                      name === 'selfCompletionRate' ? '自评完成率' : '领导评分完成率'
                    ]}
                  />
                  <Bar dataKey="selfCompletionRate" fill="#3b82f6" name="自评完成率" />
                  <Bar dataKey="leaderCompletionRate" fill="#10b981" name="领导评分完成率" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 员工平均分对比 */}
          <Card>
            <CardHeader>
              <CardTitle>员工评分对比</CardTitle>
              <CardDescription>各员工自评与领导评分平均分对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={userStatsDetailProcessed.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)}分`,
                      name === 'avgSelfScore' ? '自评平均分' : '领导评分平均分'
                    ]}
                  />
                  <Bar dataKey="avgSelfScore" fill="#f59e0b" name="自评平均分" />
                  <Bar dataKey="avgLeaderScore" fill="#ef4444" name="领导评分平均分" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 部门维度分析 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 部门参与度分析 */}
          <Card>
            <CardHeader>
              <CardTitle>部门参与度分析</CardTitle>
              <CardDescription>各部门考核参与情况统计</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={
                  Object.entries(
                    userStatsDetailProcessed.reduce((acc, user) => {
                      if (!acc[user.department]) {
                        acc[user.department] = {
                          department: user.department,
                          totalAssessments: 0,
                          avgCompletionRate: 0,
                          userCount: 0
                        }
                      }
                      acc[user.department].totalAssessments += user.totalAssessments
                      acc[user.department].avgCompletionRate += (user.selfCompletionRate + user.leaderCompletionRate) / 2
                      acc[user.department].userCount += 1
                      return acc
                    }, {} as any)
                  ).map(([dept, data]: [string, any]) => ({
                    department: dept,
                    totalAssessments: data.totalAssessments,
                    avgCompletionRate: data.avgCompletionRate / data.userCount
                  }))
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'totalAssessments' ? `${value}次` : `${(value as number).toFixed(1)}%`,
                      name === 'totalAssessments' ? '总考核次数' : '平均完成率'
                    ]}
                  />
                  <Bar dataKey="totalAssessments" fill="#8b5cf6" name="总考核次数" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 评估完成率饼图 */}
          <Card>
            <CardHeader>
              <CardTitle>评估完成情况</CardTitle>
              <CardDescription>自评与领导评分完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '自评完成', value: evaluationStats?.self_evaluations || 0, fill: '#3b82f6' },
                      { name: '领导评分完成', value: evaluationStats?.leader_evaluations || 0, fill: '#10b981' },
                      {
                        name: '待完成',
                        value: Math.max(0, (dashboardData?.overview.total_evaluations || 0) - (evaluationStats?.total_evaluations || 0)),
                        fill: '#f59e0b'
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 绩效趋势图 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>绩效趋势分析</CardTitle>
            <CardDescription>公司整体绩效趋势变化</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip
                  formatter={(value, name) => [
                    `${(value as number).toFixed(1)}${name === 'completionRate' ? '%' : '分'}`,
                    name === 'avgScore' ? '综合平均分' :
                    name === 'selfAverage' ? '自评平均分' :
                    name === 'leaderAverage' ? '领导评分' : '完成率'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="综合平均分"
                />
                <Line
                  type="monotone"
                  dataKey="selfAverage"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="自评平均分"
                />
                <Line
                  type="monotone"
                  dataKey="leaderAverage"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="领导评分"
                />
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
                  {availableDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* 员工基本信息 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{employee.name}</h3>
                        <p className="text-sm text-gray-600">@{employee.username}</p>
                        <p className="text-sm text-gray-600">{employee.position} · {employee.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(employee.finalScore)}`}>
                        {employee.finalScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-500">最终得分</div>
                    </div>
                  </div>

                  {/* 考核信息 */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">考核信息</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">考核标题：</span>
                        <span className="font-medium">{employee.assessment?.title || '--'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">考核周期：</span>
                        <span className="font-medium">{employee.assessment?.period || '--'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">考核状态：</span>
                        <Badge className={
                          employee.assessment?.status === 'active'
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }>
                          {employee.assessment?.status === 'active' ? '进行中' : '已结束'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600">考核时间：</span>
                        <span className="text-xs text-gray-500">
                          {employee.assessment?.start_date ?
                            `${new Date(employee.assessment.start_date).toLocaleDateString()} - ${new Date(employee.assessment.end_date).toLocaleDateString()}` :
                            '--'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 评分详情 */}
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(employee.selfScore)}`}>
                        {employee.selfScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">自评得分</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(employee.leaderScore)}`}>
                        {employee.leaderScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">领导评分</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className={`text-xl font-bold ${getScoreColor(employee.finalScore)}`}>
                        {employee.finalScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">最终得分</div>
                    </div>
                  </div>

                  {/* 完成状态 */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${employee.selfCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-gray-600">自评完成：</span>
                      <span className={`font-medium ${employee.selfCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {employee.selfCompleted ? '已完成' : '未完成'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${employee.leaderCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-gray-600">领导评分：</span>
                      <span className={`font-medium ${employee.leaderCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {employee.leaderCompleted ? '已完成' : '未完成'}
                      </span>
                    </div>
                  </div>

                  {/* 提交时间 */}
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
                    <div>
                      <span>自评提交：</span>
                      <span className="block">
                        {employee.selfSubmittedAt ?
                          new Date(employee.selfSubmittedAt).toLocaleString() :
                          '未提交'
                        }
                      </span>
                    </div>
                    <div>
                      <span>领导提交：</span>
                      <span className="block">
                        {employee.leaderSubmittedAt ?
                          new Date(employee.leaderSubmittedAt).toLocaleString() :
                          '未提交'
                        }
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUp
                        className={`w-4 h-4 ${
                          employee.trend === "up"
                            ? "text-green-600"
                            : employee.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      />
                      <span className="text-sm text-gray-600">
                        {employee.trend === "up" ? "领导评分更高" :
                         employee.trend === "down" ? "自评更高" : "评分一致"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/boss/employee/${employee.id}`)}
                    >
                      查看详细绩效
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">暂无员工数据</h3>
                <p>没有找到符合条件的员工信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
