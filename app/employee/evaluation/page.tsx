"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Calendar, User, Loader2, FileText } from "lucide-react"
import EmployeeHeader from "@/components/employee-header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTask,
  Evaluation,

  evaluationUtils
} from "@/lib/evaluation"
import { assessmentService, AssessmentListItem } from "@/lib/assessment"
import { userService, AssessmentHistory } from "@/lib/user"
import { safeParseUserInfo } from "@/lib/utils"

// 评估状态分类接口
interface EvaluationStatus {
  selfOnly: AssessmentHistory[]         // 只完成自评
  selfLeader: AssessmentHistory[]       // 完成自评+领导评价
  allCompleted: AssessmentHistory[]     // 全部完成（包括Boss评价）
}

export default function EmployeeEvaluationCenter() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [evaluationHistory, setEvaluationHistory] = useState<Evaluation[]>([])
  const [completedAssessments, setCompletedAssessments] = useState<AssessmentListItem[]>([])
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus>({
    selfOnly: [],
    selfLeader: [],
    allCompleted: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const [completedSubTab, setCompletedSubTab] = useState("self_only") // 新增：已完成的子tab状态
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

      // 并行加载评估任务、历史记录和三种完成状态的评估记录
      const [tasksResponse, historyResponse, completedAssessmentsResponse, selfOnlyResponse, selfLeaderResponse, allCompletedResponse] = await Promise.all([
        evaluationService.getMyEvaluationTasks(),
        evaluationService.getEvaluations({ type: 'self' }),
        assessmentService.getAssessments({ status: 'completed' }),
        // 使用新的completion_stage参数获取不同完成阶段的数据
        userService.getAssessmentsHistory({ completion_stage: 'self_only' }),
        userService.getAssessmentsHistory({ completion_stage: 'self_leader' }),
        userService.getAssessmentsHistory({ completion_stage: 'all_completed' })
      ])

      // 处理评估任务
      if (tasksResponse.code === 200 && tasksResponse.data) {
        const tasks = tasksResponse.data.map((t: EvaluationTask) => ({
          ...t,
          is_overdue: t?.deadline ? evaluationUtils.isOverdue(t.deadline) : false,
        }))
        setEvaluationTasks(tasks)
      }

      // 处理评估历史
      if (historyResponse.code === 200 && historyResponse.data) {
        // Handle the API response structure: {code, message, data: {items: [...]}}
        let historyData: Evaluation[] = []
        if (historyResponse.data) {
          if (Array.isArray(historyResponse.data)) {
            // Direct array
            historyData = historyResponse.data
          } else if (historyResponse.data.items && Array.isArray(historyResponse.data.items)) {
            // Paginated response with items array
            historyData = historyResponse.data.items
          }
        }
        setEvaluationHistory(historyData)
      }

      // 处理三种完成状态的评估记录
      const parseAssessmentResponse = (response: any) => {
        if (response.code === 200 && response.data) {
          if (Array.isArray(response.data)) {
            return response.data
          } else if (response.data.items && Array.isArray(response.data.items)) {
            return response.data.items
          }
        }
        return []
      }

      setEvaluationStatus({
        selfOnly: parseAssessmentResponse(selfOnlyResponse),
        selfLeader: parseAssessmentResponse(selfLeaderResponse),
        allCompleted: parseAssessmentResponse(allCompletedResponse)
      })

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

    } catch (error: any) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/employee')
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

  const getEvaluationStatusBadge = (evaluation: Evaluation) => {
    const style = evaluationUtils.getStatusStyle(evaluation.status)
    const text = evaluationUtils.getStatusText(evaluation.status)
    return <Badge className={style}>{text}</Badge>
  }

  const filteredTasks = evaluationTasks.filter(task => {
    switch (activeTab) {
      case 'pending':
        return task.status === 'pending' || task.status === 'in_progress'
      case 'completed':
        return task.status === 'completed'
      case 'overdue':
        return task.is_overdue
      default:
        return true
    }
  })

  const filteredHistory = evaluationHistory

  const getTabCount = (tab: string) => {
    let count = 0
    switch (tab) {
      case 'pending':
        count = evaluationTasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length
        break
      case 'completed':
        count = evaluationStatus.selfOnly.length + evaluationStatus.selfLeader.length + evaluationStatus.allCompleted.length + completedAssessments.length
        break
      case 'overdue':
        count = evaluationTasks.filter(task => task.is_overdue).length
        break
      default:
        count = 0
    }
    
    return count
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
        <div className="container mx-auto p-4 max-w-6xl">
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
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回个人中心
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">评估中心</h1>
            <p className="text-gray-600">您的所有评估任务和历史记录</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              待处理
              {getTabCount('pending') > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getTabCount('pending')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              已完成
              {getTabCount('completed') > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {getTabCount('completed')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              已逾期
              {getTabCount('overdue') > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {getTabCount('overdue')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              历史记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  待处理的评估任务
                </CardTitle>
                <CardDescription>
                  您需要完成的评估任务，请按时完成以免影响绩效评估
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{task.assessment_title}</h3>
                            <p className="text-sm text-gray-600">{task.assessment_period}</p>
                          </div>
                          {getTaskStatusBadge(task)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>截止：{evaluationUtils.formatDate(task.deadline)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>被评估人：{task.evaluatee_name}</span>
                          </div>
                        </div>
                        
                        {task.is_overdue && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">任务已逾期</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                              请尽快完成评估，逾期可能影响绩效评估结果
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {task.last_updated && (
                              <span>最后更新：{evaluationUtils.formatDateTime(task.last_updated)}</span>
                            )}
                          </div>
                          {/* 逾期则不允许进入评估，隐藏按钮 */}
                          {!task.is_overdue && (
                            <Button
                              onClick={() => router.push(`/employee/evaluation/${task.assessment_id}`)}
                              size="sm"
                            >
                              {task.status === 'in_progress' ? '继续评估' : '开始评估'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无待处理任务</h3>
                    <p>所有评估任务均已完成</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {/* 已完成的子分类 */}
            <Tabs value={completedSubTab} onValueChange={setCompletedSubTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="self_only" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  已完成自评
                  {evaluationStatus.selfOnly.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {evaluationStatus.selfOnly.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="self_leader" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  领导已完成评价
                  {evaluationStatus.selfLeader.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {evaluationStatus.selfLeader.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all_completed" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  已全部完成
                  {evaluationStatus.allCompleted.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {evaluationStatus.allCompleted.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="self_only" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      已完成自评
                    </CardTitle>
                    <CardDescription>
                      只完成了自评，等待领导评分
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {evaluationStatus.selfOnly.length > 0 ? (
                      <div className="space-y-4">
                        {evaluationStatus.selfOnly.map((assessment) => (
                          <div key={assessment.assessment_id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{assessment.assessment_title}</h3>
                                <p className="text-sm text-gray-600">{assessment.period}</p>
                              </div>
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                待领导评分
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>期间：{assessment.period}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>自评分：{assessment.self_evaluation?.score || '--'}</span>
                              </div>
                            </div>

                            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                              <div className="flex items-center gap-2 text-blue-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">自评已完成</span>
                              </div>
                              <p className="text-sm text-blue-600 mt-1">
                                完成时间：{assessment.self_evaluation?.submitted_at ? evaluationUtils.formatDateTime(assessment.self_evaluation.submitted_at) : '--'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                当前得分：{assessment.current_employee_score ? Number(assessment.current_employee_score).toFixed(1) : assessment.self_evaluation?.score ? Number(assessment.self_evaluation.score).toFixed(1) : '--'}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/employee/evaluation/result/${assessment.assessment_id}`)}
                              >
                                查看详情
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">暂无只完成自评的评估</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="self_leader" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      领导已完成评价
                    </CardTitle>
                    <CardDescription>
                      完成了自评+领导评价，等待老板评分（如需要）
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {evaluationStatus.selfLeader.length > 0 ? (
                      <div className="space-y-4">
                        {evaluationStatus.selfLeader.map((assessment) => (
                          <div key={assessment.assessment_id} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{assessment.assessment_title}</h3>
                                <p className="text-sm text-gray-600">{assessment.period}</p>
                              </div>
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                {assessment.boss_evaluation?.required ? '待老板评分' : '已完成'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>自评分：{assessment.self_evaluation?.score || '--'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>领导评分：{assessment.leader_evaluation?.score || '--'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>期间：{assessment.period}</span>
                              </div>
                            </div>

                            <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                              <div className="flex items-center gap-2 text-orange-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">自评+领导评价已完成</span>
                              </div>
                              <p className="text-sm text-orange-600 mt-1">
                                领导评价完成时间：{assessment.leader_evaluation?.submitted_at ? evaluationUtils.formatDateTime(assessment.leader_evaluation.submitted_at) : '--'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                当前得分：{assessment.current_employee_score ? Number(assessment.current_employee_score).toFixed(1) : '--'}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/employee/evaluation/result/${assessment.assessment_id}`)}
                              >
                                查看详情
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">暂无完成自评+领导评价的评估</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all_completed" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      已全部完成
                    </CardTitle>
                    <CardDescription>
                      完成了自评+领导评价+老板评分的完整评估
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {evaluationStatus.allCompleted.length > 0 ? (
                      <div className="space-y-4">
                        {evaluationStatus.allCompleted.map((assessment) => (
                          <div key={assessment.assessment_id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{assessment.assessment_title}</h3>
                                <p className="text-sm text-gray-600">{assessment.period}</p>
                              </div>
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                已完成
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>自评：{assessment.self_evaluation?.score || '--'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>领导：{assessment.leader_evaluation?.score || '--'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>老板：{assessment.boss_evaluation?.score || '--'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>期间：{assessment.period}</span>
                              </div>
                            </div>

                            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">所有评估已完成</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-green-600 mt-2">
                                <div>
                                  <span>最终分数：</span>
                                  <span className="font-medium">{assessment.final_score ? Number(assessment.final_score).toFixed(1) : '--'}</span>
                                </div>
                                <div>
                                  <span>等级：</span>
                                  <span className="font-medium">{assessment.final_level || '--'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                完成时间：{assessment.boss_evaluation?.submitted_at ? evaluationUtils.formatDateTime(assessment.boss_evaluation.submitted_at) : '--'}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/employee/evaluation/result/${assessment.assessment_id}`)}
                              >
                                查看结果
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">暂无全部完成的评估</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  已逾期的评估任务
                </CardTitle>
                <CardDescription>
                  超过截止时间的评估任务，请尽快完成
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{task.assessment_title}</h3>
                            <p className="text-sm text-gray-600">{task.assessment_period}</p>
                          </div>
                          {getTaskStatusBadge(task)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-red-600">
                            逾期时间：{evaluationUtils.formatDate(task.deadline)}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => router.push(`/employee/evaluation/${task.assessment_id}`)}
                          >
                            立即完成
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-medium mb-2">没有逾期任务</h3>
                    <p>所有任务都按时完成了</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  评估历史记录
                </CardTitle>
                <CardDescription>
                  您的所有评估记录和结果
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredHistory.length > 0 ? (
                  <div className="space-y-4">
                    {filteredHistory.map((evaluation) => (
                      <div key={evaluation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {evaluation.assessment?.title || `评估 #${evaluation.assessment?.id || evaluation.assessment_id || '未知'}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {evaluation.assessment?.period || evaluationUtils.formatDate(evaluation.created_at)}
                            </p>
                          </div>
                          {getEvaluationStatusBadge(evaluation)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>创建时间：{evaluationUtils.formatDate(evaluation.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>类型：{evaluationUtils.getTypeText(evaluation.type)}</span>
                          </div>
                        </div>

                        {/* 评分信息 */}
                        <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-100">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">评分结果</span>
                            </div>
                            {evaluation.score && (
                              <div className="text-lg font-bold text-green-700">
                                {typeof evaluation.score === 'number' ? evaluation.score.toFixed(2) : evaluation.score}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-green-600">
                            <div>
                              <span>提交时间：</span>
                              <span className="font-medium">
                                {evaluation.submitted_at ? evaluationUtils.formatDateTime(evaluation.submitted_at) : '--'}
                              </span>
                            </div>
                            <div>
                              <span>状态：</span>
                              <span className="font-medium">{evaluationUtils.getStatusText(evaluation.status)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 评估反馈 */}
                        {(evaluation.self_review || evaluation.strengths || evaluation.improvements) && (
                          <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                            <div className="text-blue-700 font-medium mb-2">评估反馈</div>
                            <div className="space-y-2 text-sm text-blue-600">
                              {evaluation.self_review && (
                                <div>
                                  <span className="font-medium">自评：</span>
                                  <span>{evaluation.self_review}</span>
                                </div>
                              )}
                              {evaluation.strengths && (
                                <div>
                                  <span className="font-medium">优势：</span>
                                  <span>{evaluation.strengths}</span>
                                </div>
                              )}
                              {evaluation.improvements && (
                                <div>
                                  <span className="font-medium">改进：</span>
                                  <span>{evaluation.improvements}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            更新时间：{evaluationUtils.formatDateTime(evaluation.updated_at)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const assessmentId = evaluation.assessment?.id || evaluation.assessment_id
                              if (assessmentId) {
                                router.push(`/employee/evaluation/result/${assessmentId}`)
                              } else {
                                toast.error('无法查看详情', {
                                  description: '评估记录缺少必要信息'
                                })
                              }
                            }}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无历史记录</h3>
                    <p>完成评估后将在此显示历史记录</p>
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
