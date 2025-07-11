"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, CheckCircle, TrendingUp, AlertTriangle, Loader2, BookOpen, FileText, Calendar } from "lucide-react"
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
import { teamService, TeamMember, teamUtils } from "@/lib/team"
import { safeParseUserInfo } from "@/lib/utils"

// 使用 team.ts 中的 TeamMember 类型

export default function LeadDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [overallStats, setOverallStats] = useState({
    totalMembers: 0,
    pendingEvaluations: 0,
    teamAverageScore: 0,
    completionRate: 0
  })
  const router = useRouter()

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      // 如果没有用户信息，重定向到登录页面
      router.push("/")
      return
    }
    
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 并行加载数据
      const [tasksResponse, teamResponse] = await Promise.all([
        evaluationService.getEvaluationsToGive(),
        teamService.getTeamMembers()
      ])

      // 处理评估任务数据
      if (tasksResponse.code === 200 && tasksResponse.data) {
        setEvaluationTasks(tasksResponse.data.map(evaluation => {
          const assessmentId = evaluation.assessment?.id
          const evaluateeId = evaluation.evaluatee?.id
          
          return {
            id: `leader_${assessmentId}_${evaluateeId}`,
            assessment_id: assessmentId,
            assessment_title: evaluation.assessment?.title || `评估 #${assessmentId}`,
            assessment_period: evaluation.assessment?.period || evaluationUtils.formatDate(evaluation.created_at),
            type: 'leader' as const,
            evaluatee_id: evaluateeId,
            evaluatee_name: evaluation.evaluatee?.name || `用户 #${evaluateeId}`,
            evaluatee_department: evaluation.evaluatee?.department?.name || '未知部门',
            status: evaluation.status === 'submitted' ? 'completed' as const : 'pending' as const,
            deadline: evaluation.assessment?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_overdue: false,
            evaluation_id: evaluation.id,
            last_updated: evaluation.updated_at
          }
        }))
      }

      // 处理团队成员数据
      if (teamResponse.code === 200 && teamResponse.data) {
        setTeamMembers(teamResponse.data.members)
        
        // 计算统计数据
        const { members, total_members, active_assessments_count, self_completed_count, leader_completed_count } = teamResponse.data
        
        // 计算平均分
        const scoresData = members
          .filter(member => member.evaluation_status.final_score !== null)
          .map(member => member.evaluation_status.final_score!)
        
        const teamAverageScore = scoresData.length > 0 
          ? scoresData.reduce((sum, score) => sum + score, 0) / scoresData.length 
          : 0
        
        // 计算完成率
        const completionRate = total_members > 0 
          ? (leader_completed_count / total_members) * 100 
          : 0
        
        setOverallStats({
          totalMembers: total_members,
          pendingEvaluations: total_members - leader_completed_count,
          teamAverageScore,
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

  const pendingTasksCount = evaluationTasks.filter(task => task.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} pendingTasksCount={pendingTasksCount} />

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
            {teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{member.user_name}</h3>
                        <p className="text-sm text-gray-600">{member.department} · {member.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">当前得分</p>
                        <p className={`text-lg font-bold ${teamUtils.getScoreColor(member.evaluation_status.final_score)}`}>
                          {member.evaluation_status.final_score?.toFixed(1) || '--'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 考核信息 */}
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {member.current_assessment.assessment_title}
                        </span>
                        <Badge className={teamUtils.getStatusColor(member)}>
                          {teamUtils.formatEvaluationStatus(member)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {member.current_assessment.period}
                        </span>
                        {member.is_historical && (
                          <span className="text-orange-600">历史考核</span>
                        )}
                        {member.has_active_assessment && teamUtils.isAssessmentOverdue(member.current_assessment) && (
                          <span className="text-red-600">已过期</span>
                        )}
                      </div>
                    </div>

                    {/* 评分状态 */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">自评状态：</span>
                        <span className={`font-semibold ${member.evaluation_status.self_completed ? 'text-green-600' : 'text-gray-400'}`}>
                          {member.evaluation_status.self_completed ? '已完成' : '未完成'}
                        </span>
                        {member.evaluation_status.self_score && (
                          <span className="ml-1 text-gray-500">
                            ({member.evaluation_status.self_score}分)
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">我的评分：</span>
                        <span className={`font-semibold ${member.evaluation_status.leader_completed ? 'text-green-600' : 'text-orange-600'}`}>
                          {member.evaluation_status.leader_completed ? '已完成' : '待评分'}
                        </span>
                        {member.evaluation_status.leader_score && (
                          <span className="ml-1 text-gray-500">
                            ({member.evaluation_status.leader_score}分)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/lead/member/${member.user_id}`)}
                      >
                        查看详情
                      </Button>
                      {member.has_active_assessment && !member.evaluation_status.leader_completed && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/lead/evaluation/${member.current_assessment.assessment_id}/${member.user_id}`)}
                        >
                          开始评分
                        </Button>
                      )}
                    </div>
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
