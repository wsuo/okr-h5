"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, AlertCircle, TrendingUp, Calendar, User, Loader2, BookOpen, FileText } from "lucide-react"
import EmployeeHeader from "@/components/employee-header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTask,
  EvaluationComparison,
  evaluationUtils
} from "@/lib/evaluation"
import { assessmentService, AssessmentListItem } from "@/lib/assessment"
import { safeParseUserInfo } from "@/lib/utils"

interface EvaluationHistory {
  assessment_id: number
  assessment_title: string
  assessment_period: string
  final_score?: number
  self_score?: number
  leader_score?: number
  completed_at: string
  comparison?: EvaluationComparison
}

interface EvaluationStatus {
  selfOnly: EvaluationTask[]  // 只完成自评
  fullCompleted: EvaluationTask[]  // 全部完成
}

export default function EmployeeDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationHistory[]>([])
  const [completedAssessments, setCompletedAssessments] = useState<AssessmentListItem[]>([])
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus>({
    selfOnly: [],
    fullCompleted: []
  })
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    latestScore: 0,
    averageScore: 0,
    pendingCount: 0
  })
  const router = useRouter()

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }
    
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // 获取我的评估任务和已完成考核
      const [tasksResponse, completedAssessmentsResponse] = await Promise.all([
        evaluationService.getMyEvaluationTasks(),
        assessmentService.getAssessments({ status: 'completed' })
      ])
      if (tasksResponse.code === 200 && tasksResponse.data) {
        const tasks = tasksResponse.data.map((t: EvaluationTask) => ({
          ...t,
          is_overdue: t?.deadline ? evaluationUtils.isOverdue(t.deadline) : false,
        }))
        setEvaluationTasks(tasks)
        
        // 计算待处理任务数量
        const pendingCount = tasksResponse.data.filter(task => 
          task.status === 'pending' || task.status === 'in_progress'
        ).length
        
        // 分类已完成的评估任务
        const completedTasks = tasksResponse.data.filter(task => task.status === 'completed')
        
        // 为已完成任务获取对比数据，判断是否全部完成
        const statusPromises = completedTasks.map(async (task) => {
          try {
            const comparisonResponse = await evaluationService.getEvaluationComparison(
              task.assessment_id, 
              task.evaluatee_id
            )
            
            if (comparisonResponse.code === 200 && comparisonResponse.data) {
              const comparison = comparisonResponse.data
              // 如果有领导评分，则是全部完成；否则只是自评完成
              const hasLeaderEvaluation = comparison.leader_evaluation && comparison.leader_evaluation.score
              return {
                task,
                isFullCompleted: hasLeaderEvaluation,
                comparison
              }
            }
          } catch (error) {
            console.warn(`获取任务${task.id}对比数据失败:`, error)
          }
          
          return {
            task,
            isFullCompleted: false,
            comparison: undefined
          }
        })
        
        const statusResults = await Promise.all(statusPromises)
        
        const selfOnly = statusResults.filter(result => !result.isFullCompleted).map(result => result.task)
        const fullCompleted = statusResults.filter(result => result.isFullCompleted).map(result => result.task)
        
        setEvaluationStatus({ selfOnly, fullCompleted })
        setStats(prev => ({ ...prev, pendingCount }))
      }

      // 处理已完成考核
      if (completedAssessmentsResponse.code === 200 && completedAssessmentsResponse.data) {
        // Handle the API response structure: {code, message, data: {items: [...]}}
        let assessmentsData: AssessmentListItem[] = []
        if (completedAssessmentsResponse.data) {
          if (Array.isArray(completedAssessmentsResponse.data)) {
            // Direct array
            assessmentsData = completedAssessmentsResponse.data
          } else if (completedAssessmentsResponse.data.items && Array.isArray(completedAssessmentsResponse.data.items)) {
            // Paginated response with items array
            assessmentsData = completedAssessmentsResponse.data.items
          }
        }
        setCompletedAssessments(assessmentsData)
      }

      // 计算统计数据（从已完成的评估中获取）
      const allCompleted = [...evaluationStatus.selfOnly, ...evaluationStatus.fullCompleted]
      if (allCompleted.length > 0) {
        // 为统计数据获取对比信息
        const scorePromises = allCompleted.map(async (task) => {
          try {
            const comparisonResponse = await evaluationService.getEvaluationComparison(
              task.assessment_id, 
              task.evaluatee_id
            )
            
            if (comparisonResponse.code === 200 && comparisonResponse.data) {
              const comparison = comparisonResponse.data
              return comparison.leader_evaluation?.score || comparison.self_evaluation?.score || 0
            }
          } catch (error) {
            console.warn(`获取任务${task.id}得分失败:`, error)
          }
          return 0
        })
        
        const scores = await Promise.all(scorePromises)
        const validScores = scores.filter(score => score > 0)
        
        if (validScores.length > 0) {
          const latestScore = validScores[0]  // 第一个有效得分
          const averageScore = validScores.reduce((sum, score) => sum + score, 0) / validScores.length
          
          setStats(prev => ({
            ...prev,
            latestScore,
            averageScore
          }))
        }
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

  const getScoreLevel = (score: number) => {
    if (score >= 90) return "优秀"
    if (score >= 80) return "良好"
    if (score >= 70) return "合格"
    return "待改进"
  }

  const getTaskStatusBadge = (task: EvaluationTask) => {
    if (task.is_overdue) {
      return <Badge variant="outline" className="text-red-600 border-red-600">已逾期</Badge>
    }
    
    switch (task.status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">待处理</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">进行中</Badge>
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">已完成</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
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
        <EmployeeHeader userInfo={userInfo} />
        <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载评估数据...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader userInfo={userInfo} />

      <div className="container mx-auto p-2 sm:p-4 max-w-4xl">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">我的绩效中心</h1>
            <p className="text-gray-600">查看和管理您的绩效考核</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="text-sm text-gray-500">
              总共 {evaluationStatus.selfOnly.length + completedAssessments.length} 个评估记录
            </div>
            <Button
              onClick={() => router.push('/employee/evaluation')}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 mr-2" />
              评估中心
            </Button>
          </div>
        </div>

        {/* 个人统计 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最近得分</p>
                  <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(stats.latestScore)}`}>
                    {stats.latestScore > 0 ? stats.latestScore.toFixed(1) : '--'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.latestScore > 0 ? getScoreLevel(stats.latestScore) : '暂无数据'}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '--'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.averageScore > 0 ? getScoreLevel(stats.averageScore) : '暂无数据'}
                  </p>
                </div>
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待办事项</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
                  <p className="text-xs text-gray-500">需处理</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 待办事项 */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              待办事项
            </CardTitle>
            <CardDescription>需要您完成的绩效考核任务</CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationTasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length > 0 ? (
              <div className="space-y-4">
                {evaluationTasks
                  .filter(task => task.status === 'pending' || task.status === 'in_progress')
                  .map((task) => (
                  <div key={task.id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <h3 className="font-semibold">{task.assessment_title}</h3>
                      {getTaskStatusBadge(task)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        截止：{evaluationUtils.formatDate(task.deadline)}
                      </span>
                      <span>·</span>
                      <span>{task.assessment_period}</span>
                      {task.is_overdue && (
                        <>
                          <span>·</span>
                          <span className="text-red-600 font-medium">已逾期</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm text-gray-600">
                        类型: {evaluationUtils.getTypeText(task.type)} • 
                        被评估人: {task.evaluatee_name}
                      </div>
                      {/* 逾期则不允许进入评估，隐藏按钮 */}
                      {!task.is_overdue && (
                        <Button 
                          onClick={() => router.push(`/employee/evaluation/${task.assessment_id}`)} 
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {task.status === 'in_progress' ? '继续评分' : '开始评分'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>暂无待办事项</p>
                <p className="text-xs mt-1">所有评估任务均已完成</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 评估状态 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* 已完成自评 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                已完成自评
              </CardTitle>
              <CardDescription>等待领导评分的评估</CardDescription>
            </CardHeader>
            <CardContent>
              {evaluationStatus.selfOnly.length > 0 ? (
                <div className="space-y-3">
                  {evaluationStatus.selfOnly.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3 bg-blue-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <h3 className="font-semibold text-sm">{task.assessment_title}</h3>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          待领导评分
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {task.assessment_period} • 自评已完成
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">
                          提交时间：{task.last_updated && evaluationUtils.formatDateTime(task.last_updated)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/employee/evaluation/result/${task.assessment_id}`)}
                          className="w-full sm:w-auto"
                        >
                          查看详情
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无等待领导评分的评估</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 已完成全部 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                已完成全部
              </CardTitle>
              <CardDescription>自评和领导评分都已完成</CardDescription>
            </CardHeader>
            <CardContent>
              {completedAssessments.length > 0 ? (
                <div className="space-y-3">
                  {completedAssessments.slice(0, 3).map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-3 bg-green-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <h3 className="font-semibold text-sm">{assessment.title}</h3>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          已完成
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {assessment.period} • 考核已完成
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">
                          完成时间：{assessment.updated_at && evaluationUtils.formatDateTime(assessment.updated_at)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/employee/evaluation/result/${assessment.id}`)}
                          className="w-full sm:w-auto"
                        >
                          查看结果
                        </Button>
                      </div>
                    </div>
                  ))}

                  {completedAssessments.length > 3 && (
                    <div className="text-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/employee/evaluation')}
                        className="text-xs"
                      >
                        查看更多 ({completedAssessments.length - 3})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无完成的评估</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
