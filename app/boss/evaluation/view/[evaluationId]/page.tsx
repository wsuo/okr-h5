"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, AlertTriangle, User, Calendar, Star } from "lucide-react"
import {
  evaluationService,
  DetailedEvaluation,
  evaluationUtils
} from "@/lib/evaluation"
import { useBossEvaluationPermission } from "@/contexts/auth-context"

export default function BossEvaluationViewPage() {
  const params = useParams()
  const router = useRouter()
  const bossPermission = useBossEvaluationPermission()
  
  const evaluationId = parseInt(params.evaluationId as string)
  
  const [evaluation, setEvaluation] = useState<DetailedEvaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载评估详情
  const loadEvaluation = async () => {
    try {
      setLoading(true)
      
      const response = await evaluationService.getDetailedEvaluation(evaluationId)
      if (response.code === 200 && response.data) {
        const evaluationData = response.data
        
        // 检查权限
        if (!bossPermission.canViewResults(evaluationData.evaluatee)) {
          setError('您没有权限查看该评估结果')
          return
        }
        
        setEvaluation(evaluationData)
      } else {
        throw new Error('获取评估详情失败')
      }
    } catch (error: any) {
      console.error('加载评估详情失败:', error)
      setError(error.message || '加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (evaluationId) {
      loadEvaluation()
    }
  }, [evaluationId])

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
        加载评估详情中...
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            未找到评估记录
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
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回任务列表
        </Button>
      </div>

      {/* 评估概览 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                上级评分详情
              </CardTitle>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p className="flex items-center gap-2">
                  <strong>被评估人:</strong> 
                  {evaluation.evaluatee?.name || `用户ID ${evaluation.evaluatee_id}`}
                  {evaluation.evaluatee?.department && (
                    <Badge variant="outline">{evaluation.evaluatee.department.name}</Badge>
                  )}
                </p>
                {evaluation.assessment && (
                  <p><strong>考核周期:</strong> {evaluation.assessment.title} - {evaluation.assessment.period}</p>
                )}
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <strong>提交时间:</strong> {evaluationUtils.formatDateTime(evaluation.submitted_at || '')}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-primary">
                  {evaluation.score?.toFixed(1) || '--'}
                </span>
              </div>
              <Badge 
                variant={evaluation.status === 'submitted' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {evaluationUtils.getStatusText(evaluation.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 详细评分 */}
      {evaluation.detailed_scores && evaluation.detailed_scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>详细评分</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {evaluation.detailed_scores.map((categoryScore) => (
              <div key={categoryScore.categoryId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{categoryScore.categoryId}</h3>
                  <div className="text-xl font-bold text-primary">
                    {categoryScore.categoryScore.toFixed(1)}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {categoryScore.items.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <div className="font-medium">{item.itemId}</div>
                        {item.comment && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {item.comment}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 评价内容 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* 上级评价 */}
        {evaluation.boss_review && (
          <Card>
            <CardHeader>
              <CardTitle>上级评价</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {evaluation.boss_review}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 优势亮点 */}
        {evaluation.strengths && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">优势亮点</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {evaluation.strengths}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 改进建议 */}
        {evaluation.improvements && (
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">改进建议</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {evaluation.improvements}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}