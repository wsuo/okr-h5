"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Search, Calendar, User, Loader2, FileText, RefreshCw } from "lucide-react"
import EmployeeHeader from "@/components/employee-header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTask,
  Evaluation,
  evaluationUtils
} from "@/lib/evaluation"

export default function EmployeeEvaluationCenter() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [evaluationHistory, setEvaluationHistory] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
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

      // 并行加载评估任务和历史记录
      const [tasksResponse, historyResponse] = await Promise.all([
        evaluationService.getMyEvaluationTasks(),
        evaluationService.getMyEvaluations()
      ])

      // 处理评估任务
      if (tasksResponse.code === 200 && tasksResponse.data) {
        console.log('获取到的评估任务数据:', tasksResponse.data)
        console.log('任务数量:', tasksResponse.data.length)
        
        // 分析任务状态分布
        const statusCounts = tasksResponse.data.reduce((acc: any, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        }, {})
        console.log('任务状态分布:', statusCounts)
        
        // 特别检查completed状态的任务
        const completedTasks = tasksResponse.data.filter(task => task.status === 'completed')
        console.log('已完成任务:', completedTasks)
        
        setEvaluationTasks(tasksResponse.data)
      } else {
        console.error('获取任务数据失败:', tasksResponse)
      }

      // 处理评估历史
      if (historyResponse.code === 200 && historyResponse.data) {
        console.log('获取到的评估历史数据:', historyResponse.data)
        setEvaluationHistory(historyResponse.data)
      } else {
        console.error('获取历史数据失败:', historyResponse)
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
    const matchesSearch = task.assessment_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.evaluatee_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    let result = false
    switch (activeTab) {
      case 'pending':
        result = matchesSearch && (task.status === 'pending' || task.status === 'in_progress')
        break
      case 'completed':
        result = matchesSearch && task.status === 'completed'
        break
      case 'overdue':
        result = matchesSearch && task.is_overdue
        break
      default:
        result = matchesSearch
    }
    
    // 调试：输出过滤结果
    if (activeTab === 'completed') {
      console.log(`任务 ${task.id} (${task.assessment_title}):`, {
        status: task.status,
        matchesSearch,
        result,
        statusMatch: task.status === 'completed'
      })
    }
    
    return result
  })

  const filteredHistory = evaluationHistory.filter(evaluation => {
    const matchesSearch = (evaluation.assessment_id?.toString() || '').includes(searchQuery) ||
                         (evaluation.self_review && evaluation.self_review.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  const getTabCount = (tab: string) => {
    let count = 0
    switch (tab) {
      case 'pending':
        count = evaluationTasks.filter(task => task.status === 'pending' || task.status === 'in_progress').length
        break
      case 'completed':
        count = evaluationTasks.filter(task => task.status === 'completed').length
        console.log(`已完成任务计数: ${count}`, evaluationTasks.filter(task => task.status === 'completed'))
        break
      case 'overdue':
        count = evaluationTasks.filter(task => task.is_overdue).length
        break
      default:
        count = 0
    }
    
    console.log(`标签页 ${tab} 计数: ${count}`)
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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">评估中心</h1>
              <p className="text-gray-600">管理您的所有评估任务和历史记录</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新数据
              </Button>
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
                          <Button
                            onClick={() => router.push(`/employee/evaluation/${task.assessment_id}`)}
                            variant={task.is_overdue ? "destructive" : "default"}
                            size="sm"
                          >
                            {task.status === 'in_progress' ? '继续评估' : '开始评估'}
                          </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  已完成的评估任务
                </CardTitle>
                <CardDescription>
                  您已完成的评估任务列表
                </CardDescription>
                {/* 调试信息 */}
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                  调试信息: 总任务数 {evaluationTasks.length}, 已完成 {getTabCount('completed')}, 过滤后 {filteredTasks.length}
                </div>
              </CardHeader>
              <CardContent>
                {filteredTasks.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
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

                        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">评估已完成</span>
                          </div>
                          <p className="text-sm text-green-600 mt-1">
                            您可以查看评估结果和详细对比分析
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            完成时间：{task.last_updated && evaluationUtils.formatDateTime(task.last_updated)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/employee/evaluation/result/${task.assessment_id}`)}
                            >
                              查看结果
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无已完成任务</h3>
                    <p>完成评估任务后将在此显示</p>
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
                      <div key={evaluation.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">评估 #{evaluation.assessment_id}</h3>
                            <p className="text-sm text-gray-600">
                              {evaluationUtils.formatDateTime(evaluation.created_at)}
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
                            更新时间：{evaluationUtils.formatDateTime(evaluation.updated_at)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employee/evaluation/result/${evaluation.assessment_id}`)}
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