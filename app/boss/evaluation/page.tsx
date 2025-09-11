"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserCheck, Clock, CheckCircle, AlertTriangle, Crown } from "lucide-react"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import BossHeader from "@/components/boss-header"
import { safeParseUserInfo, isBossUser } from "@/lib/utils"
import { 
  evaluationService, 
  BossTask, 
  evaluationUtils,
  type TaskStatus 
} from "@/lib/evaluation"

export default function BossEvaluationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [tasks, setTasks] = useState<BossTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
      loadTasks()
      
      // 检查URL参数中是否有tab参数
      const tabParam = searchParams.get('tab')
      if (tabParam && ['pending', 'in_progress', 'completed', 'overdue'].includes(tabParam)) {
        setActiveTab(tabParam)
      }
    } else {
      router.push('/')
      return
    }
  }, [searchParams])

  // 加载Boss评估任务
  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await evaluationService.getBossTasks()
      if (response.code === 200 && response.data) {
        const mapped = response.data.map((t: BossTask) => ({
          ...t,
          is_overdue: t?.deadline ? evaluationUtils.isOverdue(t.deadline) : false,
        }))
        setTasks(mapped)
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

  // 检查权限
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">加载用户信息...</span>
      </div>
    )
  }

  // 检查是否是boss用户
  if (!isBossUser(userInfo)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              您没有权限访问Boss评估功能，请确认您的角色权限。
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // 按状态分类任务
  const categorizedTasks = {
    pending: tasks.filter(task => task.status === 'pending' && !task.is_overdue), // 待评分且未逾期
    in_progress: tasks.filter(task => task.status === 'in_progress' && !task.is_overdue), // 进行中且未逾期
    completed: tasks.filter(task => task.status === 'completed'), // 已完成（不论是否逾期）
    overdue: tasks.filter(task => task.is_overdue && task.status !== 'completed'), // 已逾期但未完成
  }

  // 处理开始评分
  const handleStartEvaluation = (task: BossTask) => {
    router.push(`/boss/evaluation/${task.assessment_id}/${task.evaluatee_id}`)
  }

  // 处理查看已完成评分
  const handleViewEvaluation = (task: BossTask) => {
    if (task.evaluation_id) {
      router.push(`/boss/evaluation/view/${task.evaluation_id}`)
    } else {
      // 如果没有evaluation_id，跳转到对比页面
      router.push(`/boss/evaluation/comparison/${task.assessment_id}/${task.evaluatee_id}`)
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'in_progress':
        return <UserCheck className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  // 获取状态文本
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return '待开始'
      case 'in_progress':
        return '进行中'
      case 'completed':
        return '已完成'
      case 'overdue':
        return '已逾期'
      default:
        return '未知'
    }
  }

  // 渲染任务列表
  const renderTaskList = (taskList: BossTask[]) => {
    if (taskList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Crown className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">暂无相关任务</h3>
          <p className="text-sm">当前没有需要您评分的员工</p>
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
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-2">
                    <h3 className="font-semibold text-lg mr-2">{task.evaluatee_name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {task.evaluatee_department}
                    </Badge>
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'default' : 
                        task.is_overdue ? 'destructive' : 
                        task.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(task.status === 'completed' ? 'completed' : task.is_overdue ? 'overdue' : task.status)}
                      {getStatusText(task.status === 'completed' ? 'completed' : task.is_overdue ? 'overdue' : task.status)}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>考核标题：</strong> {task.assessment_title}</p>
                    <p><strong>考核周期：</strong> {task.assessment_period}</p>
                    <p><strong>截止时间：</strong> {evaluationUtils.formatDateTime(task.deadline)}</p>
                    {task.last_updated && (
                      <p><strong>最后更新：</strong> {evaluationUtils.formatDateTime(task.last_updated)}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {task.status === 'completed' ? (
                    <>
                      <div className="text-right mr-4">
                        <div className="text-lg font-bold text-green-600">
                          已完成
                        </div>
                        <div className="text-xs text-muted-foreground">Boss评分</div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleViewEvaluation(task)}
                      >
                        查看详情
                      </Button>
                    </>
                  ) : (
                    // 逾期任务不显示评分按钮
                    !task.is_overdue && (
                      <Button
                        onClick={() => handleStartEvaluation(task)}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        开始评分
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">加载用户信息...</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg">正在加载评估任务...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BossHeader userInfo={userInfo} pendingTasksCount={categorizedTasks.pending.length} />

      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Crown className="w-7 h-7 text-yellow-600" />
              Boss 评分中心
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={loadTasks}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              '刷新任务'
            )}
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                待评分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {categorizedTasks.pending.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                需要您评分的员工
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                进行中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {categorizedTasks.in_progress.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                草稿保存中
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                已完成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {categorizedTasks.completed.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                评分已提交
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                已逾期
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {categorizedTasks.overdue.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                超出截止时间
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 任务列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              评估任务列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  待评分 ({categorizedTasks.pending.length})
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  进行中 ({categorizedTasks.in_progress.length})
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
              
              <TabsContent value="in_progress" className="mt-6">
                {renderTaskList(categorizedTasks.in_progress)}
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
    </div>
  )
}
