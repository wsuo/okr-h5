"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, TrendingUp, Calendar, Award, BarChart3, Loader2, Eye } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import LeadHeader from "@/components/lead-header"
import { safeParseUserInfo } from "@/lib/utils"
import { teamService, teamUtils, EmployeeAssessmentHistory, EmployeeEvaluationStats } from "@/lib/team"
import { evaluationService } from "@/lib/evaluation"
import { toast } from "sonner"

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [memberInfo, setMemberInfo] = useState<any>(null)
  const [employeeStats, setEmployeeStats] = useState<EmployeeEvaluationStats | null>(null)
  const [assessmentHistory, setAssessmentHistory] = useState<EmployeeAssessmentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const userId = parseInt(params.id as string)

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }

    loadEmployeeData()
  }, [params.id])

  const loadEmployeeData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (isNaN(userId)) {
        throw new Error('无效的用户ID')
      }

      // 并行加载数据
      const [statsResponse, historyResponse] = await Promise.allSettled([
        teamService.getEmployeeStats(userId),
        teamService.getEmployeeAssessmentHistory(userId)
      ])

      // 处理统计数据
      if (statsResponse.status === 'fulfilled' && statsResponse.value.code === 200) {
        setEmployeeStats(statsResponse.value.data)
      } else {
        console.warn('获取员工统计数据失败:', statsResponse.status === 'rejected' ? statsResponse.reason : statsResponse.value)
      }

      // 处理历史数据
      if (historyResponse.status === 'fulfilled' && historyResponse.value.code === 200) {
        setAssessmentHistory(historyResponse.value.data)
      } else {
        console.warn('获取员工历史数据失败:', historyResponse.status === 'rejected' ? historyResponse.reason : historyResponse.value)
      }

      // 生成基本成员信息（如果没有从API获取到）
      if (!employeeStats) {
        const basicInfo = {
          id: userId,
          name: `员工 #${userId}`,
          position: '职位未知',
          department: '部门未知',
          joinDate: '入职日期未知',
          currentScore: 0,
          avgScore: 0,
          trend: 'stable' as const,
        }
        setMemberInfo(basicInfo)
      }

    } catch (error: any) {
      console.error('加载员工数据失败:', error)
      setError(error.message || '加载数据失败')
      toast.error('加载数据失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setLoading(false)
    }
  }

  // 当有统计数据时，生成成员信息
  useEffect(() => {
    if (employeeStats) {
      // 安全地生成趋势数据
      const trendData = employeeStats.score_history && employeeStats.score_history.length > 0 
        ? employeeStats.score_history.slice(-6).map((item, index) => ({
            month: `${index + 1}月`,
            score: item.final_score,
            assessment_title: item.assessment_title
          }))
        : []

      setMemberInfo({
        id: employeeStats.user_id,
        name: employeeStats.user_name,
        position: '职位信息', // 这里可能需要从其他接口获取
        department: '部门信息', // 这里可能需要从其他接口获取
        joinDate: '入职日期', // 这里可能需要从其他接口获取
        currentScore: employeeStats.latest_score,
        avgScore: employeeStats.average_score,
        trend: employeeStats.score_trend,
        historyRecords: employeeStats.score_history && employeeStats.score_history.length > 0
          ? employeeStats.score_history.map(item => ({
              id: item.assessment_id.toString(),
              title: item.assessment_title,
              finalScore: item.final_score,
              selfScore: null, // 需要额外获取
              leaderScore: null, // 需要额外获取
              date: item.completed_at,
              status: 'completed' as const,
            }))
          : [],
        trendData,
      })
    }
  }, [employeeStats])

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
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">加载用户信息...</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载员工信息...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <Button variant="ghost" onClick={() => router.push("/lead")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <User className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadEmployeeData}>重试</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!memberInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <Button variant="ghost" onClick={() => router.push("/lead")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600">未找到员工信息</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-6xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/lead")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{memberInfo.name}</h1>
              <p className="text-gray-600">
                {memberInfo.position} · {memberInfo.department}
              </p>
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
                  <p className={`text-2xl font-bold ${getScoreColor(memberInfo.currentScore)}`}>
                    {memberInfo.currentScore}
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
                  <p className={`text-2xl font-bold ${getScoreColor(memberInfo.avgScore)}`}>{memberInfo.avgScore}</p>
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
                  <div className="mt-1">{getScoreBadge(memberInfo.currentScore)}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">入职时间</p>
                  <p className="text-sm font-medium">{memberInfo.joinDate}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trend">绩效趋势</TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle>绩效趋势分析</CardTitle>
                <CardDescription>近三个月的绩效变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                {memberInfo.trendData && memberInfo.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={memberInfo.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>暂无绩效趋势数据</p>
                    <p className="text-xs mt-1">该员工尚未有足够的评估记录生成趋势图</p>
                  </div>
                )}

                {memberInfo.trendData && memberInfo.trendData.length >= 3 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">趋势分析</h4>
                    <p className="text-blue-800 text-sm">
                      {memberInfo.name}在近期的绩效表现呈现
                      <span className="font-semibold text-green-600">
                        {memberInfo.trendData[memberInfo.trendData.length - 1].score >= memberInfo.trendData[0].score ? '上升趋势' : '下降趋势'}
                      </span>， 从{memberInfo.trendData[0].month}的
                      {memberInfo.trendData[0].score}分到{memberInfo.trendData[memberInfo.trendData.length - 1].month}的{memberInfo.trendData[memberInfo.trendData.length - 1].score}分， 
                      {memberInfo.trendData[memberInfo.trendData.length - 1].score >= memberInfo.trendData[0].score ? '提升了' : '下降了'}
                      {Math.abs(memberInfo.trendData[memberInfo.trendData.length - 1].score - memberInfo.trendData[0].score).toFixed(1)}分，
                      表现出{memberInfo.trendData[memberInfo.trendData.length - 1].score >= memberInfo.trendData[0].score ? '良好的成长性' : '需要关注的下降趋势'}。
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>历史考核记录</CardTitle>
                <CardDescription>查看详细的历史考核记录和评估对比</CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {assessmentHistory.map((assessment) => (
                      <div key={assessment.assessment_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{assessment.assessment_title}</h3>
                            <p className="text-sm text-gray-600">
                              考核期间：{teamUtils.formatDate(assessment.start_date)} - {teamUtils.formatDate(assessment.end_date)}
                            </p>
                            <p className="text-xs text-gray-500">{assessment.period}</p>
                          </div>
                          <Badge className={
                            assessment.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                            assessment.status === 'in_progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }>
                            {assessment.status === 'completed' ? '已完成' : 
                             assessment.status === 'in_progress' ? '进行中' : '待开始'}
                          </Badge>
                        </div>

                        {/* 评估状态 */}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-600">自评状态：</span>
                            <span className={`font-semibold ml-1 ${assessment.self_evaluation.completed ? 'text-green-600' : 'text-gray-400'}`}>
                              {assessment.self_evaluation.completed ? '已完成' : '未完成'}
                            </span>
                            {assessment.self_evaluation.score && (
                              <span className="ml-1 text-gray-500">
                                ({assessment.self_evaluation.score}分)
                              </span>
                            )}
                            {assessment.self_evaluation.completed_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                完成时间：{teamUtils.formatDateTime(assessment.self_evaluation.completed_at)}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-600">领导评分：</span>
                            <span className={`font-semibold ml-1 ${assessment.leader_evaluation.completed ? 'text-green-600' : 'text-orange-600'}`}>
                              {assessment.leader_evaluation.completed ? '已完成' : '待评分'}
                            </span>
                            {assessment.leader_evaluation.score && (
                              <span className="ml-1 text-gray-500">
                                ({assessment.leader_evaluation.score}分)
                              </span>
                            )}
                            {assessment.leader_evaluation.completed_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                完成时间：{teamUtils.formatDateTime(assessment.leader_evaluation.completed_at)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 最终得分 */}
                        {assessment.final_score && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-900">最终得分</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${teamUtils.getScoreColor(assessment.final_score)}`}>
                                  {assessment.final_score.toFixed(1)}分
                                </span>
                                {assessment.final_level && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                    {assessment.final_level}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex gap-2">
                          {assessment.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/lead/evaluation/result/${assessment.assessment_id}?userId=${userId}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              查看对比
                            </Button>
                          )}
                          {assessment.status === 'in_progress' && !assessment.leader_evaluation.completed && (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/lead/evaluation/${assessment.assessment_id}/${userId}`)}
                            >
                              继续评分
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>暂无历史考核记录</p>
                    <p className="text-xs mt-1">该员工尚未参与任何考核</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
