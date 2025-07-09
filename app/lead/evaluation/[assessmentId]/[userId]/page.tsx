"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2, AlertTriangle, FileText, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

export default function LeaderEvaluationPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  const userId = parseInt(params.userId as string)
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluateeInfo, setEvaluateeInfo] = useState<UserType | null>(null)
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null)
  const [existingDraft, setExistingDraft] = useState<DetailedEvaluation | null>(null)
  const [selfEvaluationStatus, setSelfEvaluationStatus] = useState<{
    completed: boolean
    completedAt?: string
  }>({ completed: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }
    
    loadData()
  }, [assessmentId, userId])

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")

      // 并行加载多个数据
      const [templateResponse, evaluateeResponse] = await Promise.all([
        evaluationService.getUserEvaluationTemplate(assessmentId, userId),
        userService.getUserById(userId)
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
          const selfEvaluation = evaluationsResponse.data.items.find(evaluation => 
            evaluation.evaluatee_id === userId && evaluation.type === 'self'
          )
          
          if (selfEvaluation && (selfEvaluation.status === 'submitted' || selfEvaluation.status === 'completed')) {
            setSelfEvaluationStatus({
              completed: true,
              completedAt: selfEvaluation.updated_at
            })
          }
        }
      } catch (selfEvalError) {
        console.warn('获取自评状态失败:', selfEvalError)
      }

      // 检查是否有现有的领导评分记录或草稿
      try {
        const myEvaluationsResponse = await evaluationService.getEvaluations({
          assessment_id: assessmentId,
          evaluatee_id: userId,
          type: 'leader'
        })
        
        if (myEvaluationsResponse.code === 200 && myEvaluationsResponse.data) {
          const leaderEvaluation = myEvaluationsResponse.data.items.find(evaluation => 
            evaluation.evaluatee_id === userId && evaluation.type === 'leader'
          )
          
          if (leaderEvaluation) {
            if (leaderEvaluation.status === 'submitted' || leaderEvaluation.status === 'completed') {
              // 已提交的评分，跳转到结果页面
              toast.info('您已完成对该员工的评分', {
                description: '正在跳转到结果页面'
              })
              router.replace(`/lead/evaluation/result/${assessmentId}`)
              return
            } else if (leaderEvaluation.status === 'draft') {
              // 加载草稿数据
              const draftResponse = await evaluationService.getDetailedEvaluation(leaderEvaluation.id)
              if (draftResponse.code === 200 && draftResponse.data) {
                setExistingDraft(draftResponse.data)
              }
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
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{template.assessment_title}</h1>
            <p className="text-gray-600 mt-1">
              {template.assessment_period} · 领导评分
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <span>领导评分权重: {template.scoring_rules.leader_evaluation.weight_in_final}%</span>
              <span className="mx-2">·</span>
              <span>满分: {template.total_score}分</span>
            </div>
          </div>
        </div>

        {/* 被评估人信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              被评估人信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {evaluateeInfo.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{evaluateeInfo.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{evaluateeInfo.department?.name || '未分配部门'}</span>
                    <span>·</span>
                    <span>{evaluateeInfo.position || '未设置职位'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-1">自评状态</div>
                {selfEvaluationStatus.completed ? (
                  <div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      已完成
                    </Badge>
                    {selfEvaluationStatus.completedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {evaluationUtils.formatDateTime(selfEvaluationStatus.completedAt)}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    未完成
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 自评未完成提醒 */}
        {!selfEvaluationStatus.completed && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              该员工尚未完成自评，您仍可以进行评分，但建议等待自评完成后再进行评价以获得更全面的信息。
            </AlertDescription>
          </Alert>
        )}

        {/* 草稿恢复提醒 */}
        {existingDraft && (
          <Alert className="mb-6">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              检测到未完成的评分草稿，已为您自动加载。上次保存时间: {' '}
              {evaluationUtils.formatDateTime(existingDraft.updated_at)}
            </AlertDescription>
          </Alert>
        )}

        {/* 评分说明 */}
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>评分说明：</strong> 为确保评分的公正性，您无法查看该员工的自评分数和评论。
            请根据您对其工作表现的了解进行客观评价。
          </AlertDescription>
        </Alert>

        <EvaluationForm
          template={template}
          assessmentId={assessmentId}
          evaluateeId={userId}
          type="leader"
          existingDraft={existingDraft}
          onSubmit={handleSubmitSuccess}
          onSaveDraft={handleDraftSaved}
        />
      </div>
    </div>
  )
}