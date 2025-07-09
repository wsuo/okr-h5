"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Users, CheckCircle, Download, AlertTriangle, BarChart3, FileText, Loader2, Edit, Send } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import AdminHeader from "@/components/admin-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { assessmentService, Assessment, assessmentUtils, ScorePreviewResult, PublishValidationResult } from "@/lib/assessment"

export default function AssessmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<Assessment | null>(null)
  const [scorePreview, setScorePreview] = useState<ScorePreviewResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [ending, setEnding] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishValidation, setPublishValidation] = useState<PublishValidationResult | null>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }

    loadAssessmentDetail()
  }, [params.id])

  const loadAssessmentDetail = async () => {
    try {
      setLoading(true)
      
      const response = await assessmentService.getAssessmentById(parseInt(params.id as string))
      
      if (response.code === 200 && response.data) {
        setAssessmentDetail(response.data)
      } else {
        toast.error('加载失败', {
          description: response.message || '无法获取考核详情'
        })
        router.push('/admin')
      }
    } catch (error: any) {
      console.error('加载考核详情失败:', error)
      toast.error('加载失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const loadScorePreview = async () => {
    if (!assessmentDetail) return
    
    try {
      setScoreLoading(true)
      
      const response = await assessmentService.scorePreview(assessmentDetail.id)
      
      if (response.code === 200 && response.data) {
        setScorePreview(response.data)
      } else {
        toast.error('加载失败', {
          description: response.message || '无法获取得分预览'
        })
      }
    } catch (error: any) {
      console.error('加载得分预览失败:', error)
      toast.error('加载失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setScoreLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyle = assessmentUtils.getStatusStyle(status as any)
    const statusText = assessmentUtils.getStatusText(status as any)
    return <Badge className={statusStyle}>{statusText}</Badge>
  }

  const getCompletionRate = () => {
    if (!assessmentDetail) return 0
    return assessmentUtils.calculateCompletionRate(assessmentDetail.statistics)
  }

  const handleExportData = () => {
    if (!assessmentDetail) return

    const csvContent = assessmentUtils.generateCSVData(assessmentDetail)
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${assessmentDetail.title}_考核数据.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('导出成功', {
      description: '考核数据已导出为CSV文件'
    })
  }

  const handleEndAssessment = async () => {
    if (!assessmentDetail) return

    try {
      setEnding(true)
      
      // 先进行预检查
      const validationResponse = await assessmentService.endValidation(assessmentDetail.id)
      
      if (validationResponse.code !== 200) {
        toast.error('预检查失败', {
          description: validationResponse.message || '无法获取考核状态'
        })
        return
      }
      
      const validation = validationResponse.data
      
      // 如果检查失败，显示错误信息
      if (!validation.canEnd) {
        const errorMessage = validation.errors.join('\n')
        toast.error('无法结束考核', {
          description: errorMessage,
          duration: 5000
        })
        return
      }
      
      // 如果有警告，显示警告信息
      if (validation.warnings.length > 0) {
        const warningMessage = validation.warnings.join('\n')
        toast.warning('注意事项', {
          description: warningMessage,
          duration: 4000
        })
      }
      
      // 如果检查通过，执行结束操作
      const response = await assessmentService.endAssessment(assessmentDetail.id)
      
      if (response.code === 200) {
        toast.success('考核已结束', {
          description: '已自动计算最终得分'
        })
        
        // 重新加载考核详情
        await loadAssessmentDetail()
      } else {
        toast.error('结束失败', {
          description: response.message || '无法结束该考核'
        })
      }
    } catch (error: any) {
      console.error('结束考核失败:', error)
      toast.error('结束失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setEnding(false)
    }
  }

  const handlePublishAssessment = async () => {
    if (!assessmentDetail) return

    try {
      setPublishing(true)
      
      // 先进行发布前校验
      const validationResponse = await assessmentService.publishValidation(assessmentDetail.id)
      
      if (validationResponse.code !== 200) {
        toast.error('预检查失败', {
          description: validationResponse.message || '无法获取考核状态'
        })
        return
      }
      
      const validation = validationResponse.data
      setPublishValidation(validation)
      
      // 如果检查失败，显示错误信息
      if (!validation.canPublish) {
        const errorMessage = validation.errors.join('\n')
        toast.error('无法发布考核', {
          description: errorMessage,
          duration: 5000
        })
        return
      }
      
      // 如果有警告或者可以发布，显示确认对话框
      setShowPublishDialog(true)
      
    } catch (error: any) {
      console.error('发布预检查失败:', error)
      toast.error('预检查失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setPublishing(false)
    }
  }

  const confirmPublishAssessment = async () => {
    if (!assessmentDetail || !publishValidation) return
    
    try {
      setPublishing(true)
      
      // 执行发布操作
      const response = await assessmentService.publishAssessment(assessmentDetail.id)
      
      if (response.code === 200) {
        toast.success('发布成功', {
          description: '考核已发布，参与者可以开始评估'
        })
        
        // 重新加载考核详情
        await loadAssessmentDetail()
        
        // 关闭对话框
        setShowPublishDialog(false)
        setPublishValidation(null)
      } else {
        toast.error('发布失败', {
          description: response.message || '无法发布该考核'
        })
      }
    } catch (error: any) {
      console.error('发布考核失败:', error)
      toast.error('发布失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleEditAssessment = () => {
    if (!assessmentDetail) return
    
    // 跳转到管理页面并打开编辑对话框
    // 这里可以通过URL参数传递编辑ID，或者使用状态管理
    router.push(`/admin?edit=${assessmentDetail.id}`)
  }

  if (!userInfo) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载考核详情中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!assessmentDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600">考核不存在或已被删除</p>
            <Button variant="outline" onClick={() => router.push('/admin')} className="mt-4">
              返回管理后台
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-6xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/admin")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理后台
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessmentDetail.title}</h1>
              <p className="text-gray-600">考核详情与数据分析</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
              
              {assessmentUtils.canEdit(assessmentDetail.status) && (
                <Button 
                  variant="outline" 
                  onClick={handleEditAssessment}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  编辑考核
                </Button>
              )}
              
              {assessmentUtils.canPublish(assessmentDetail.status) && (
                <Button 
                  variant="outline" 
                  onClick={handlePublishAssessment}
                  disabled={publishing}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  发布考核
                </Button>
              )}
              
              {assessmentUtils.canEnd(assessmentDetail.status) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 bg-transparent"
                      disabled={ending}
                    >
                      {ending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
                      结束考核
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认结束考核</AlertDialogTitle>
                      <AlertDialogDescription>
                        结束考核后，未完成的评分将无法继续进行，系统将自动计算最终得分。此操作不可撤销，请确认是否继续？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={ending}>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleEndAssessment} disabled={ending}>
                        确认结束
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* 考核概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">考核状态</p>
                  <div className="mt-1">{getStatusBadge(assessmentDetail.status)}</div>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">参与人数</p>
                  <p className="text-2xl font-bold">{assessmentDetail.statistics.total_participants}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成率</p>
                  <p className="text-2xl font-bold">{getCompletionRate().toFixed(0)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {assessmentDetail.statistics.average_score || "--"}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="participants" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants">参与人员</TabsTrigger>
            <TabsTrigger value="statistics">数据统计</TabsTrigger>
            <TabsTrigger 
              value="score-preview" 
              onClick={loadScorePreview}
              disabled={!assessmentDetail || (assessmentDetail.status !== 'active' && assessmentDetail.status !== 'completed')}
            >
              得分预览
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>参与人员详情</CardTitle>
                <CardDescription>查看所有参与人员的完成情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentDetail.participants.map((participant) => (
                    <div key={participant.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{participant.user.name}</h3>
                          <p className="text-sm text-gray-600">
                            {participant.user.department?.name || '未分配部门'} · {participant.user.position || '未设置职位'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {participant.self_completed && participant.leader_completed ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">进行中</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">自评状态：</span>
                          <span className={participant.self_completed ? "text-green-600 font-medium" : "text-red-600"}>
                            {participant.self_completed ? "已完成" : "未完成"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">领导评分：</span>
                          <span className={participant.leader_completed ? "text-green-600 font-medium" : "text-red-600"}>
                            {participant.leader_completed ? "已完成" : "未完成"}
                          </span>
                        </div>
                        {participant.self_score && (
                          <div>
                            <span className="text-gray-600">自评得分：</span>
                            <span className="font-medium">{participant.self_score}</span>
                          </div>
                        )}
                        {participant.final_score && (
                          <div>
                            <span className="text-gray-600">最终得分：</span>
                            <span className="font-medium text-blue-600">{participant.final_score}</span>
                          </div>
                        )}
                      </div>

                      {participant.self_completed && participant.leader_completed && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>完成进度</span>
                            <span>100%</span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>完成情况统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>自评完成</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {assessmentDetail.statistics.self_completed_count}/
                          {assessmentDetail.statistics.total_participants}
                        </span>
                        <Progress
                          value={
                            (assessmentDetail.statistics.self_completed_count /
                              assessmentDetail.statistics.total_participants) *
                            100
                          }
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>领导评分完成</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {assessmentDetail.statistics.leader_completed_count}/
                          {assessmentDetail.statistics.total_participants}
                        </span>
                        <Progress
                          value={
                            (assessmentDetail.statistics.leader_completed_count /
                              assessmentDetail.statistics.total_participants) *
                            100
                          }
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>全部完成</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {assessmentDetail.statistics.fully_completed_count}/
                          {assessmentDetail.statistics.total_participants}
                        </span>
                        <Progress value={getCompletionRate()} className="w-20 h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>得分统计</CardTitle>
                </CardHeader>
                <CardContent>
                  {assessmentDetail.status === "completed" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>平均得分</span>
                        <span className="text-lg font-bold text-blue-600">
                          {assessmentDetail.statistics.average_score || '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>最高得分</span>
                        <span className="text-lg font-bold text-green-600">
                          {assessmentDetail.statistics.highest_score || '--'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>最低得分</span>
                        <span className="text-lg font-bold text-orange-600">
                          {assessmentDetail.statistics.lowest_score || '--'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2" />
                      <p>考核完成后将显示得分统计</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="score-preview">
            <Card>
              <CardHeader>
                <CardTitle>得分计算预览</CardTitle>
                <CardDescription>查看每位参与者的得分计算详情</CardDescription>
              </CardHeader>
              <CardContent>
                {scoreLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">加载得分预览中...</span>
                  </div>
                ) : scorePreview ? (
                  <div className="space-y-6">
                    {/* 计算规则说明 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">评分权重配置</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">自评权重：</span>
                          <span className="font-medium">{(scorePreview.templateConfig.evaluatorWeights.self * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-blue-700">领导评分权重：</span>
                          <span className="font-medium">{(scorePreview.templateConfig.evaluatorWeights.leader * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* 参与者得分详情 */}
                    <div className="space-y-4">
                      {scorePreview.participants.map((participant) => (
                        <div key={participant.userId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg">{participant.userName}</h4>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {participant.calculatedFinalScore.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-500">最终得分</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-lg font-bold text-green-600">{participant.selfScore.toFixed(1)}</div>
                              <div className="text-sm text-gray-600">自评得分</div>
                            </div>
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-lg font-bold text-purple-600">{participant.leaderScore.toFixed(1)}</div>
                              <div className="text-sm text-gray-600">领导评分</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-lg font-bold text-blue-600">{participant.calculatedFinalScore.toFixed(1)}</div>
                              <div className="text-sm text-gray-600">加权平均</div>
                            </div>
                          </div>

                          {/* 分类得分详情 */}
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-700">分类得分详情</h5>
                            <div className="space-y-2">
                              {participant.scoreBreakdown.map((category) => (
                                <div key={category.category} className="bg-gray-50 rounded p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{category.categoryName}</span>
                                    <span className="text-sm text-gray-500">权重: {category.categoryWeight}%</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">自评：</span>
                                      <span className="font-medium">{category.selfScore.toFixed(1)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">领导：</span>
                                      <span className="font-medium">{category.leaderScore.toFixed(1)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">最终：</span>
                                      <span className="font-medium text-blue-600">{category.categoryScore.toFixed(1)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>点击"得分预览"标签页加载得分计算详情</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 发布确认对话框 */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              确认发布考核
            </AlertDialogTitle>
            <AlertDialogDescription>
              发布后考核将进入进行中状态，参与者可以开始评估。发布后将无法再编辑基本信息。
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {publishValidation && (
            <div className="space-y-4">
              {/* 预检查结果 */}
              {publishValidation.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    注意事项
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {publishValidation.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 检查项目状态 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-800 mb-2">发布检查项</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${publishValidation.checks.title ? 'text-green-500' : 'text-red-500'}`} />
                    <span>标题配置</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${publishValidation.checks.dateConfig ? 'text-green-500' : 'text-red-500'}`} />
                    <span>时间配置</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${publishValidation.checks.template ? 'text-green-500' : 'text-red-500'}`} />
                    <span>模板配置</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${publishValidation.checks.participants ? 'text-green-500' : 'text-red-500'}`} />
                    <span>参与者配置</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPublishAssessment} 
              disabled={publishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              确认发布
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
