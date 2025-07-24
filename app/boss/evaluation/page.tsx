"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserCheck, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { 
  evaluationService, 
  EvaluationTask, 
  evaluationUtils,
  type TaskStatus 
} from "@/lib/evaluation"
import { useBossEvaluationPermission, useAuth } from "@/contexts/auth-context"

export default function BossEvaluationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const bossPermission = useBossEvaluationPermission()
  
  const [tasks, setTasks] = useState<EvaluationTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  // 检查权限
  if (!bossPermission.canViewTasks()) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          您没有权限访问Boss评估功能
        </AlertDescription>
      </Alert>
    )
  }

  // 加载Boss评估任务
  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await evaluationService.getBossEvaluationTasks()
      if (response.code === 200 && response.data) {
        setTasks(response.data)
      }
    } catch (error: any) {
      console.error('加载Boss评估任务失败:', error)
      toast.error('加载评估任务失败', {
        description: error.message || '请稍后重试'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  // 按状态分类任务
  const categorizedTasks = {
    pending: tasks.filter(task => task.status === 'pending'),
    completed: tasks.filter(task => task.status === 'completed'),
    overdue: tasks.filter(task => task.status === 'overdue'),
  }

  // 处理开始评分
  const handleStartEvaluation = (task: EvaluationTask) => {
    router.push(`/boss/evaluation/${task.assessment_id}/${task.evaluatee_id}`)
  }

  // 处理查看已完成评分
  const handleViewEvaluation = (task: EvaluationTask) => {
    if (task.evaluation_id) {
      router.push(`/boss/evaluation/view/${task.evaluation_id}`)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  // 渲染任务列表
  const renderTaskList = (taskList: EvaluationTask[]) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          暂无相关任务
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {taskList.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{task.evaluatee_name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {task.evaluatee_department}
                    </Badge>
                    <Badge 
                      variant={task.status === 'completed' ? 'default' : task.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(task.status)}
                      {evaluationUtils.getTaskStatusText(task.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>考核周期:</strong> {task.assessment_title} - {task.assessment_period}</p>
                    <p><strong>截止时间:</strong> {evaluationUtils.formatDate(task.deadline)}</p>
                    {task.is_overdue && (
                      <p className="text-red-600 font-medium">已逾期</p>
                    )}
                    {task.last_updated && (
                      <p><strong>最后更新:</strong> {evaluationUtils.formatDateTime(task.last_updated)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {task.status === 'completed' ? (
                    <>
                      <div className="text-right mr-4">
                        <div className="text-lg font-bold text-green-600">
                          {typeof task.score === 'number' ? task.score.toFixed(1) : task.score || '--'}
                        </div>
                        <div className="text-xs text-muted-foreground">评分</div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleViewEvaluation(task)}
                      >
                        查看详情
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleStartEvaluation(task)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      开始评分
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">上级评估</h1>
          <p className="text-muted-foreground">
            对您的下属员工进行上级评分
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadTasks}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            '刷新'
          )}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待评分
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {categorizedTasks.pending.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {categorizedTasks.completed.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已逾期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {categorizedTasks.overdue.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>评估任务</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                待评分 ({categorizedTasks.pending.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                已完成 ({categorizedTasks.completed.length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                已逾期 ({categorizedTasks.overdue.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
              {renderTaskList(categorizedTasks.pending)}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              {renderTaskList(categorizedTasks.completed)}
            </TabsContent>
            
            <TabsContent value="overdue" className="mt-6">
              {renderTaskList(categorizedTasks.overdue)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}