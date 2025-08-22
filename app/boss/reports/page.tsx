"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { TrendingUp, TrendingDown, Users, Award, Building2, Search, Activity, Target, CheckCircle, AlertCircle, Loader2, BarChart3, Calendar, Filter } from "lucide-react"
import BossHeader from "@/components/boss-header"
import { useRouter } from "next/navigation"
import { safeParseUserInfo } from "@/lib/utils"
import {
  statisticsService,
  DashboardStatistics,
  DepartmentStat,
  PerformanceListItem,
  PerformanceTrends,
  StatisticsQueryParams,
  ScoreDistributionNew
} from "@/lib/statistics"
import { toast } from "sonner"

// 时间快速选择选项
const timeRangeOptions = [
  { label: "近7天", value: "7d", days: 7 },
  { label: "近30天", value: "30d", days: 30 },
  { label: "近3个月", value: "3m", days: 90 },
  { label: "近半年", value: "6m", days: 180 },
  { label: "近一年", value: "1y", days: 365 }
]

export default function BossReportsPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 筛选状态
  const [timeRange, setTimeRange] = useState("30d")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // 数据状态
  const [dashboardData, setDashboardData] = useState<DashboardStatistics | null>(null)
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([])
  const [performanceList, setPerformanceList] = useState<PerformanceListItem[]>([])
  const [trendsData, setTrendsData] = useState<PerformanceTrends | null>(null)

  // 获取当前时间范围的日期
  const getDateRange = (range: string) => {
    const endDate = new Date()
    const startDate = new Date()
    
    const option = timeRangeOptions.find(opt => opt.value === range)
    if (option) {
      startDate.setDate(endDate.getDate() - option.days)
    }

    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }
  }

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
      loadAllData()
    } else {
      router.push('/')
      return
    }
  }, [timeRange, departmentFilter])

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError("")

      const dateRange = getDateRange(timeRange)
      const queryParams: StatisticsQueryParams = {
        ...dateRange
        // 注意：不传 department_id，改为在前端进行部门筛选
        // 因为 departmentFilter 是部门名称而不是ID
      }

      // 并行加载所有数据
      const [
        dashboardResponse,
        departmentStatsResponse,
        performanceListResponse,
        trendsResponse
      ] = await Promise.all([
        statisticsService.getDashboardStatistics(),
        statisticsService.getDepartmentStatistics(),
        statisticsService.getPerformanceList(queryParams),
        statisticsService.getPerformanceTrends(queryParams)
      ])

      // 设置数据
      if (dashboardResponse.code === 200) {
        setDashboardData(dashboardResponse.data)
      }
      if (departmentStatsResponse.code === 200) {
        setDepartmentStats(departmentStatsResponse.data || [])
      }
      if (performanceListResponse.code === 200) {
        setPerformanceList(performanceListResponse.data || [])
      }
      if (trendsResponse.code === 200) {
        setTrendsData(trendsResponse.data)
      }

    } catch (error: any) {
      console.error('加载报表数据失败:', error)
      setError(error.message || '加载报表数据失败')
      toast.error('加载报表数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 数据处理函数
  const processScoreDistribution = () => {
    if (!dashboardData?.score_distribution) {
      return [
        { name: '优秀(90-100)', value: 0, color: '#10b981' },
        { name: '良好(80-89)', value: 0, color: '#3b82f6' },
        { name: '一般(70-79)', value: 0, color: '#f59e0b' },
        { name: '较差(60-69)', value: 0, color: '#ef4444' }
      ]
    }

    const distribution = dashboardData.score_distribution

    // 处理新的数据格式：{ excellent: 4, good: 7, average: 1, poor: 2 }
    if (typeof distribution === 'object' && 'excellent' in distribution) {
      return [
        { 
          name: '优秀(90-100)', 
          value: distribution.excellent || 0, 
          color: '#10b981' 
        },
        { 
          name: '良好(80-89)', 
          value: distribution.good || 0, 
          color: '#3b82f6' 
        },
        { 
          name: '一般(70-79)', 
          value: distribution.average || 0, 
          color: '#f59e0b' 
        },
        { 
          name: '较差(60-69)', 
          value: distribution.poor || 0, 
          color: '#ef4444' 
        }
      ]
    }

    // 兼容旧格式：数组或带范围字符串的对象
    const distributionArray = Array.isArray(distribution)
      ? distribution
      : Object.entries(distribution).map(([range, count]) => ({
          range,
          count: count as number
        }))

    return distributionArray.map(item => ({
      name: item.range.includes('90') || item.range.includes('100') ? '优秀(90-100)' :
            item.range.includes('80') || item.range.includes('89') ? '良好(80-89)' :
            item.range.includes('70') || item.range.includes('79') ? '一般(70-79)' : '较差(60-69)',
      value: item.count,
      color: item.range.includes('90') || item.range.includes('100') ? '#10b981' :
             item.range.includes('80') || item.range.includes('89') ? '#3b82f6' :
             item.range.includes('70') || item.range.includes('79') ? '#f59e0b' : '#ef4444'
    }))
  }

  const processDepartmentData = () => {
    let filteredStats = departmentStats
    
    // 如果选择了特定部门，只显示该部门的数据
    if (departmentFilter !== "all") {
      filteredStats = departmentStats.filter(dept => dept.name === departmentFilter)
    }
    
    return filteredStats.map(dept => ({
      department: dept.name,
      avgScore: ((dept.avg_self_score + dept.avg_leader_score + (dept.avg_boss_score || 0)) / 3),
      selfScore: dept.avg_self_score,
      leaderScore: dept.avg_leader_score,
      bossScore: dept.avg_boss_score || 0,
      completionRate: ((dept.self_completion_rate + dept.leader_completion_rate + (dept.boss_completion_rate || 0)) / 3),
      userCount: dept.user_count
    }))
  }

  const processTrendsData = () => {
    // 如果API数据不可用，使用绩效列表数据生成趋势展示
    if (!trendsData?.monthly_trends || trendsData.monthly_trends.length === 0) {
      // 如果没有趋势数据，基于当前绩效数据生成简单的趋势展示
      if (dashboardData?.overview) {
        return [
          {
            month: "当前周期",
            自评平均分: dashboardData.overview.self_average || 0,
            领导评分: dashboardData.overview.leader_average || 0,
            综合得分: dashboardData.overview.average_score || 0,
            完成率: dashboardData.overview.completion_rate || 0
          }
        ]
      }
      return []
    }
    
    return trendsData.monthly_trends.map(trend => ({
      month: trend.month,
      自评平均分: trend.self_average,
      领导评分: trend.leader_average,
      综合得分: trend.average_score,
      完成率: trend.completion_rate
    }))
  }

  const filteredPerformanceList = performanceList.filter(item => {
    const matchesSearch = item.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.employee.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === "all" || item.employee.department === departmentFilter
    return matchesSearch && matchesDepartment
  })

  // 获取可用部门列表
  const availableDepartments = Array.from(new Set([
    ...performanceList.map(item => item.employee.department),
    ...departmentStats.map(dept => dept.name)
  ])).filter(Boolean) // 过滤掉空值

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

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
              <span className="text-lg">正在加载报表数据...</span>
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
              <Button onClick={loadAllData}>重新加载</Button>
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
        {/* 页面标题和筛选器 */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              数据报表分析
            </h1>
            <p className="text-gray-600">深度洞察企业绩效数据，助力决策优化</p>
          </div>

          {/* 筛选器 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                数据筛选
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {/* 时间范围筛选 */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRangeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 部门筛选 */}
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
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

                {/* 搜索框 */}
                <div className="flex-1 max-w-sm relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="搜索员工或职位..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总参与人数</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardData?.overview.total_users || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">当前周期参与</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">整体完成率</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData?.overview.completion_rate?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">所有评估完成率</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均绩效分</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData?.overview.average_score?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">综合评估得分</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">活跃考核数</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {dashboardData?.overview.active_assessments || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">进行中的考核</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 绩效趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle>绩效趋势分析</CardTitle>
              <CardDescription>各维度评分随时间的变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              {processTrendsData().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processTrendsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === '完成率' ? `${(value as number).toFixed(1)}%` : `${(value as number).toFixed(1)}分`, 
                        name
                      ]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="自评平均分" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="领导评分" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="综合得分" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">暂无趋势数据</p>
                    <p className="text-xs mt-1">数据将在有历史记录后显示</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 部门绩效对比 */}
          <Card>
            <CardHeader>
              <CardTitle>部门绩效对比</CardTitle>
              <CardDescription>各部门评分和完成率对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processDepartmentData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'completionRate' ? `${(value as number).toFixed(1)}%` : `${(value as number).toFixed(1)}分`,
                      name === 'selfScore' ? '自评分' :
                      name === 'leaderScore' ? '领导评分' :
                      name === 'bossScore' ? 'Boss评分' : '完成率'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="selfScore" fill="#3b82f6" name="自评分" />
                  <Bar dataKey="leaderScore" fill="#10b981" name="领导评分" />
                  <Bar dataKey="bossScore" fill="#8b5cf6" name="Boss评分" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* 分数分布和详细数据 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* 分数分布饼图 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>绩效分数分布</CardTitle>
              <CardDescription>员工绩效等级分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    data={processScoreDistribution()}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={90}
                    dataKey="value"
                    label={({value, percent}) => {
                      // 只在扇形足够大时显示标签
                      if (percent > 0.08) { // 大于8%才显示标签
                        return `${value}人\n${(percent * 100).toFixed(1)}%`
                      }
                      return ''
                    }}
                    labelLine={false}
                    fontSize={12}
                  >
                    {processScoreDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}人`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => {
                      const data = processScoreDistribution().find(item => item.name === value)
                      return data ? `${value}: ${data.value}人` : value
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* 数据详情卡片 */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {processScoreDistribution().map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name.split('(')[0]}</span>
                    </div>
                    <span className="text-gray-600">{item.value}人</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 员工绩效列表 */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                员工绩效排行
              </CardTitle>
              <CardDescription>
                显示 {filteredPerformanceList.length} 个结果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {filteredPerformanceList.slice(0, 10).map((item, index) => (
                  <div key={item.employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.employee.name}</p>
                        <p className="text-sm text-gray-600">{item.employee.position} · {item.employee.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getScoreColor(item.scores.final_score)}`}>
                        {item.scores.final_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">最终得分</div>
                    </div>
                  </div>
                ))}
                
                {filteredPerformanceList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>暂无匹配的员工数据</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 数据统计总览 */}
        <Card>
          <CardHeader>
            <CardTitle>数据统计总览</CardTitle>
            <CardDescription>当前筛选条件下的详细统计信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">评分维度对比</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">自评平均分：</span>
                    <span className="font-medium">{dashboardData?.overview.self_average?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">领导评分：</span>
                    <span className="font-medium">{dashboardData?.overview.leader_average?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Boss评分：</span>
                    <span className="font-medium">{dashboardData?.overview.boss_average?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">完成情况</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">总评估数：</span>
                    <span className="font-medium">{dashboardData?.overview.total_evaluations || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">已完成：</span>
                    <span className="font-medium">{dashboardData?.overview.completed_assessments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">进行中：</span>
                    <span className="font-medium">{dashboardData?.overview.active_assessments || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">部门分布</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">参与部门：</span>
                    <span className="font-medium">{departmentStats.length}个</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">平均部门人数：</span>
                    <span className="font-medium">
                      {departmentStats.length > 0 ? 
                        Math.round(departmentStats.reduce((sum, dept) => sum + dept.user_count, 0) / departmentStats.length) : 0
                      }人
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">最高平均分部门：</span>
                    <span className="font-medium">
                      {processDepartmentData().sort((a, b) => b.avgScore - a.avgScore)[0]?.department || '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}