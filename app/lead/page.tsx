"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, CheckCircle, TrendingUp, AlertTriangle, Loader2, BookOpen, FileText } from "lucide-react"
import LeadHeader from "@/components/lead-header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTask,
  SubordinateTask,
  EvaluationProgress,
  evaluationUtils
} from "@/lib/evaluation"
import { assessmentService, AssessmentListItem } from "@/lib/assessment"

interface TeamMemberStats {
  user_id: number
  user_name: string
  position?: string
  department?: string
  pending_tasks: number
  completed_tasks: number
  latest_score?: number
  average_score?: number
}

export default function LeadDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [activeAssessments, setActiveAssessments] = useState<AssessmentListItem[]>([])
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [overallStats, setOverallStats] = useState({
    totalMembers: 0,
    pendingEvaluations: 0,
    teamAverageScore: 0,
    completionRate: 0
  })
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }
    
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 获取需要我评分的评估任务
      const tasksResponse = await evaluationService.getEvaluationsToGive()
      if (tasksResponse.code === 200 && tasksResponse.data) {
        setEvaluationTasks(tasksResponse.data.map(evaluation => ({
          id: `leader_${evaluation.assessment_id}_${evaluation.evaluatee_id}`,
          assessment_id: evaluation.assessment_id,
          assessment_title: `评估 #${evaluation.assessment_id}`,
          assessment_period: evaluationUtils.formatDate(evaluation.created_at),
          type: 'leader' as const,
          evaluatee_id: evaluation.evaluatee_id,
          evaluatee_name: `用户 #${evaluation.evaluatee_id}`,
          evaluatee_department: '技术部',
          status: evaluation.status === 'submitted' ? 'completed' as const : 'pending' as const,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_overdue: false,
          evaluation_id: evaluation.id,
          last_updated: evaluation.updated_at
        })))
      }

      // 获取当前活跃的考核
      const assessmentsResponse = await assessmentService.getAssessments({
        status: 'active',
        limit: 10
      })
      
      if (assessmentsResponse.code === 200 && assessmentsResponse.data) {
        setActiveAssessments(assessmentsResponse.data.items)

        // 为每个活跃考核获取详细进度
        const progressPromises = assessmentsResponse.data.items.map(async (assessment) => {
          try {
            const progressResponse = await evaluationService.getEvaluationProgress(assessment.id)
            return progressResponse.code === 200 ? progressResponse.data : null
          } catch (error) {
            console.warn(`获取考核${assessment.id}进度失败:`, error)
            return null
          }
        })

        const progressResults = await Promise.all(progressPromises)
        const validProgress = progressResults.filter(p => p !== null) as EvaluationProgress[]

        // 汇总团队统计数据
        let totalMembers = 0
        let pendingEvaluations = 0
        let totalScore = 0
        let scoreCount = 0
        let totalCompleted = 0
        let totalTasks = 0

        const memberStatsMap = new Map<number, TeamMemberStats>()

        validProgress.forEach(progress => {
          totalMembers += progress.total_participants
          pendingEvaluations += (progress.total_participants - progress.leader_completed_count)
          totalCompleted += progress.leader_completed_count
          totalTasks += progress.total_participants

          progress.participants.forEach(participant => {
            if (!memberStatsMap.has(participant.user_id)) {
              memberStatsMap.set(participant.user_id, {
                user_id: participant.user_id,
                user_name: participant.user_name,
                department: participant.department,
                pending_tasks: 0,
                completed_tasks: 0
              })
            }

            const stats = memberStatsMap.get(participant.user_id)!
            if (participant.leader_status === 'completed') {
              stats.completed_tasks += 1
            } else {
              stats.pending_tasks += 1
            }
          })
        })

        setTeamStats(Array.from(memberStatsMap.values()))
        
        const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0
        
        setOverallStats({
          totalMembers: Math.max(...validProgress.map(p => p.total_participants), 0),
          pendingEvaluations,
          teamAverageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
          completionRate
        })
      }

    } catch (error: any) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
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
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载团队数据...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">团队管理</h1>
            <p className="text-gray-600">管理您的团队绩效考核</p>
          </div>
          <Button 
            onClick={() => router.push('/lead/evaluation')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            评估中心
          </Button>
        </div>

        {/* 团队统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">团队人数</p>
                  <p className="text-2xl font-bold">{overallStats.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待我评分</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {overallStats.pendingEvaluations}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">团队平均分</p>
                  <p className="text-2xl font-bold text-green-600">
                    {overallStats.teamAverageScore > 0 ? overallStats.teamAverageScore.toFixed(1) : '--'}
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
                    {overallStats.completionRate.toFixed(0)}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 待我评分 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              待我评分
            </CardTitle>
            <CardDescription>需要您完成评分的下属考核</CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationTasks.filter(task => task.status === 'pending').length > 0 ? (
              <div className="space-y-4">
                {evaluationTasks
                  .filter(task => task.status === 'pending')
                  .map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{task.evaluatee_name}</h3>
                          <p className="text-sm text-gray-600">{task.evaluatee_department}</p>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          待评分
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{task.assessment_title}</p>
                            <p className="text-xs text-gray-500">
                              截止：{evaluationUtils.formatDate(task.deadline)} · {task.assessment_period}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/lead/evaluation/${task.assessment_id}/${task.evaluatee_id}`)}
                          >
                            开始评分
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>暂无待评分项目</p>
                <p className="text-xs mt-1">所有评分任务均已完成</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 团队成员 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              团队成员
            </CardTitle>
            <CardDescription>您的团队成员绩效概览</CardDescription>
          </CardHeader>
          <CardContent>
            {teamStats.length > 0 ? (
              <div className="space-y-4">
                {teamStats.map((member) => (
                  <div key={member.user_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{member.user_name}</h3>
                        <p className="text-sm text-gray-600">{member.department}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">最近得分</p>
                        <p className={`text-lg font-bold ${getScoreColor(member.latest_score || 0)}`}>
                          {member.latest_score?.toFixed(1) || '--'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">平均得分：</span>
                        <span className={`font-semibold ${getScoreColor(member.average_score || 0)}`}>
                          {member.average_score?.toFixed(1) || '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">待办事项：</span>
                        <span className="font-semibold">{member.pending_tasks}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => router.push(`/lead/member/${member.user_id}`)}
                    >
                      查看详情
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无团队成员</p>
                <p className="text-xs mt-1">请联系管理员分配团队成员</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
