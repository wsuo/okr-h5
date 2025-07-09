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

export default function EmployeeDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluationTasks, setEvaluationTasks] = useState<EvaluationTask[]>([])
  const [evaluationHistory, setEvaluationHistory] = useState<EvaluationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    latestScore: 0,
    averageScore: 0,
    pendingCount: 0
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

      // 获取我的评估任务
      const tasksResponse = await evaluationService.getMyEvaluationTasks()
      if (tasksResponse.code === 200 && tasksResponse.data) {
        setEvaluationTasks(tasksResponse.data)
        
        // 计算待处理任务数量
        const pendingCount = tasksResponse.data.filter(task => 
          task.status === 'pending' || task.status === 'in_progress'
        ).length
        
        setStats(prev => ({ ...prev, pendingCount }))
      }

      // 获取我的评估记录并构建历史数据
      const evaluationsResponse = await evaluationService.getMyEvaluations()
      if (evaluationsResponse.code === 200 && evaluationsResponse.data) {
        const completedEvaluations = evaluationsResponse.data.filter(evaluation => 
          evaluation.status === 'completed' && evaluation.type === 'self'
        )

        // 为每个完成的评估获取对比数据
        const historyPromises = completedEvaluations.map(async (evaluation) => {
          try {
            const comparisonResponse = await evaluationService.getEvaluationComparison(
              evaluation.assessment_id, 
              evaluation.evaluatee_id
            )
            
            const comparison = comparisonResponse.code === 200 ? comparisonResponse.data : undefined
            
            return {
              assessment_id: evaluation.assessment_id,
              assessment_title: `评估 #${evaluation.assessment_id}`, // 这里可以后续优化获取真实标题
              assessment_period: evaluationUtils.formatDate(evaluation.created_at),
              final_score: comparison?.leader_evaluation?.score || evaluation.score,
              self_score: comparison?.self_evaluation?.score || evaluation.score,
              leader_score: comparison?.leader_evaluation?.score,
              completed_at: evaluation.updated_at,
              comparison
            } as EvaluationHistory
          } catch (error) {
            console.warn('获取评估对比数据失败:', error)
            return {
              assessment_id: evaluation.assessment_id,
              assessment_title: `评估 #${evaluation.assessment_id}`,
              assessment_period: evaluationUtils.formatDate(evaluation.created_at),
              final_score: evaluation.score,
              self_score: evaluation.score,
              completed_at: evaluation.updated_at
            } as EvaluationHistory
          }
        })

        const history = await Promise.all(historyPromises)
        // 按完成时间倒序排列
        history.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        setEvaluationHistory(history)

        // 计算统计数据
        if (history.length > 0) {
          const latestScore = history[0].final_score || 0
          const averageScore = history.reduce((sum, h) => sum + (h.final_score || 0), 0) / history.length
          
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
        <div className="container mx-auto p-4 max-w-4xl">
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

      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的绩效中心</h1>
            <p className="text-gray-600">查看和管理您的绩效考核</p>
          </div>
          <Button 
            onClick={() => router.push('/employee/evaluation')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            评估中心
          </Button>
        </div>

        {/* 个人统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最近得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.latestScore)}`}>
                    {stats.latestScore > 0 ? stats.latestScore.toFixed(1) : '--'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.latestScore > 0 ? getScoreLevel(stats.latestScore) : '暂无数据'}
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
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '--'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.averageScore > 0 ? getScoreLevel(stats.averageScore) : '暂无数据'}
                  </p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待办事项</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
                  <p className="text-xs text-gray-500">需处理</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 待办事项 */}
        <Card className="mb-6">
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
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
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
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        类型: {evaluationUtils.getTypeText(task.type)} • 
                        被评估人: {task.evaluatee_name}
                      </div>
                      <Button 
                        onClick={() => router.push(`/employee/evaluation/${task.assessment_id}`)} 
                        size="sm"
                        variant={task.is_overdue ? "destructive" : "default"}
                      >
                        {task.status === 'in_progress' ? '继续评分' : '开始评分'}
                      </Button>
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

        {/* 历史记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              历史记录
            </CardTitle>
            <CardDescription>您的绩效考核历史记录</CardDescription>
          </CardHeader>
          <CardContent>
            {evaluationHistory.length > 0 ? (
              <div className="space-y-4">
                {evaluationHistory.slice(0, 5).map((history) => (
                  <div key={history.assessment_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{history.assessment_title}</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        已完成
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">最终得分：</span>
                        <span className={`font-semibold ${getScoreColor(history.final_score || 0)}`}>
                          {history.final_score?.toFixed(1) || '--'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">自评得分：</span>
                        <span className="font-semibold">{history.self_score?.toFixed(1) || '--'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">领导评分：</span>
                        <span className="font-semibold">{history.leader_score?.toFixed(1) || '--'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        完成时间：{evaluationUtils.formatDate(history.completed_at)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/employee/evaluation/result/${history.assessment_id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>
                ))}
                
                {evaluationHistory.length > 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/employee/evaluation/history')}
                    >
                      查看全部历史记录
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>暂无历史记录</p>
                <p className="text-xs mt-1">完成评估后将在此显示历史记录</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
