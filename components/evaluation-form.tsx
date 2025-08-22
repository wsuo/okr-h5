"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, ChevronRight, Save, Send, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
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
  SubmitDetailedLeaderRequest,
  SubmitDetailedBossRequest
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
  const [isDirty, setIsDirty] = useState(false)
  const [initialDataHash, setInitialDataHash] = useState<string>('')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showZeroScoreConfirm, setShowZeroScoreConfirm] = useState(false)
  const [zeroScoreItems, setZeroScoreItems] = useState<Array<{categoryName: string, itemName: string}>>([])

  // 创建数据哈希用于比较
  const createDataHash = useCallback((scores: DetailedScore[], review: string, strengths: string, improvements: string) => {
    // 对分数数据进行标准化处理，确保比较的准确性
    const normalizedScores = scores.map(score => ({
      categoryId: score.categoryId,
      categoryScore: score.categoryScore,
      items: score.items.map(item => ({
        itemId: item.itemId,
        score: item.score,
        comment: (item.comment || '').trim()
      })).sort((a, b) => a.itemId.localeCompare(b.itemId)) // 确保顺序一致
    })).sort((a, b) => a.categoryId.localeCompare(b.categoryId)) // 确保顺序一致
    
    const data = {
      scores: normalizedScores,
      review: review.trim(),
      strengths: strengths.trim(),
      improvements: improvements.trim()
    }
    return JSON.stringify(data)
  }, [])

  // 检查数据是否发生变化
  const checkIfDataChanged = useCallback(() => {
    const currentHash = createDataHash(detailedScores, overallReview, strengths, improvements)
    return currentHash !== initialDataHash
  }, [detailedScores, overallReview, strengths, improvements, initialDataHash, createDataHash])

  // 获取当前用户可评分的分类
  const evaluableCategories = useMemo(() => {
    if (!template || !template.categories) return []
    return template.categories.filter(category => 
      category.evaluator_types.includes(type)
    )
  }, [template, type])

  const currentCategory = evaluableCategories[currentCategoryIndex]
  const totalCategories = evaluableCategories.length
  const progressPercentage = ((currentCategoryIndex + 1) / totalCategories) * 100

  // 初始化详细评分数据
  useEffect(() => {
    if (existingDraft) {
      // 加载现有草稿
      const scores = existingDraft.detailed_scores || []
      const review = existingDraft.self_review || existingDraft.leader_review || existingDraft.boss_review || existingDraft.feedback || ''
      const strengthsValue = existingDraft.strengths || ''
      const improvementsValue = existingDraft.improvements || ''
      
      setDetailedScores(scores)
      setOverallReview(review)
      setStrengths(strengthsValue)
      setImprovements(improvementsValue)
      setDraftId(existingDraft.id)
      
      // 设置初始哈希值，此时数据还未被用户修改
      setInitialDataHash(createDataHash(scores, review, strengthsValue, improvementsValue))
      setIsDirty(false)
    } else if (evaluableCategories.length > 0) {
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
      
      // 设置初始哈希值
      setInitialDataHash(createDataHash(initialScores, '', '', ''))
      setIsDirty(false)
    }
  }, [existingDraft, evaluableCategories, createDataHash])

  // 获取当前分类的评分数据
  const getCurrentCategoryScore = useCallback(() => {
    if (!currentCategory) return {
      categoryId: '',
      categoryScore: 0,
      items: []
    }
    
    return detailedScores.find(score => score.categoryId === currentCategory.id) || {
      categoryId: currentCategory.id,
      categoryScore: 0,
      items: currentCategory.items.map(item => ({
        itemId: item.id,
        score: 0,
        comment: ''
      }))
    }
  }, [detailedScores, currentCategory?.id])


  // 更新评分项
  const updateScoreItem = useCallback((itemId: string, scoreItem: DetailedScoreItem) => {
    if (!currentCategory) return
    
    setDetailedScores(prev => {
      const currentScore = prev.find(score => score.categoryId === currentCategory.id) || {
        categoryId: currentCategory.id,
        categoryScore: 0,
        items: currentCategory.items.map(item => ({
          itemId: item.id,
          score: 0,
          comment: ''
        }))
      }
      
      const updatedItems = currentScore.items.map(item => 
        item.itemId === itemId ? scoreItem : item
      )
      
      // 重新计算分类总分
      const categoryScore = evaluationUtils.calculateCategoryScore(updatedItems, currentCategory)
      
      const updatedScore = {
        ...currentScore,
        categoryScore,
        items: updatedItems
      }
      
      // 更新状态
      const otherScores = prev.filter(score => score.categoryId !== currentCategory.id)
      return [...otherScores, updatedScore]
    })
    
    // 标记数据已修改（用户操作）
    setIsDirty(true)
  }, [currentCategory?.id])

  // 计算整体评分
  const calculateOverallScore = useCallback(() => {
    return evaluationUtils.calculateDetailedScore(detailedScores, template)
  }, [detailedScores, template])

  // 处理用户输入的包装函数
  const handleOverallReviewChange = useCallback((value: string) => {
    setOverallReview(value)
    setIsDirty(true)
  }, [])

  const handleStrengthsChange = useCallback((value: string) => {
    setStrengths(value)
    setIsDirty(true)
  }, [])

  const handleImprovementsChange = useCallback((value: string) => {
    setImprovements(value)
    setIsDirty(true)
  }, [])

  // 自动保存草稿
  const autoSaveDraft = useCallback(async () => {
    if (saving || submitting) return

    // 再次确认数据是否真的发生了变化
    if (!checkIfDataChanged()) {
      console.log('数据没有变化，跳过保存')
      setIsDirty(false)
      return
    }

    try {
      setSaving(true)
      
      // 准备草稿数据 - 清理和格式化
      const cleanText = (text: string) => {
        const trimmed = text.trim()
        return trimmed.length > 0 ? trimmed : undefined
      }
      
      const draftData = {
        self_review: type === 'self' ? cleanText(overallReview) : undefined,
        leader_review: type === 'leader' ? cleanText(overallReview) : undefined,
        boss_review: type === 'boss' ? cleanText(overallReview) : undefined,
        strengths: cleanText(strengths),
        improvements: cleanText(improvements),
        detailed_scores: detailedScores.length > 0 ? detailedScores : undefined
      }
      
      // 验证是否有实际内容需要保存
      const hasContent = draftData.self_review || 
                        draftData.leader_review || 
                        draftData.boss_review ||
                        draftData.strengths || 
                        draftData.improvements || 
                        (draftData.detailed_scores && draftData.detailed_scores.length > 0)
      
      if (!hasContent && !draftId) {
        console.log('没有内容需要保存，跳过创建草稿')
        setIsDirty(false)
        return
      }

      let response
      if (draftId) {
        // 更新现有草稿
        console.log(`更新草稿 ID: ${draftId}`, draftData)
        response = await evaluationService.updateEvaluationDraft(draftId, draftData)
        
        // 验证更新响应
        if (!response || response.code !== 200) {
          throw new Error(`更新草稿失败: ${response?.message || '未知错误'}`)
        }
        
        console.log('草稿更新成功')
      } else {
        // 创建新草稿 - 验证必需参数
        if (!assessmentId || !type) {
          throw new Error('创建草稿失败: 缺少必需参数 (assessmentId 或 type)')
        }
        
        // 验证领导评分或Boss评分时必须有 evaluateeId
        if ((type === 'leader' || type === 'boss') && !evaluateeId) {
          throw new Error(`创建草稿失败: ${type === 'leader' ? '领导评分' : 'Boss评分'}必须指定被评估员工ID`)
        }
        
        const createData: CreateEvaluationDraftRequest = {
          assessment_id: assessmentId,
          type,
          ...(evaluateeId && { evaluatee_id: evaluateeId }), // 只在有值时添加
          ...draftData
        }
        
        console.log('创建新草稿', createData)
        response = await evaluationService.createEvaluationDraft(createData)
        
        // 验证创建响应
        if (!response || response.code !== 200) {
          throw new Error(`创建草稿失败: ${response?.message || '未知错误'}`)
        }
        
        if (!response.data || !response.data.id) {
          throw new Error('创建草稿失败: 服务器返回的数据格式无效')
        }
        
        // 保存草稿ID
        setDraftId(response.data.id)
        console.log(`草稿创建成功，ID: ${response.data.id}`)
      }
      
      // 更新状态 - 只有在成功后才更新
      setLastSaved(new Date())
      setIsDirty(false) // 保存成功后重置脏状态
      setInitialDataHash(createDataHash(detailedScores, overallReview, strengths, improvements)) // 更新初始哈希值
      onSaveDraft?.()
      
    } catch (error: any) {
      console.error('自动保存草稿失败:', error)
      
      // 区分错误类型并提供相应的用户反馈
      if (error.message?.includes('网络')) {
        console.warn('网络错误，草稿保存失败，稍后会自动重试')
      } else if (error.message?.includes('权限')) {
        console.error('没有权限保存草稿，请重新登录')
      } else {
        console.error(`保存草稿时发生错误: ${error.message || '未知错误'}`)
      }
      
      // 保存失败时不重置脏状态，让用户知道数据还没有保存
      // isDirty 保持 true，让用户可以手动重试
      
    } finally {
      setSaving(false)
    }
  }, [
    assessmentId, type, evaluateeId, overallReview, strengths, improvements, 
    detailedScores, draftId, saving, submitting, onSaveDraft, createDataHash, checkIfDataChanged
  ])

  // 智能防抖自动保存 - 只在脏状态且数据真正改变时保存
  useEffect(() => {
    if (!isDirty || saving || submitting) return

    // 检查数据是否真的发生了变化
    const hasRealChanges = checkIfDataChanged()
    if (!hasRealChanges) {
      setIsDirty(false) // 如果没有真正的变化，重置脏状态
      return
    }

    const timer = setTimeout(() => {
      if (isDirty && detailedScores.length > 0 && checkIfDataChanged()) {
        autoSaveDraft()
      }
    }, 3000) // 3秒后自动保存，增加防抖时间

    return () => clearTimeout(timer)
  }, [isDirty, saving, submitting, detailedScores, autoSaveDraft, checkIfDataChanged])

  // 页面离开前的保存提醒
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = '您有未保存的修改，确定要离开吗？'
        return '您有未保存的修改，确定要离开吗？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  // 手动保存草稿
  const handleSaveDraft = async () => {
    try {
      await autoSaveDraft()
      // 检查是否真的保存成功了（通过检查 isDirty 状态）
      if (!isDirty) {
        toast.success('草稿保存成功')
      } else {
        toast.error('草稿保存失败，请重试')
      }
    } catch (error: any) {
      console.error('手动保存草稿失败:', error)
      toast.error('保存失败', {
        description: error.message || '请检查网络连接后重试'
      })
    }
  }

  // 检查0分项目
  const checkZeroScoreItems = useCallback(() => {
    const zeroItems: Array<{categoryName: string, itemName: string}> = []
    
    detailedScores.forEach(categoryScore => {
      const category = template.categories.find(c => c.id === categoryScore.categoryId)
      if (category) {
        categoryScore.items.forEach(item => {
          if (item.score === 0) {
            const itemConfig = category.items.find(i => i.id === item.itemId)
            if (itemConfig) {
              zeroItems.push({
                categoryName: category.name,
                itemName: itemConfig.name
              })
            }
          }
        })
      }
    })
    
    return zeroItems
  }, [detailedScores, template])

  // 触发提交确认
  const handleSubmit = () => {
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

    // 检查是否有0分项目
    const zeroItems = checkZeroScoreItems()
    if (zeroItems.length > 0) {
      setZeroScoreItems(zeroItems)
      setShowZeroScoreConfirm(true)
    } else {
      // 没有0分项目，直接显示确认弹窗
      setShowSubmitConfirm(true)
    }
  }

  // 确认提交评估
  const handleConfirmSubmit = async () => {
    setShowSubmitConfirm(false)

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
      } else if (type === 'leader') {
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
      } else if (type === 'boss') {
        if (!evaluateeId) {
          toast.error('缺少被评估人信息')
          return
        }
        const submitData: SubmitDetailedBossRequest = {
          assessment_id: assessmentId,
          evaluatee_id: evaluateeId,
          boss_review: overallReview,
          strengths,
          improvements,
          detailed_scores: detailedScores
        }
        await evaluationService.submitDetailedBossEvaluation(submitData)
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

  // 处理0分项目确认
  const handleZeroScoreConfirm = () => {
    setShowZeroScoreConfirm(false)
    setShowSubmitConfirm(true)
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

  // 早期检查：如果没有可评分分类，返回错误信息
  if (evaluableCategories.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          未找到可评分的分类，请检查模板配置
        </AlertDescription>
      </Alert>
    )
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
                {type === 'self' ? '自我评估' : type === 'leader' ? '领导评分' : '上级评分'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {template.assessment_title} · {template.assessment_period}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {overallScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">预估总分</div>
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {evaluableCategories.map((category, index) => {
              const categoryScore = detailedScores.find(s => s.categoryId === category.id)
              const isCompleted = categoryScore && categoryScore.categoryScore > 0
              const isCurrent = index === currentCategoryIndex
              
              return (
                <button
                  key={category.id}
                  onClick={() => goToCategory(index)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all whitespace-nowrap touch-manipulation min-h-[48px] font-medium ${
                    isCurrent 
                      ? 'bg-slate-800 text-white border-slate-700 shadow-md' 
                      : isCompleted
                        ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 hover:border-green-400'
                        : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {isCompleted && <CheckCircle className="w-4 h-4" />}
                  <span className="font-medium text-sm">{category.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-semibold ${
                      isCurrent 
                        ? 'bg-white/20 text-white border-white/30' 
                        : isCompleted
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                    }`}
                  >
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
              <div className="text-xl font-bold text-primary">
                {currentScore.categoryScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
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
                globalScoringCriteria={template.scoring_criteria}
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
                {type === 'self' ? '自我评价' : type === 'leader' ? '评价意见' : '上级评价'} *
              </Label>
              <Textarea
                id="overall-review"
                placeholder={
                  type === 'self' 
                    ? '请简要总结本期工作表现...' 
                    : type === 'leader'
                      ? '请对该员工的工作表现进行评价...'
                      : '请从上级视角对该员工进行整体评价...'
                }
                value={overallReview}
                onChange={(e) => handleOverallReviewChange(e.target.value)}
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
                onChange={(e) => handleStrengthsChange(e.target.value)}
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
                onChange={(e) => handleImprovementsChange(e.target.value)}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentCategoryIndex === 0 || submitting}
                className="touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                上一项
              </Button>
              
              {currentCategoryIndex < totalCategories - 1 ? (
                <Button
                  onClick={goToNext}
                  disabled={submitting}
                  className="touch-manipulation"
                >
                  下一项
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !overallReview.trim()}
                      className="bg-green-600 hover:bg-green-700 touch-manipulation"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      提交评估
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        确认提交{type === 'self' ? '自评' : type === 'leader' ? '评分' : '上级评分'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        您确定要提交{type === 'self' ? '自评' : type === 'leader' ? '对该员工的评分' : '上级评分'}吗？
                        <br />
                        <span className="text-red-600 font-medium">提交后将无法修改，请确认所有评分内容准确无误。</span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleConfirmSubmit} 
                        className="bg-green-600 hover:bg-green-700"
                      >
                        确定提交
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* 保存状态显示 */}
              <span className="text-xs text-muted-foreground">
                {saving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    保存中...
                  </span>
                ) : isDirty ? (
                  <span className="text-amber-600">已修改</span>
                ) : lastSaved ? (
                  `已保存 ${lastSaved.toLocaleTimeString()}`
                ) : (
                  '未保存'
                )}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="touch-manipulation"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                <span className="hidden sm:inline">保存草稿</span>
                <span className="sm:hidden">保存</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 0分项目确认弹窗 */}
      <AlertDialog open={showZeroScoreConfirm} onOpenChange={setShowZeroScoreConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              发现0分评分项
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>检测到以下评分项为0分，请确认是否继续提交：</p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2">
                    {zeroScoreItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span className="text-sm">
                          <span className="font-medium">{item.categoryName}</span> - {item.itemName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  如果这些0分是您有意为之，请点击"确认无误"继续提交。
                  如果需要修改，请点击"返回修改"。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回修改</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleZeroScoreConfirm}
              className="bg-orange-600 hover:bg-orange-700"
            >
              确认无误
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}