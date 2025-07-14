"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, AlertTriangle, FileText, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LeadHeader from "@/components/lead-header"
import EvaluationForm from "@/components/evaluation-form"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTemplate,
  DetailedEvaluation,
  evaluationUtils
} from "@/lib/evaluation"
import { userService, User as UserType } from "@/lib/user"
import { useEvaluationPageMonitor } from "@/hooks/use-assessment-status"
import { safeParseUserInfo } from "@/lib/utils"

export default function LeaderEvaluationPage() {
  const router = useRouter()
  const params = useParams()
  
  // 参数验证和转换
  const assessmentId = React.useMemo(() => {
    const id = parseInt(params.assessmentId as string, 10)
    return isNaN(id) ? null : id
  }, [params.assessmentId])
  
  const userId = React.useMemo(() => {
    const id = parseInt(params.userId as string, 10)
    return isNaN(id) ? null : id
  }, [params.userId])
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluateeInfo, setEvaluateeInfo] = useState<UserType | null>(null)
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null)
  const [existingDraft, setExistingDraft] = useState<DetailedEvaluation | null>(null)
  const [selfEvaluationStatus, setSelfEvaluationStatus] = useState<{
    completed: boolean
    status: 'none' | 'draft' | 'submitted' | 'completed'
    completedAt?: string
    score?: string
  }>({ completed: false, status: 'none' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 使用状态监听Hook
  const {
    currentStatus,
    viewMode,
    showEndedDialog,
    setViewMode,
    handleEndedDialogConfirm,
    handleEvaluationError,
    manualCheck
  } = useEvaluationPageMonitor(assessmentId || 0, !loading && !!template && !!assessmentId)

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }
    
    // 参数验证
    if (!assessmentId || !userId) {
      console.warn('无效的URL参数:', { 
        assessmentId: params.assessmentId, 
        userId: params.userId 
      })
    }
    
    // 只有在参数有效时才加载数据
    if (assessmentId && userId) {
      loadData()
    } else {
      setError(`无效的评估参数: assessmentId=${assessmentId}, userId=${userId}`)
      setLoading(false)
    }
  }, [assessmentId, userId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      // 确保参数有效
      if (!assessmentId || !userId) {
        throw new Error('无效的评估参数')
      }

      // 首先检查考核状态
      const statusResponse = await evaluationService.checkAssessmentStatus(assessmentId)
      if (statusResponse.code === 200 && statusResponse.data) {
        // 如果考核已结束，设置为查看模式
        if (!statusResponse.data.canEvaluate) {
          setViewMode(true)
        }
      }

      // 并行加载多个数据
      const [templateResponse, evaluateeResponse] = await Promise.all([
        evaluationService.getUserEvaluationTemplate(assessmentId, userId),
        userService.getUser(userId)
      ])

      // 处理评分模板
      if (templateResponse.code !== 200 || !templateResponse.data) {
        throw new Error(templateResponse.message || '无法获取评分模板')
      }
      setTemplate(templateResponse.data)

      // 处理被评估人信息
      if (evaluateeResponse.code !== 200 || !evaluateeResponse.data) {
        throw new Error(evaluateeResponse.message || '无法获取被评估人信息')
      }
      setEvaluateeInfo(evaluateeResponse.data)

      // 检查自评完成状态
      try {
        const evaluationsResponse = await evaluationService.getEvaluations({
          assessment_id: assessmentId,
          evaluatee_id: userId,
          type: 'self'
        })
        
        if (evaluationsResponse.code === 200 && evaluationsResponse.data) {
          const selfEvaluation = evaluationsResponse.data.items.find(evaluation => {
            // 同时检查 evaluatee_id 和 evaluatee.id，因为不同API可能返回不同结构
            const evaluateeId = evaluation.evaluatee_id || evaluation.evaluatee?.id
            return evaluateeId === userId && evaluation.type === 'self'
          })
          
          if (selfEvaluation) {
            // 根据自评状态设置不同的状态信息
            const isCompleted = selfEvaluation.status === 'submitted' || selfEvaluation.status === 'completed'
            setSelfEvaluationStatus({
              completed: isCompleted,
              status: selfEvaluation.status,
              completedAt: selfEvaluation.updated_at,
              score: selfEvaluation.score
            })
          } else {
            // 没有找到自评记录，说明员工还没有开始自评
            setSelfEvaluationStatus({
              completed: false,
              status: 'none'
            })
          }
        } else {
          setSelfEvaluationStatus({
            completed: false,
            status: 'none'
          })
        }
      } catch (selfEvalError) {
        console.warn('获取自评状态失败:', selfEvalError)
        // 获取失败时设置为未知状态
        setSelfEvaluationStatus({
          completed: false,
          status: 'none'
        })
      }

      // 检查是否有现有的领导评分记录或草稿
      try {
        const myEvaluationsResponse = await evaluationService.getEvaluations({
          assessment_id: assessmentId,
          evaluatee_id: userId,
          type: 'leader'
        })
        
        if (myEvaluationsResponse.code === 200 && myEvaluationsResponse.data) {
          const leaderEvaluation = myEvaluationsResponse.data.items.find(evaluation => {
            // 同时检查 evaluatee_id 和 evaluatee.id，因为不同API可能返回不同结构
            const evaluateeId = evaluation.evaluatee_id || evaluation.evaluatee?.id
            return evaluateeId === userId && evaluation.type === 'leader'
          })
          
          if (leaderEvaluation) {
            if (leaderEvaluation.status === 'submitted' || leaderEvaluation.status === 'completed') {
              // 已提交的评分，跳转到结果页面
              toast.info('您已完成对该员工的评分', {
                description: '正在跳转到结果页面'
              })
              router.replace(`/lead/evaluation/result/${assessmentId}`)
              return
            } else if (leaderEvaluation.status === 'draft') {
              // 直接使用已有的草稿数据，API 已经返回了完整的详细评分信息
              console.log('找到领导评分草稿，设置草稿数据:', leaderEvaluation)
              setExistingDraft(leaderEvaluation as any)
            }
          }
        }
      } catch (draftError) {
        // 获取草稿失败不影响主流程
        console.warn('获取领导评分草稿失败:', draftError)
      }

    } catch (error: any) {
      console.error('加载评估数据失败:', error)
      setError(error.message || '服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSuccess = () => {
    toast.success('评分提交成功', {
      description: '感谢您的评价，正在跳转到团队评估页面'
    })
    router.push('/lead')
  }

  const handleSubmitError = (error: any) => {
    const errorInfo = handleEvaluationError(error)

    if (!errorInfo.shouldShowDialog) {
      toast.error(errorInfo.message)
    }
  }

  const handleDraftSaved = () => {
    // 草稿保存成功的回调
  }

  const handleBack = () => {
    router.push('/lead')
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
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载评估数据...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回团队管理
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={loadData}>
              重新加载
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!template || !evaluateeInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回团队管理
            </Button>
          </div>

          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">评估数据不存在</h3>
            <p className="text-gray-600 mb-4">评估模板或员工信息可能已被删除</p>
            <Button variant="outline" onClick={handleBack}>
              返回团队管理
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 检查模板是否支持领导评分
  const leaderEvaluationEnabled = template.scoring_rules.leader_evaluation.enabled
  if (!leaderEvaluationEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回团队管理
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              该考核未启用领导评分功能
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={handleBack} className="mb-6 hover:bg-accent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          
          <div className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/50">
            <h1 className="text-3xl font-bold text-foreground mb-2">{template.assessment_title}</h1>
            <p className="text-muted-foreground text-lg mb-4">
              {template.assessment_period} · 领导评分
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30">
                <span className="font-medium text-primary">领导评分权重:</span>
                <span className="ml-1 font-bold">{(template.scoring_rules.leader_evaluation.weight_in_final * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30">
                <span className="font-medium text-primary">满分:</span>
                <span className="ml-1 font-bold">{template.total_score}分</span>
              </div>
            </div>
          </div>
        </div>

        {/* 被评估人信息 */}
        <Card className="mb-6 bg-gradient-to-r from-background to-background/80 border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-primary" />
              被评估人信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                  <span className="text-primary font-semibold text-lg">
                    {evaluateeInfo.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-foreground">{evaluateeInfo.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="bg-secondary/20 px-2 py-1 rounded-md">
                      {evaluateeInfo.department?.name || '未分配部门'}
                    </span>
                    <span>·</span>
                    <span className="bg-secondary/20 px-2 py-1 rounded-md">
                      {evaluateeInfo.position || '未设置职位'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-2">自评状态</div>
                {(() => {
                  switch (selfEvaluationStatus.status) {
                    case 'submitted':
                    case 'completed':
                      return (
                        <div>
                          <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                            已提交
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selfEvaluationStatus.completedAt && evaluationUtils.formatDateTime(selfEvaluationStatus.completedAt)}
                          </div>
                        </div>
                      )
                    case 'draft':
                      return (
                        <div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                            草稿中
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {selfEvaluationStatus.completedAt && `保存于 ${evaluationUtils.formatDateTime(selfEvaluationStatus.completedAt)}`}
                          </div>
                        </div>
                      )
                    case 'none':
                    default:
                      return (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200 px-3 py-1">
                          未开始
                        </Badge>
                      )
                  }
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 考核状态提示 */}
        {viewMode && currentStatus && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {currentStatus.message || '考核已结束，只能查看评估结果'}
            </AlertDescription>
          </Alert>
        )}

        {/* 自评状态提醒 */}
        {!viewMode && (() => {
          switch (selfEvaluationStatus.status) {
            case 'none':
              return (
                <Alert className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200/50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    该员工尚未开始自评，您仍可以进行评分，但建议等待自评完成后再进行评价以获得更全面的信息。
                  </AlertDescription>
                </Alert>
              )
            case 'draft':
              return (
                <Alert className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200/50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    该员工的自评还在草稿阶段，尚未正式提交。您仍可以进行评分，但建议等待自评完成后再进行评价。
                  </AlertDescription>
                </Alert>
              )
            case 'submitted':
            case 'completed':
              return (
                <Alert className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    该员工已完成自评，您可以参考自评结果进行客观评价。
                  </AlertDescription>
                </Alert>
              )
            default:
              return null
          }
        })()}

        {/* 草稿恢复提醒 */}
        {existingDraft && !viewMode && (
          <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              检测到未完成的评分草稿，已为您自动加载。上次保存时间: {' '}
              <span className="font-semibold">{evaluationUtils.formatDateTime(existingDraft.updated_at)}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* 评分说明 */}
        {!viewMode && (
          <Alert className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-800">
              <strong className="font-semibold">评分说明：</strong> 为确保评分的公正性，您无法查看该员工的自评分数和评论。
              请根据您对其工作表现的了解进行客观评价。
            </AlertDescription>
          </Alert>
        )}

        <EvaluationForm
          template={template}
          assessmentId={assessmentId}
          evaluateeId={userId}
          type="leader"
          existingDraft={existingDraft}
          onSubmit={handleSubmitSuccess}
          onSubmitError={handleSubmitError}
          onSaveDraft={handleDraftSaved}
          viewMode={viewMode}
        />
      </div>

      {/* 考核结束对话框 */}
      <AlertDialog open={showEndedDialog} onOpenChange={setShowEndedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>考核已结束</AlertDialogTitle>
            <AlertDialogDescription>
              此考核已结束，无法进行评分操作。页面将切换为查看模式。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleEndedDialogConfirm}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}