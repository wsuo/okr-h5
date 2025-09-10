"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, Users, User, Award, Building2, Search, Activity, Target, CheckCircle, AlertCircle, Loader2, Crown, Clock, UserCheck, ArrowRight } from "lucide-react"
import BossHeader from "@/components/boss-header"
import { useRouter } from "next/navigation"
import { safeParseUserInfo, isBossUser } from "@/lib/utils"
import {
  statisticsService,
  DashboardStatistics,
  DepartmentStat,
  PerformanceListItem,
  UserStatisticsDetail
} from "@/lib/statistics"
import {
  evaluationService,
  BossTask,
  evaluationUtils
} from "@/lib/evaluation"
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
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([])
  const [performanceList, setPerformanceList] = useState<PerformanceListItem[]>([])
  const [userStatsDetail, setUserStatsDetail] = useState<UserStatisticsDetail[]>([])
  
  // Boss tasks state
  const [bossTasks, setBossTasks] = useState<BossTask[]>([])
  const [pendingTasksCount, setPendingTasksCount] = useState(0)

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

      // Load all statistics data and boss tasks in parallel
      const [
        dashboardResponse,
        departmentStatsResponse,
        performanceListResponse,
        userStatsDetailResponse,
        bossTasksResponse
      ] = await Promise.all([
        statisticsService.getDashboardStatistics(),
        statisticsService.getDepartmentStatistics(),
        statisticsService.getPerformanceList(dateRange),
        statisticsService.getUserStatisticsDetail({
          ...dateRange,
          time_dimension: 'week',
          group_by: 'user'
        }),
        evaluationService.getBossTasks()
      ])

      // Set data if requests are successful
      if (dashboardResponse.code === 200) {
        setDashboardData(dashboardResponse.data)
      }
      if (departmentStatsResponse.code === 200) {
        setDepartmentStats(departmentStatsResponse.data || [])
      }
      if (performanceListResponse.code === 200) {
        setPerformanceList(performanceListResponse.data || [])
      }
      if (userStatsDetailResponse.code === 200) {
        setUserStatsDetail(userStatsDetailResponse.data || [])
      }
      if (bossTasksResponse.code === 200) {
        const tasksRaw = bossTasksResponse.data || []
        const tasks = tasksRaw.map((t: any) => ({
          ...t,
          is_overdue: t?.deadline ? evaluationUtils.isOverdue(t.deadline) : false,
        }))
        setBossTasks(tasks)
        const pendingTasks = tasks.filter(task => task.status === 'pending')
        setPendingTasksCount(pendingTasks.length)
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
    // 英文等级到中文标签的映射
    const getChineseLabel = (englishKey: string) => {
      const labelMap: Record<string, string> = {
        'excellent': '优秀',
        'good': '良好', 
        'average': '一般',
        'poor': '较差'
      }
      return labelMap[englishKey] || '较差'
    }

    // 英文等级到颜色的映射
    const getColor = (englishKey: string) => {
      const colorMap: Record<string, string> = {
        'excellent': '#10b981',
        'good': '#3b82f6',
        'average': '#f59e0b', 
        'poor': '#ef4444'
      }
      return colorMap[englishKey] || '#ef4444'
    }

    if (!dashboardData?.score_distribution) {
      // Return default score ranges if no data available
      return [
        { range: '优秀', originalRange: 'excellent', count: 0, percentage: 0, color: '#10b981' },
        { range: '良好', originalRange: 'good', count: 0, percentage: 0, color: '#3b82f6' },
        { range: '一般', originalRange: 'average', count: 0, percentage: 0, color: '#f59e0b' },
        { range: '较差', originalRange: 'poor', count: 0, percentage: 0, color: '#ef4444' }
      ]
    }

    // Handle both array and object formats from API
    const distribution = Array.isArray(dashboardData.score_distribution)
      ? dashboardData.score_distribution
      : Object.entries(dashboardData.score_distribution).map(([englishKey, count]) => ({
          range: englishKey,
          count: count as number,
          percentage: 0
        }))

    return distribution.map(item => {
      const originalRange = item.range // 保存原始英文key用于颜色判断
      return {
        ...item,
        originalRange: originalRange, 
        range: getChineseLabel(item.range), // 使用中文标签
        color: getColor(originalRange) // 根据英文key获取颜色
      }
    })
  }

  const processDepartmentData = () => {
    return departmentStats.map(dept => ({
      department: dept.name,
      avgScore: ((dept.avg_self_score + dept.avg_leader_score + (dept.avg_boss_score || 0)) / 3),
      selfScore: dept.avg_self_score,
      leaderScore: dept.avg_leader_score,
      bossScore: dept.avg_boss_score || 0,
      count: dept.user_count,
      completionRate: ((dept.self_completion_rate + dept.leader_completion_rate + (dept.boss_completion_rate || 0)) / 3)
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
      avgScore: (item.scores.self_score + item.scores.leader_score + (item.scores.boss_score || 0)) / 3,
      selfScore: item.scores.self_score,
      leaderScore: item.scores.leader_score,
      bossScore: item.scores.boss_score || 0,
      finalScore: item.scores.final_score,
      trend: item.scores.leader_score > item.scores.self_score ? 'up' :
             item.scores.leader_score < item.scores.self_score ? 'down' : 'stable',
      assessment: item.assessment,
      completion: item.completion,
      selfCompleted: item.completion.self_completed,
      leaderCompleted: item.completion.leader_completed,
      bossCompleted: item.completion.boss_completed || false,
      selfSubmittedAt: item.completion.self_submitted_at,
      leaderSubmittedAt: item.completion.leader_submitted_at,
      bossSubmittedAt: item.completion.boss_submitted_at || null
    }))
  }

  const processUserStatsDetailData = () => {
    if (!userStatsDetail || userStatsDetail.length === 0) {
      console.log('用户统计详细数据为空')
      return []
    }

    const processedData = userStatsDetail.map(user => {
      const totalAssessments = parseInt(user.total_assessments) || 0
      const selfCompleted = parseInt(user.self_completed) || 0
      const leaderCompleted = parseInt(user.leader_completed) || 0

      // 计算完成率，避免除零错误
      const selfCompletionRate = totalAssessments > 0 ? (selfCompleted / totalAssessments) * 100 : 0
      const leaderCompletionRate = totalAssessments > 0 ? (leaderCompleted / totalAssessments) * 100 : 0

      const processedUser = {
        userId: user.user_id,
        username: user.user_username,
        name: user.user_name,
        department: user.department_name,
        totalAssessments,
        selfCompleted,
        leaderCompleted,
        avgSelfScore: parseFloat(user.avg_self_score) || 0,
        avgLeaderScore: parseFloat(user.avg_leader_score) || 0,
        selfCompletionRate,
        leaderCompletionRate
      }

      // 调试信息：输出处理后的数据
      if (process.env.NODE_ENV === 'development') {
        console.log(`处理用户数据 - ${user.user_name}:`, {
          原始数据: {
            total_assessments: user.total_assessments,
            self_completed: user.self_completed,
            leader_completed: user.leader_completed
          },
          处理后数据: {
            totalAssessments,
            selfCompleted,
            leaderCompleted,
            selfCompletionRate: selfCompletionRate.toFixed(1),
            leaderCompletionRate: leaderCompletionRate.toFixed(1)
          }
        })
      }

      return processedUser
    })

    console.log('处理后的用户统计数据总数:', processedData.length)
    return processedData
  }

  // Get processed data
  const allEmployees = processEmployeeData()
  const userStatsDetailProcessed = processUserStatsDetailData()
  const scoreDistribution = processScoreDistribution()
  const departmentAverage = processDepartmentData()

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
        <BossHeader userInfo={userInfo} pendingTasksCount={pendingTasksCount} />
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
        <BossHeader userInfo={userInfo} pendingTasksCount={pendingTasksCount} />
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
      <BossHeader userInfo={userInfo} pendingTasksCount={pendingTasksCount} />

      <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">全员绩效看板</h1>
          <p className="text-sm sm:text-base text-gray-600">公司整体绩效数据分析</p>
        </div>

        {/* Boss 待办任务卡片 */}
        {pendingTasksCount > 0 && (
          <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Crown className="w-5 h-5" />
                Boss 待办任务
              </CardTitle>
              <CardDescription className="text-yellow-700">
                您有 <strong className="text-yellow-800">{pendingTasksCount}</strong> 项待评分任务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bossTasks.filter(task => task.status === 'pending').slice(0, 3).map((task) => (
                  <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/60 rounded-lg border border-yellow-300 space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium text-gray-900">{task.evaluatee_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.evaluatee_department}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {task.assessment_title} · 截止：{evaluationUtils.formatDate(task.deadline)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-4 justify-end">
                      {task.is_overdue && (
                        <Badge variant="destructive" className="text-xs">
                          已逾期
                        </Badge>
                      )}
                      {!task.is_overdue && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/boss/evaluation/${task.assessment_id}/${task.evaluatee_id}`)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          立即评分
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {pendingTasksCount > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/boss/evaluation')}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      查看全部 {pendingTasksCount} 项任务
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 总体统计 - 重新设计以充分利用仪表板API数据 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* 总用户数 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">总用户数</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{dashboardData?.overview.total_users || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">系统注册用户</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* 总评估数 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">总评估数</p>
                  <p className="text-lg sm:text-2xl font-bold text-indigo-600">{dashboardData?.overview.total_evaluations || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">累计评估次数</p>
                </div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          {/* 完成率 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">完成率</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {dashboardData?.overview.completion_rate?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">评估完成比例</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* 平均得分 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">平均得分</p>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                    {dashboardData?.overview.average_score?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">综合平均分</p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 考核统计详情 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* 活跃考核 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">活跃考核</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{dashboardData?.overview.active_assessments || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">正在进行中</p>
                </div>
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          {/* 已完成考核 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">已完成考核</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{dashboardData?.overview.completed_assessments || 0}</p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">已结束考核</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* 自评平均分 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">自评平均分</p>
                  <p className="text-lg sm:text-2xl font-bold text-cyan-600">
                    {dashboardData?.overview.self_average?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">员工自评得分</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-600" />
              </div>
            </CardContent>
          </Card>

          {/* 领导评分平均分 */}
          <Card>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">领导评分平均分</p>
                  <p className="text-lg sm:text-2xl font-bold text-rose-600">
                    {dashboardData?.overview.leader_average?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">领导评估得分</p>
                </div>
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 数据图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* 绩效分数分布图 */}
          <Card>
            <CardHeader>
              <CardTitle>绩效分数分布</CardTitle>
              <CardDescription>员工绩效分数区间分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name, props) => {
                      const data = props.payload?.[0]?.payload
                      const originalRange = data?.originalRange || ''
                      return [
                        `${value}人 (${((value as number) / (dashboardData?.overview.total_users || 1) * 100).toFixed(1)}%)`,
                        `${data?.range || ''}${originalRange ? ` (${originalRange}分)` : ''}`
                      ]
                    }}
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
              <CardDescription>各部门三维度评分对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={departmentAverage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)}分`,
                      name === 'selfScore' ? '自评平均分' :
                      name === 'leaderScore' ? '领导评分' : 
                      name === 'bossScore' ? 'Boss评分' : '综合平均分'
                    ]}
                  />
                  <Bar dataKey="selfScore" fill="#3b82f6" name="自评" />
                  <Bar dataKey="leaderScore" fill="#10b981" name="领导评分" />
                  <Bar dataKey="bossScore" fill="#8b5cf6" name="Boss评分" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 用户统计详细分析图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* 员工完成率对比 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>员工完成率分析</span>
              </CardTitle>
              <CardDescription>
                各员工自评与领导评分完成率对比
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userStatsDetailProcessed.length === 0 ? (
                <div className="flex items-center justify-center h-[350px] text-gray-500">
                  <div className="text-center">
                    <p>暂无数据</p>
                    <p className="text-sm mt-1">请检查是否有用户统计数据</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
                  <BarChart
                    data={userStatsDetailProcessed.slice(0, 10)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{ value: '完成率 (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) {
                          return null
                        }

                        const data = payload[0]?.payload

                        return (
                          <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                            <p className="font-medium mb-2">{`员工: ${label}`}</p>
                            {payload.map((entry, index) => {
                              const isself = entry.dataKey === 'selfCompletionRate'
                              const completedCount = isself ? data?.selfCompleted : data?.leaderCompleted
                              const totalCount = data?.totalAssessments || 0
                              const labelText = isself ? '自评完成率' : '领导评分完成率'

                              return (
                                <div key={index} className="flex items-center mb-1">
                                  <div
                                    className="w-3 h-3 mr-2"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-sm">
                                    {labelText}: {(entry.value as number).toFixed(1)}% ({completedCount || 0}/{totalCount})
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                    <Bar
                      dataKey="selfCompletionRate"
                      fill="#3b82f6"
                      name="自评完成率"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="leaderCompletionRate"
                      fill="#10b981"
                      name="领导评分完成率"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 员工平均分对比 */}
          <Card>
            <CardHeader>
              <CardTitle>员工评分对比</CardTitle>
              <CardDescription>各员工自评与领导评分平均分对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
                <BarChart data={userStatsDetailProcessed.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name, props) => {
                      // Use the dataKey to determine the correct label
                      const label = props.dataKey === 'avgSelfScore' ? '自评平均分' : '领导评分平均分'
                      return [`${(value as number).toFixed(1)}分`, label]
                    }}
                  />
                  <Bar dataKey="avgSelfScore" fill="#f59e0b" name="自评平均分" />
                  <Bar dataKey="avgLeaderScore" fill="#ef4444" name="领导评分平均分" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>





        {/* 员工列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              员工绩效列表
            </CardTitle>
            <CardDescription>查看所有员工的详细绩效信息</CardDescription>

            {/* 搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索员工姓名或职位..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-40">
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
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="border rounded-lg p-3 sm:p-6 hover:shadow-md transition-shadow">
                  {/* 员工基本信息 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">{employee.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">@{employee.username}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{employee.position} · {employee.department}</p>
                      </div>
                    </div>
                    <div className="text-right sm:text-right text-center">
                      <div className={`text-xl sm:text-2xl font-bold ${getScoreColor(employee.finalScore)}`}>
                        {employee.finalScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-500">最终得分</div>
                    </div>
                  </div>

                  {/* 考核信息 */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">考核信息</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm mb-4">
                    <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <div className={`text-lg sm:text-xl font-bold ${getScoreColor(employee.selfScore)}`}>
                        {employee.selfScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">自评得分</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                      <div className={`text-lg sm:text-xl font-bold ${getScoreColor(employee.leaderScore)}`}>
                        {employee.leaderScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">领导评分</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-violet-50 rounded-lg">
                      <div className={`text-lg sm:text-xl font-bold ${getScoreColor(employee.bossScore || 0)}`}>
                        {employee.bossScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">Boss评分</div>
                    </div>
                    <div className="text-center p-2 sm:p-3 bg-purple-50 rounded-lg">
                      <div className={`text-lg sm:text-xl font-bold ${getScoreColor(employee.finalScore)}`}>
                        {employee.finalScore?.toFixed(1) || '--'}
                      </div>
                      <div className="text-xs text-gray-600">最终得分</div>
                    </div>
                  </div>

                  {/* 完成状态 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm mb-4">
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
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${employee.bossCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="text-gray-600">Boss评分：</span>
                      <span className={`font-medium ${employee.bossCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {employee.bossCompleted ? '已完成' : '未完成'}
                      </span>
                    </div>
                  </div>

                  {/* 提交时间 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs text-gray-500 mb-4">
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
                    <div>
                      <span>Boss提交：</span>
                      <span className="block">
                        {employee.bossSubmittedAt ?
                          new Date(employee.bossSubmittedAt).toLocaleString() :
                          '未提交'
                        }
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
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
                      className="w-full sm:w-auto"
                    >
                      查看详细绩效
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-base sm:text-lg font-medium mb-2">暂无员工数据</h3>
                <p className="text-sm sm:text-base">没有找到符合条件的员工信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
