"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Save, Send, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import EvaluationItemComponent from "./evaluation-item"
import {
  EvaluationTemplate,
  DetailedScore,
  DetailedScoreItem,
  EvaluationType,
  evaluationUtils,
  evaluationService,
  CreateEvaluationDraftRequest,
  UpdateEvaluationDraftRequest,
  SubmitDetailedSelfRequest,
  SubmitDetailedLeaderRequest
} from "@/lib/evaluation"

interface EvaluationFormProps {
  template: EvaluationTemplate
  assessmentId: number
  evaluateeId?: number // 领导评分时需要
  type: EvaluationType
  existingDraft?: any // 现有草稿数据
  onSubmit?: () => void
  onSaveDraft?: () => void
}

export default function EvaluationForm({
  template,
  assessmentId,
  evaluateeId,
  type,
  existingDraft,
  onSubmit,
  onSaveDraft
}: EvaluationFormProps) {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [detailedScores, setDetailedScores] = useState<DetailedScore[]>([])
  const [overallReview, setOverallReview] = useState('')
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  const [draftId, setDraftId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 获取当前用户可评分的分类
  const evaluableCategories = template.categories.filter(category => 
    category.evaluator_types.includes(type)
  )

  const currentCategory = evaluableCategories[currentCategoryIndex]
  const totalCategories = evaluableCategories.length
  const progressPercentage = ((currentCategoryIndex + 1) / totalCategories) * 100

  // 初始化详细评分数据
  useEffect(() => {
    if (existingDraft) {
      // 加载现有草稿
      setDetailedScores(existingDraft.detailed_scores || [])
      setOverallReview(existingDraft.self_review || existingDraft.leader_review || '')
      setStrengths(existingDraft.strengths || '')
      setImprovements(existingDraft.improvements || '')
      setDraftId(existingDraft.id)
    } else {
      // 初始化空数据
      const initialScores: DetailedScore[] = evaluableCategories.map(category => ({
        categoryId: category.id,
        categoryScore: 0,
        items: category.items.map(item => ({
          itemId: item.id,
          score: 0,
          comment: ''
        }))
      }))
      setDetailedScores(initialScores)
    }
  }, [existingDraft, evaluableCategories])

  // 获取当前分类的评分数据
  const getCurrentCategoryScore = useCallback(() => {
    return detailedScores.find(score => score.categoryId === currentCategory?.id) || {
      categoryId: currentCategory?.id || '',
      categoryScore: 0,
      items: currentCategory?.items.map(item => ({
        itemId: item.id,
        score: 0,
        comment: ''
      })) || []
    }
  }, [detailedScores, currentCategory])

  // 更新当前分类的评分数据
  const updateCurrentCategoryScore = useCallback((categoryScore: DetailedScore) => {
    setDetailedScores(prev => {
      const updated = prev.filter(score => score.categoryId !== categoryScore.categoryId)
      return [...updated, categoryScore]
    })
  }, [])

  // 更新评分项
  const updateScoreItem = useCallback((itemId: string, scoreItem: DetailedScoreItem) => {
    const currentScore = getCurrentCategoryScore()
    const updatedItems = currentScore.items.map(item => 
      item.itemId === itemId ? scoreItem : item
    )
    
    // 重新计算分类总分
    const categoryScore = currentCategory ? 
      evaluationUtils.calculateCategoryScore(updatedItems, currentCategory) : 0
    
    updateCurrentCategoryScore({
      ...currentScore,
      categoryScore,
      items: updatedItems
    })
  }, [getCurrentCategoryScore, currentCategory, updateCurrentCategoryScore])

  // 计算整体评分
  const calculateOverallScore = useCallback(() => {
    return evaluationUtils.calculateDetailedScore(detailedScores, template)
  }, [detailedScores, template])

  // 自动保存草稿
  const autoSaveDraft = useCallback(async () => {
    if (saving || submitting) return

    try {
      setSaving(true)
      
      const draftData = {
        self_review: type === 'self' ? overallReview : undefined,
        leader_review: type === 'leader' ? overallReview : undefined,
        strengths,
        improvements,
        detailed_scores: detailedScores
      }

      if (draftId) {
        // 更新现有草稿
        await evaluationService.updateEvaluationDraft(draftId, draftData)
      } else {
        // 创建新草稿
        const createData: CreateEvaluationDraftRequest = {
          assessment_id: assessmentId,
          type,
          evaluatee_id: evaluateeId,
          ...draftData
        }
        const response = await evaluationService.createEvaluationDraft(createData)
        if (response.code === 200 && response.data) {
          setDraftId(response.data.id)
        }
      }
      
      setLastSaved(new Date())
      onSaveDraft?.()
    } catch (error: any) {
      console.error('自动保存草稿失败:', error)
    } finally {
      setSaving(false)
    }
  }, [
    assessmentId, type, evaluateeId, overallReview, strengths, improvements, 
    detailedScores, draftId, saving, submitting, onSaveDraft
  ])

  // 防抖自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      if (detailedScores.length > 0) {
        autoSaveDraft()
      }
    }, 1000) // 1秒后自动保存

    return () => clearTimeout(timer)
  }, [detailedScores, overallReview, strengths, improvements, autoSaveDraft])

  // 手动保存草稿
  const handleSaveDraft = async () => {
    await autoSaveDraft()
    toast.success('草稿已保存')
  }

  // 提交评估
  const handleSubmit = async () => {
    // 验证数据
    const errors = evaluationUtils.validateDetailedScores(detailedScores, template)
    if (errors.length > 0) {
      toast.error('评分数据有误', {
        description: errors.join('; ')
      })
      return
    }

    if (!overallReview.trim()) {
      toast.error('请填写总体评价')
      return
    }

    try {
      setSubmitting(true)

      if (type === 'self') {
        const submitData: SubmitDetailedSelfRequest = {
          assessment_id: assessmentId,
          self_review: overallReview,
          strengths,
          improvements,
          detailed_scores: detailedScores
        }
        await evaluationService.submitDetailedSelfEvaluation(submitData)
        toast.success('自评提交成功')
      } else {
        if (!evaluateeId) {
          toast.error('缺少被评估人信息')
          return
        }
        const submitData: SubmitDetailedLeaderRequest = {
          assessment_id: assessmentId,
          evaluatee_id: evaluateeId,
          leader_review: overallReview,
          strengths,
          improvements,
          detailed_scores: detailedScores
        }
        await evaluationService.submitDetailedLeaderEvaluation(submitData)
        toast.success('领导评分提交成功')
      }

      onSubmit?.()
    } catch (error: any) {
      console.error('提交评估失败:', error)
      toast.error('提交失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 导航到上一个分类
  const goToPrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1)
    }
  }

  // 导航到下一个分类
  const goToNext = () => {
    if (currentCategoryIndex < totalCategories - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1)
    }
  }

  // 跳转到指定分类
  const goToCategory = (index: number) => {
    setCurrentCategoryIndex(index)
  }

  const currentScore = getCurrentCategoryScore()
  const overallScore = calculateOverallScore()

  if (!currentCategory) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          未找到可评分的分类，请检查模板配置
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 进度条和总体信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {type === 'self' ? '自我评估' : '领导评分'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {template.assessment_title} · {template.assessment_period}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {overallScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">预估总分</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>评分进度</span>
              <span>{currentCategoryIndex + 1} / {totalCategories}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* 分类导航 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {evaluableCategories.map((category, index) => {
              const categoryScore = detailedScores.find(s => s.categoryId === category.id)
              const isCompleted = categoryScore && categoryScore.categoryScore > 0
              const isCurrent = index === currentCategoryIndex
              
              return (
                <button
                  key={category.id}
                  onClick={() => goToCategory(index)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    isCurrent 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : isCompleted
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isCompleted && <CheckCircle className="w-4 h-4" />}
                  <span className="font-medium">{category.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {categoryScore?.categoryScore.toFixed(1) || '0.0'}
                  </Badge>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 当前分类评分 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{currentCategory.name}</CardTitle>
              <p className="text-gray-600 mt-1">{currentCategory.description}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                {currentScore.categoryScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">
                权重: {currentCategory.weight}%
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {currentCategory.items.map(item => {
            const scoreItem = currentScore.items.find(si => si.itemId === item.id) || {
              itemId: item.id,
              score: 0,
              comment: ''
            }
            
            return (
              <EvaluationItemComponent
                key={item.id}
                item={item}
                value={scoreItem}
                onChange={(value) => updateScoreItem(item.id, value)}
                disabled={submitting}
              />
            )
          })}
        </CardContent>
      </Card>

      {/* 最后一个分类显示总体评价 */}
      {currentCategoryIndex === totalCategories - 1 && (
        <Card>
          <CardHeader>
            <CardTitle>总体评价</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="overall-review" className="text-sm font-medium">
                {type === 'self' ? '自我评价' : '评价意见'} *
              </Label>
              <Textarea
                id="overall-review"
                placeholder={type === 'self' ? '请简要总结本期工作表现...' : '请对该员工的工作表现进行评价...'}
                value={overallReview}
                onChange={(e) => setOverallReview(e.target.value)}
                disabled={submitting}
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="strengths" className="text-sm font-medium">
                优势亮点
              </Label>
              <Textarea
                id="strengths"
                placeholder="请列举主要优势和亮点..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                disabled={submitting}
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="improvements" className="text-sm font-medium">
                改进建议
              </Label>
              <Textarea
                id="improvements"
                placeholder="请提出改进建议和发展方向..."
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                disabled={submitting}
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentCategoryIndex === 0 || submitting}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                上一项
              </Button>
              
              {currentCategoryIndex < totalCategories - 1 ? (
                <Button
                  onClick={goToNext}
                  disabled={submitting}
                >
                  下一项
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !overallReview.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  提交评估
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-500">
                  {saving ? '保存中...' : `已保存 ${lastSaved.toLocaleTimeString()}`}
                </span>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                保存草稿
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}