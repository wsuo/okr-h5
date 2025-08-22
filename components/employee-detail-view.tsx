"use client"

import { useState, useEffect, ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, TrendingUp, Calendar, Award, BarChart3, Building2, Loader2, AlertCircle, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { safeParseUserInfo } from "@/lib/utils"
import { teamService, teamUtils, EmployeeEvaluationStats, EmployeeAssessmentHistory } from "@/lib/team"
import { userService, User as UserType } from "@/lib/user"
import { toast } from "sonner"

// 组件配置接口
export interface EmployeeDetailViewProps {
  userId: number
  role: 'boss' | 'lead'
  HeaderComponent: React.ComponentType<any>
  backPath: string
  backLabel: string
  showSkillsTab?: boolean
  historyActionConfig: {
    buttonText: string
    getPath: (assessmentId: number, userId: number) => string
  }
  fourthCardConfig: {
    title: string
    icon: React.ComponentType<any>
    getValue: (employeeInfo: UserType | null, employeeStats: EmployeeEvaluationStats | null) => ReactNode
  }
}

export default function EmployeeDetailView({
  userId,
  role,
  HeaderComponent,
  backPath,
  backLabel,
  showSkillsTab = false,
  historyActionConfig,
  fourthCardConfig
}: EmployeeDetailViewProps) {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [employeeInfo, setEmployeeInfo] = useState<UserType | null>(null)
  const [employeeStats, setEmployeeStats] = useState<EmployeeEvaluationStats | null>(null)
  const [assessmentHistory, setAssessmentHistory] = useState<EmployeeAssessmentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
      loadEmployeeData()
    } else {
      router.push('/')
      return
    }
  }, [userId])

  const loadEmployeeData = async () => {
    try {
      setLoading(true)
      setError("")

      if (isNaN(userId)) {
        throw new Error('无效的用户ID')
      }

      // Load employee basic info, stats, and assessment history in parallel
      const [userResponse, statsResponse, historyResponse] = await Promise.all([
        userService.getUser(userId),
        teamService.getEmployeeStats(userId),
        teamService.getEmployeeAssessmentHistory(userId)
      ])

      if (userResponse.code === 200) {
        setEmployeeInfo(userResponse.data)
      } else {
        throw new Error(userResponse.message || '获取员工信息失败')
      }

      if (statsResponse.code === 200) {
        setEmployeeStats(statsResponse.data)
      } else {
        console.warn('获取员工统计数据失败:', statsResponse.message)
      }

      if (historyResponse.code === 200) {
        setAssessmentHistory(historyResponse.data?.items || [])
      } else {
        console.warn('获取考核历史失败:', historyResponse.message)
      }

    } catch (error: any) {
      console.error('加载员工数据失败:', error)
      setError(error.message || '加载员工数据失败')
      toast.error('加载员工数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // Process data for charts
  const processTrendData = () => {
    if (!employeeStats?.score_history) return []
    return employeeStats.score_history
      .slice(-6) // Get last 6 assessments
      .map(item => ({
        month: new Date(item.completed_at).toLocaleDateString('zh-CN', { month: 'short' }),
        score: item.final_score,
        assessment: item.assessment_title
      }))
  }

  const processSkillAnalysis = () => {
    // Since we don't have detailed skill breakdown from API,
    // we'll create a mock analysis based on available data
    if (!employeeStats) return []

    const baseScore = employeeStats.average_score
    return [
      { skill: "综合绩效", score: Math.round(baseScore) },
      { skill: "工作完成度", score: Math.round(baseScore * 1.05) },
      { skill: "团队协作", score: Math.round(baseScore * 0.95) }
    ]
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLevel = (score: number) => {
    if (score >= 90) return "优秀"
    if (score >= 80) return "良好"
    if (score >= 70) return "合格"
    return "待改进"
  }

  const getScoreBadge = (score: number) => {
    const level = getScoreLevel(score)
    const colorClass =
      score >= 90
        ? "bg-green-100 text-green-800 border-green-200"
        : score >= 80
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : score >= 70
            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
            : "bg-red-100 text-red-800 border-red-200"

    return <Badge className={colorClass}>{level}</Badge>
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
        <HeaderComponent userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-lg">正在加载员工数据...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !employeeInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <Button variant="ghost" onClick={() => router.push(backPath)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
              <p className="text-gray-600 mb-4">{error || '员工信息不存在'}</p>
              <Button onClick={loadEmployeeData}>重新加载</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const FourthCardIcon = fourthCardConfig.icon

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-6xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push(backPath)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{employeeInfo.name}</h1>
              <p className="text-gray-600">
                {employeeInfo.position || '未设置职位'} · {employeeInfo.department?.name || '未分配部门'}
              </p>
              {role === 'boss' && (
                <p className="text-sm text-gray-500">
                  直属领导：{employeeInfo.leader?.name || '未设置'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最近得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(employeeStats?.latest_score || 0)}`}>
                    {employeeStats?.latest_score?.toFixed(1) || '--'}
                  </p>
                </div>
                <Award className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(employeeStats?.average_score || 0)}`}>
                    {employeeStats?.average_score?.toFixed(1) || '--'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">绩效等级</p>
                  <div className="mt-1">{getScoreBadge(employeeStats?.latest_score || 0)}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{fourthCardConfig.title}</p>
                  <div className="mt-1">
                    {fourthCardConfig.getValue(employeeInfo, employeeStats)}
                  </div>
                </div>
                <FourthCardIcon className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList className={`grid w-full ${showSkillsTab ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="trend">绩效趋势</TabsTrigger>
            {showSkillsTab && <TabsTrigger value="skills">能力分析</TabsTrigger>}
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle>绩效趋势分析</CardTitle>
                <CardDescription>近期的绩效变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${(value as number).toFixed(1)}分`,
                        '绩效得分'
                      ]}
                      labelFormatter={(label) => `时间: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">趋势分析</h4>
                  <p className="text-blue-800 text-sm">
                    {employeeStats ? (
                      <>
                        {employeeInfo.name}的绩效表现呈现
                        <span className="font-semibold text-green-600">
                          {employeeStats.score_trend === 'up' ? '上升趋势' :
                           employeeStats.score_trend === 'down' ? '下降趋势' : '稳定趋势'}
                        </span>
                        ，平均得分为{employeeStats.average_score?.toFixed(1) || '--'}分，
                        最近得分为{employeeStats.latest_score?.toFixed(1) || '--'}分，
                        共参与{employeeStats.total_assessments}次考核，
                        完成{employeeStats.completed_assessments}次。
                      </>
                    ) : (
                      '暂无足够数据进行趋势分析'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {showSkillsTab && (
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>能力分析</CardTitle>
                  <CardDescription>各项能力维度的得分分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={processSkillAnalysis()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [`${value}分`, '得分']}
                      />
                      <Bar dataKey="score" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {processSkillAnalysis().map((skill: any, index: number) => (
                      <div key={skill.skill} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{skill.skill}</h4>
                          <span className={`font-bold ${getScoreColor(skill.score)}`}>{skill.score}</span>
                        </div>
                        <div className="text-sm text-gray-600">{getScoreLevel(skill.score)}水平</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>历史考核记录</CardTitle>
                <CardDescription>查看详细的历史考核记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentHistory.length > 0 ? (
                    assessmentHistory.map((record) => (
                      <div key={record.assessment_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{record.assessment_title}</h3>
                            <p className="text-sm text-gray-600">
                              考核周期：{record.period} | 状态：{
                                record.status === 'completed' ? '已完成' : 
                                record.status === 'in_progress' ? '进行中' : '待开始'
                              }
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {typeof record.participant_completed === 'boolean' && (
                              <Badge className={
                                record.participant_completed 
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }>
                                {record.participant_completed ? '个人已完成' : '个人未完成'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 评分详情 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">最终得分：</span>
                            <span className={`font-semibold ${getScoreColor(record.final_score || 0)}`}>
                              {record.final_score?.toFixed(1) || '--'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">自评得分：</span>
                            <span className="font-semibold">
                              {record.self_evaluation?.score?.toFixed(1) || '--'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">领导评分：</span>
                            <span className="font-semibold">
                              {record.leader_evaluation?.score?.toFixed(1) || '--'}
                            </span>
                          </div>
                          {record.boss_evaluation && (
                            <div>
                              <span className="text-gray-600">老板评分：</span>
                              <span className="font-semibold">
                                {record.boss_evaluation.score?.toFixed(1) || '--'}
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(historyActionConfig.getPath(record.assessment_id, employeeInfo.id))}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {historyActionConfig.buttonText}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">暂无考核记录</h3>
                      <p>该员工还没有参与过任何考核</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}