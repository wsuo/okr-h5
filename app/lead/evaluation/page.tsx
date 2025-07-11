"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Search, Calendar, User, Loader2, FileText, Users, BarChart3 } from "lucide-react"
import LeadHeader from "@/components/lead-header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTask,
  Evaluation,
  EvaluationProgress,
  evaluationUtils
} from "@/lib/evaluation"
import { assessmentService, AssessmentListItem } from "@/lib/assessment"
import { safeParseUserInfo } from "@/lib/utils"

export default function LeadEvaluationCenter() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [evaluationHistory, setEvaluationHistory] = useState<Evaluation[]>([])
  const [activeAssessments, setActiveAssessments] = useState<AssessmentListItem[]>([])
  const [assessmentProgress, setAssessmentProgress] = useState<Record<number, EvaluationProgress>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedAssessment, setSelectedAssessment] = useState<string>("all")
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

      // 并行加载多个数据源
      const [
        tasksResponse,
        historyResponse,
        assessmentsResponse
      ] = await Promise.all([
        evaluationService.getEvaluationsToGive(),
        evaluationService.getEvaluations({ type: 'leader' }),
        assessmentService.getAssessments({ status: 'active' })
      ])

      // 处理评估任务
      if (tasksResponse.code === 200 && tasksResponse.data) {
        const tasks = tasksResponse.data.map(evaluation => {
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
        })
        setEvaluationTasks(tasks)
      }

      // 处理评估历史
      if (historyResponse.code === 200 && historyResponse.data) {
        setEvaluationHistory(historyResponse.data.items)
      }

      // 处理活跃考核
      if (assessmentsResponse.code === 200 && assessmentsResponse.data) {
        setActiveAssessments(assessmentsResponse.data.items)

        // 获取每个考核的进度
        const progressPromises = assessmentsResponse.data.items.map(async (assessment) => {
          try {
            const progressResponse = await evaluationService.getEvaluationProgress(assessment.id)
            return {
              id: assessment.id,
              progress: progressResponse.code === 200 ? progressResponse.data : null
            }
          } catch (error) {
            return { id: assessment.id, progress: null }
          }
        })

        const progressResults = await Promise.all(progressPromises)
        const progressMap: Record<number, EvaluationProgress> = {}
        progressResults.forEach(result => {
          if (result.progress) {
            progressMap[result.id] = result.progress
          }
        })
        setAssessmentProgress(progressMap)
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
    router.push('/lead')
  }

  const getTaskStatusBadge = (task: EvaluationTask) => {
    if (task.is_overdue) {
      return <Badge variant="outline" className="text-red-600 border-red-600">已逾期</Badge>
    }
    
    switch (task.status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">待评分</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">评分中</Badge>
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
    const matchesSearch = task.assessment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.evaluatee_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesAssessment = selectedAssessment === "all" || task.assessment_id.toString() === selectedAssessment
    
    let matchesTab = true
    switch (activeTab) {
      case 'pending':
        matchesTab = task.status === 'pending' || task.status === 'in_progress'
        break
      case 'completed':
        matchesTab = task.status === 'completed'
        break
      case 'overdue':
        matchesTab = task.is_overdue
        break
    }
    
    return matchesSearch && matchesAssessment && matchesTab
  })

  const filteredHistory = evaluationHistory.filter(evaluation => {
    const matchesSearch = evaluation.assessment_id.toString().includes(searchQuery) ||
                         (evaluation.leader_review && evaluation.leader_review.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesAssessment = selectedAssessment === "all" || evaluation.assessment_id.toString() === selectedAssessment
    
    return matchesSearch && matchesAssessment
  })

  const getTabCount = (tab: string) => {
    switch (tab) {
      case 'pending':
        return evaluationTasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length
      case 'completed':
        return evaluationTasks.filter(task => task.status === 'completed').length
      case 'overdue':
        return evaluationTasks.filter(task => task.is_overdue).length
      default:
        return 0
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
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载评估数据...</span>
          </div>
        </div>
      </div>
    )
  }

  const pendingTasksCount = evaluationTasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} pendingTasksCount={pendingTasksCount} />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">团队评估中心</h1>
              <p className="text-gray-600">管理您的团队评估任务和查看评估进度</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择考核" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有考核</SelectItem>
                  {activeAssessments.map(assessment => (
                    <SelectItem key={assessment.id} value={assessment.id.toString()}>
                      {assessment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索评估..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              待评分
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
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              进度总览
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
                  待评分任务
                </CardTitle>
                <CardDescription>
                  需要您完成评分的下属评估任务
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{task.evaluatee_name}</h3>
                            <p className="text-sm text-gray-600">{task.evaluatee_department}</p>
                          </div>
                          {getTaskStatusBadge(task)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>考核：{task.assessment_title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>截止：{evaluationUtils.formatDate(task.deadline)}</span>
                          </div>
                        </div>
                        
                        {task.is_overdue && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="font-medium">评分已逾期</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">
                              请尽快完成评分，避免影响团队绩效评估
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {task.last_updated && (
                              <span>最后更新：{evaluationUtils.formatDateTime(task.last_updated)}</span>
                            )}
                          </div>
                          <Button
                            onClick={() => router.push(`/lead/evaluation/${task.assessment_id}/${task.evaluatee_id}`)}
                            variant={task.is_overdue ? "destructive" : "default"}
                            size="sm"
                          >
                            {task.status === 'in_progress' ? '继续评分' : '开始评分'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无待评分任务</h3>
                    <p>所有评分任务均已完成</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  已完成的评分
                </CardTitle>
                <CardDescription>
                  您已完成的评分任务列表
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{task.evaluatee_name}</h3>
                            <p className="text-sm text-gray-600">{task.evaluatee_department}</p>
                          </div>
                          {getTaskStatusBadge(task)}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            完成时间：{task.last_updated && evaluationUtils.formatDateTime(task.last_updated)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/lead/evaluation/result/${task.assessment_id}`)}
                          >
                            查看结果
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无已完成任务</h3>
                    <p>完成评分后将在此显示</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  已逾期的评分
                </CardTitle>
                <CardDescription>
                  超过截止时间的评分任务，请尽快完成
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{task.evaluatee_name}</h3>
                            <p className="text-sm text-gray-600">{task.evaluatee_department}</p>
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
                            onClick={() => router.push(`/lead/evaluation/${task.assessment_id}/${task.evaluatee_id}`)}
                          >
                            立即评分
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-medium mb-2">没有逾期任务</h3>
                    <p>所有评分都按时完成了</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeAssessments.map(assessment => {
                const progress = assessmentProgress[assessment.id]
                if (!progress) return null
                
                return (
                  <Card key={assessment.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{assessment.title}</span>
                        <Badge variant="outline">
                          {progress.overall_completion_rate.toFixed(0)}% 完成
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {assessment.period} · {progress.total_participants} 人参与
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">自评完成：</span>
                            <span className="font-medium">
                              {progress.self_completed_count}/{progress.total_participants}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">领导评分：</span>
                            <span className="font-medium">
                              {progress.leader_completed_count}/{progress.total_participants}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>整体进度</span>
                            <span>{progress.overall_completion_rate.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.overall_completion_rate}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            截止：{evaluationUtils.formatDate(progress.deadline)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/lead/evaluation/result/${assessment.id}`)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  评分历史记录
                </CardTitle>
                <CardDescription>
                  您的所有评分记录和结果
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredHistory.length > 0 ? (
                  <div className="space-y-4">
                    {filteredHistory.map((evaluation) => (
                      <div key={evaluation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">评估 #{evaluation.assessment_id}</h3>
                            <p className="text-sm text-gray-600">
                              被评估人：{evaluation.evaluatee?.name || `用户 #${evaluation.evaluatee_id}`}
                            </p>
                          </div>
                          {getEvaluationStatusBadge(evaluation)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">评估类型：</span>
                            <span className="font-medium">{evaluationUtils.getTypeText(evaluation.type)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">得分：</span>
                            <span className="font-medium">{evaluation.score || '--'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            评分时间：{evaluationUtils.formatDateTime(evaluation.updated_at)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/lead/evaluation/result/${evaluation.assessment_id}`)}
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
                    <p>完成评分后将在此显示历史记录</p>
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