"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import EvaluationForm from "@/components/evaluation-form"
import {
  evaluationService,
  EvaluationTemplate,
  DetailedEvaluation
} from "@/lib/evaluation"
import { useBossEvaluationPermission } from "@/contexts/auth-context"

export default function BossEvaluationFormPage() {
  const params = useParams()
  const router = useRouter()
  const bossPermission = useBossEvaluationPermission()
  
  const assessmentId = parseInt(params.assessmentId as string)
  const evaluateeId = parseInt(params.evaluateeId as string)
  
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null)
  const [existingDraft, setExistingDraft] = useState<DetailedEvaluation | null>(null)
  const [evaluateeInfo, setEvaluateeInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 检查权限
  useEffect(() => {
    if (!bossPermission.canViewTasks()) {
      setError('您没有权限访问Boss评估功能')
      return
    }
    
    // 检查特定用户的评分权限
    const checkPermission = async () => {
      try {
        const response = await evaluationService.checkBossEvaluationPermission(assessmentId, evaluateeId)
        if (response.code === 200 && response.data) {
          if (!response.data.canEvaluate) {
            setError(response.data.message || '您没有权限对该用户进行上级评分')
            return
          }
        }
      } catch (error: any) {
        console.error('检查Boss评分权限失败:', error)
        if (error.message?.includes('403') || error.message?.includes('权限')) {
          setError('您没有权限对该用户进行上级评分')
          return
        }
      }
    }
    
    checkPermission()
  }, [assessmentId, evaluateeId, bossPermission])

  // 加载评估模板和现有草稿
  const loadEvaluationData = async () => {
    try {
      setLoading(true)
      
      // 获取用户专用模板
      const templateResponse = await evaluationService.getUserEvaluationTemplate(assessmentId, evaluateeId)
      if (templateResponse.code === 200 && templateResponse.data) {
        setTemplate(templateResponse.data)
      } else {
        throw new Error('获取评估模板失败')
      }
      
      // 尝试获取现有的Boss评估记录或草稿
      try {
        const evaluationsResponse = await evaluationService.getEvaluations({
          assessment_id: assessmentId,
          evaluatee_id: evaluateeId,
          type: 'boss'
        })
        
        if (evaluationsResponse.code === 200 && evaluationsResponse.data?.items?.length > 0) {
          const evaluation = evaluationsResponse.data.items[0]
          if (evaluation.status === 'draft') {
            // 获取详细草稿数据
            const draftResponse = await evaluationService.getDetailedEvaluation(evaluation.id)
            if (draftResponse.code === 200 && draftResponse.data) {
              setExistingDraft(draftResponse.data)
            }
          } else if (evaluation.status === 'submitted') {
            // 已提交的评估，跳转到查看页面
            toast.info('您已完成对该员工的上级评分')
            router.push(`/boss/evaluation/view/${evaluation.id}`)
            return
          }
        }
      } catch (draftError) {
        // 没有找到现有草稿是正常的，继续加载
        console.log('未找到现有Boss评估草稿，这是正常的')
      }
      
    } catch (error: any) {
      console.error('加载评估数据失败:', error)
      setError(error.message || '加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!error && assessmentId && evaluateeId) {
      loadEvaluationData()
    }
  }, [assessmentId, evaluateeId, error])

  // 处理提交成功
  const handleSubmitSuccess = () => {
    toast.success('上级评分提交成功！')
    router.push('/boss/evaluation')
  }

  // 处理草稿保存成功
  const handleDraftSaved = () => {
    console.log('Boss评估草稿已保存')
  }

  // 返回任务列表
  const goBack = () => {
    router.push('/boss/evaluation')
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务列表
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载评估模板中...
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            未找到评估模板，请联系管理员
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务列表
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>上级评分</span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              <p><strong>考核周期:</strong> {template.assessment_title} - {template.assessment_period}</p>
              <p><strong>被评估人:</strong> 员工ID {evaluateeId}</p>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 评估表单 */}
      <EvaluationForm
        template={template}
        assessmentId={assessmentId}
        evaluateeId={evaluateeId}
        type="boss"
        existingDraft={existingDraft}
        onSubmit={handleSubmitSuccess}
        onSaveDraft={handleDraftSaved}
      />
    </div>
  )
}