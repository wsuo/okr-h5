"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, AlertTriangle, FileText } from "lucide-react"
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
import EmployeeHeader from "@/components/employee-header"
import EvaluationForm from "@/components/evaluation-form"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationTemplate,
  DetailedEvaluation,
  evaluationUtils
} from "@/lib/evaluation"
import { useEvaluationPageMonitor } from "@/hooks/use-assessment-status"
import { safeParseUserInfo } from "@/lib/utils"

export default function EmployeeSelfEvaluationPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null)
  const [existingDraft, setExistingDraft] = useState<DetailedEvaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 使用状态监听Hook
  const {
    currentStatus,
    viewMode,
    showEndedDialog,
    setViewMode,
    setShowEndedDialog,
    handleEndedDialogConfirm,
    handleEvaluationError,
    manualCheck
  } = useEvaluationPageMonitor(assessmentId, !loading && !!template)

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }
    
    loadData()
  }, [assessmentId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      // 首先检查考核状态
      const statusResponse = await evaluationService.checkAssessmentStatus(assessmentId)
      if (statusResponse.code === 200 && statusResponse.data) {
        // 如果考核已结束，设置为查看模式
        if (!statusResponse.data.canEvaluate) {
          setViewMode(true)
        }
      }

      // 获取评分模板
      const templateResponse = await evaluationService.getEvaluationTemplate(assessmentId)
      if (templateResponse.code !== 200 || !templateResponse.data) {
        throw new Error(templateResponse.message || '无法获取评分模板')
      }

      setTemplate(templateResponse.data)

      // 检查是否有现有的自评记录或草稿
      try {
        const myEvaluationsResponse = await evaluationService.getMyEvaluations(assessmentId)
        if (myEvaluationsResponse.code === 200 && myEvaluationsResponse.data) {
          const selfEvaluation = myEvaluationsResponse.data.find(evaluation => evaluation.type === 'self')
          if (selfEvaluation) {
            if (selfEvaluation.status === 'submitted' || selfEvaluation.status === 'completed') {
              // 已提交的自评，跳转到结果页面
              toast.info('您已完成自评', {
                description: '正在跳转到评估结果页面'
              })
              router.replace(`/employee/evaluation/result/${assessmentId}`)
              return
            } else if (selfEvaluation.status === 'draft') {
              // 加载草稿数据
              const draftResponse = await evaluationService.getDetailedEvaluation(selfEvaluation.id)
              if (draftResponse.code === 200 && draftResponse.data) {
                setExistingDraft(draftResponse.data)
              }
            }
          }
        }
      } catch (draftError) {
        // 获取草稿失败不影响主流程
        console.warn('获取自评草稿失败:', draftError)
      }

    } catch (error: any) {
      console.error('加载评估数据失败:', error)
      setError(error.message || '服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSuccess = () => {
    toast.success('自评提交成功', {
      description: '感谢您的配合，正在跳转到结果页面'
    })
    router.push(`/employee/evaluation/result/${assessmentId}`)
  }

  const handleSubmitError = (error: any) => {
    const errorInfo = handleEvaluationError(error)

    if (!errorInfo.shouldShowDialog) {
      toast.error(errorInfo.message)
    }
  }

  const handleDraftSaved = () => {
    // 草稿保存成功的回调，可以在这里更新UI状态
  }

  const handleBack = () => {
    router.push('/employee')
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
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载评估模板...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回个人中心
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

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回个人中心
            </Button>
          </div>

          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">评估模板不存在</h3>
            <p className="text-gray-600 mb-4">该考核的评估模板可能已被删除或暂未配置</p>
            <Button variant="outline" onClick={handleBack}>
              返回个人中心
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 检查模板是否支持自评
  const selfEvaluationEnabled = template.scoring_rules.self_evaluation.enabled
  if (!selfEvaluationEnabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回个人中心
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              该考核未启用自评功能，请等待领导评分完成
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader userInfo={userInfo} />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={handleBack} className="mb-6 hover:bg-accent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回个人中心
          </Button>
          
          <div className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6 border border-border/50">
            <h1 className="text-3xl font-bold text-foreground mb-2">{template.assessment_title}</h1>
            <p className="text-muted-foreground text-lg mb-4">
              {template.assessment_period} · 自我评估
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30">
                <span className="font-medium text-primary">自评权重:</span>
                <span className="ml-1 font-bold">{(template.scoring_rules.self_evaluation.weight_in_final * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-background/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/30">
                <span className="font-medium text-primary">满分:</span>
                <span className="ml-1 font-bold">{template.total_score}分</span>
              </div>
            </div>
          </div>
        </div>

        {/* 考核状态提示 */}
        {viewMode && currentStatus && (
          <Alert className="mb-6" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {currentStatus.message || '考核已结束，只能查看评估结果'}
            </AlertDescription>
          </Alert>
        )}

        {existingDraft && !viewMode && (
          <Alert className="mb-6">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              检测到未完成的评估草稿，已为您自动加载。上次保存时间: {' '}
              {evaluationUtils.formatDateTime(existingDraft.updated_at)}
            </AlertDescription>
          </Alert>
        )}

        <EvaluationForm
          template={template}
          assessmentId={assessmentId}
          type="self"
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