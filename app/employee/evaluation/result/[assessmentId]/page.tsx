"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2, FileText, BarChart3, MessageSquare, Star } from "lucide-react"
import EmployeeHeader from "@/components/employee-header"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  evaluationService,
  EvaluationComparison,
  EvaluationTemplate,
  evaluationUtils
} from "@/lib/evaluation"

export default function EmployeeEvaluationResultPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [comparisonData, setComparisonData] = useState<EvaluationComparison | null>(null)
  const [templateData, setTemplateData] = useState<EvaluationTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user) {
      setError('请先登录')
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError("")

        // 并行获取对比数据和模板数据
        const [comparisonResponse, templateResponse] = await Promise.all([
          evaluationService.getEvaluationComparison(assessmentId, user.id),
          evaluationService.getEvaluationTemplate(assessmentId)
        ])
        
        if (comparisonResponse.code === 200 && comparisonResponse.data) {
          setComparisonData(comparisonResponse.data)
        } else {
          throw new Error(comparisonResponse.message || '无法获取评估结果')
        }

        if (templateResponse.code === 200 && templateResponse.data) {
          setTemplateData(templateResponse.data)
        } else {
          console.warn('获取模板数据失败，将使用ID作为显示名称')
        }

      } catch (error: any) {
        console.error('加载评估结果失败:', error)
        setError(error.message || '服务器错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [assessmentId, isAuthenticated, user, authLoading])

  const reloadData = async () => {
    if (!isAuthenticated || !user) {
      setError('请先登录')
      return
    }

    try {
      setLoading(true)
      setError("")

      // 并行获取对比数据和模板数据
      const [comparisonResponse, templateResponse] = await Promise.all([
        evaluationService.getEvaluationComparison(assessmentId, user.id),
        evaluationService.getEvaluationTemplate(assessmentId)
      ])
      
      if (comparisonResponse.code === 200 && comparisonResponse.data) {
        setComparisonData(comparisonResponse.data)
      } else {
        throw new Error(comparisonResponse.message || '无法获取评估结果')
      }

      if (templateResponse.code === 200 && templateResponse.data) {
        setTemplateData(templateResponse.data)
      } else {
        console.warn('获取模板数据失败，将使用ID作为显示名称')
      }

    } catch (error: any) {
      console.error('加载评估结果失败:', error)
      setError(error.message || '服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/employee/evaluation')
  }

  // 根据模板数据获取分类名称
  const getCategoryName = (categoryId: string): string => {
    if (!templateData) return categoryId
    
    const category = templateData.categories.find(cat => cat.id === categoryId)
    return category?.name || categoryId
  }

  // 根据模板数据获取项目名称
  const getItemName = (categoryId: string, itemId: string): string => {
    if (!templateData) return itemId
    
    const category = templateData.categories.find(cat => cat.id === categoryId)
    if (!category) return itemId
    
    const item = category.items.find(item => item.id === itemId)
    return item?.name || itemId
  }

  const getScoreColor = (score: number) => {
    return getOverallScoreLevel(score).color
  }

  // 根据评分标准动态匹配等级
  const getScoreLevelFromCriteria = (score: number, criteria?: any) => {
    if (!criteria) {
      // 如果没有评分标准，使用默认等级
      if (score >= 90) return { level: "优秀", color: "text-green-600", bgColor: "bg-green-100", borderColor: "border-green-200" }
      if (score >= 80) return { level: "良好", color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-200" }
      if (score >= 70) return { level: "合格", color: "text-yellow-600", bgColor: "bg-yellow-100", borderColor: "border-yellow-200" }
      return { level: "待改进", color: "text-red-600", bgColor: "bg-red-100", borderColor: "border-red-200" }
    }

    // 根据评分标准匹配等级
    const levels = [
      { key: 'excellent', level: '优秀', color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-200' },
      { key: 'good', level: '良好', color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' },
      { key: 'average', level: '一般', color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200' },
      { key: 'poor', level: '不足', color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200' }
    ]

    // 按分数从高到低排序标准
    const sortedCriteria = levels
      .filter(level => criteria[level.key])
      .sort((a, b) => (criteria[b.key]?.min || 0) - (criteria[a.key]?.min || 0))

    for (const levelInfo of sortedCriteria) {
      const criterion = criteria[levelInfo.key]
      if (criterion && score >= criterion.min) {
        return {
          level: levelInfo.level,
          color: levelInfo.color,
          bgColor: levelInfo.bgColor,
          borderColor: levelInfo.borderColor,
          description: criterion.description
        }
      }
    }

    // 如果没有匹配的等级，返回最低等级
    const poorCriterion = criteria.poor
    return {
      level: '不足',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      description: poorCriterion?.description || '分数过低'
    }
  }

  // 获取总分等级（使用模板的整体评分标准）
  const getOverallScoreLevel = (score: number) => {
    if (!templateData?.categories?.length) {
      return getScoreLevelFromCriteria(score)
    }

    // 可以使用第一个分类的评分标准作为总分标准，或者使用默认标准
    // 这里使用默认标准，因为通常总分标准和分项标准可能不同
    return getScoreLevelFromCriteria(score)
  }

  // 获取分项等级（使用对应项目的评分标准）
  const getItemScoreLevel = (score: number, categoryId: string, itemId: string) => {
    if (!templateData?.categories?.length) {
      return getScoreLevelFromCriteria(score)
    }

    const category = templateData.categories.find(cat => cat.id === categoryId)
    if (!category) {
      return getScoreLevelFromCriteria(score)
    }

    const item = category.items.find(item => item.id === itemId)
    if (!item?.scoring_criteria) {
      return getScoreLevelFromCriteria(score)
    }

    return getScoreLevelFromCriteria(score, item.scoring_criteria)
  }

  const getScoreLevel = (score: number) => {
    return getOverallScoreLevel(score).level
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (difference < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return "text-green-600"
    if (difference < 0) return "text-red-600"
    return "text-gray-600"
  }

  const formatDifference = (difference: number) => {
    if (difference > 0) return `+${difference.toFixed(1)}`
    return difference.toFixed(1)
  }

  // Helper function to get score difference value from API response
  // Handles both current structure (comparison.overall_difference) and expected structure (comparison_analysis.overall_score_difference)
  const getScoreDifferenceValue = (data: EvaluationComparison | null): number | undefined => {
    if (!data) return undefined

    // First try the expected structure mentioned in the issue
    const comparisonAnalysis = (data as any).comparison_analysis
    if (comparisonAnalysis?.overall_score_difference !== undefined) {
      return Number(comparisonAnalysis.overall_score_difference)
    }

    // Fall back to current structure
    if (data.comparison?.overall_difference !== undefined) {
      return Number(data.comparison.overall_difference)
    }

    // If neither structure has the value, calculate it from individual scores
    if (data.self_evaluation?.score !== undefined && data.leader_evaluation?.score !== undefined) {
      const selfScore = Number(data.self_evaluation.score)
      const leaderScore = Number(data.leader_evaluation.score)
      return leaderScore - selfScore
    }

    return undefined
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">加载用户信息...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 mb-4">请先登录</p>
            <Button onClick={() => router.push('/')}>
              去登录
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeHeader userInfo={user} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载评估结果...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeHeader userInfo={user} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回评估中心
            </Button>
          </div>

          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无法获取评估结果</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={reloadData}>
              重新加载
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeHeader userInfo={user} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回评估中心
            </Button>
          </div>

          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无评估结果</h3>
            <p className="text-gray-600 mb-4">评估尚未完成或数据暂未生成</p>
            <Button variant="outline" onClick={handleBack}>
              返回评估中心
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader userInfo={user} />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回评估中心
          </Button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">评估结果</h1>
            <p className="text-gray-600 mt-1">
              {comparisonData.user_name} · {templateData?.assessment_title || `考核 #${comparisonData.assessment_id}`}
            </p>
          </div>
        </div>

        {/* 总体评分对比 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              总体评分对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* 自评得分 */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-3xl font-bold text-blue-600">
                    {comparisonData.self_evaluation?.score 
                      ? Number(comparisonData.self_evaluation.score).toFixed(1)
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">自评得分</div>
                </div>
                {comparisonData.self_evaluation?.score ? (
                  <div className="space-y-2">
                    <Badge 
                      variant="outline" 
                      className={`${getOverallScoreLevel(Number(comparisonData.self_evaluation.score)).bgColor} ${getOverallScoreLevel(Number(comparisonData.self_evaluation.score)).color} ${getOverallScoreLevel(Number(comparisonData.self_evaluation.score)).borderColor}`}
                    >
                      {getOverallScoreLevel(Number(comparisonData.self_evaluation.score)).level}
                    </Badge>
                    {getOverallScoreLevel(Number(comparisonData.self_evaluation.score)).description && (
                      <div className="text-xs text-gray-500">
                        {getOverallScoreLevel(Number(comparisonData.self_evaluation.score)).description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">未完成</div>
                )}
              </div>
              
              {/* 领导评分 */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-3xl font-bold text-green-600">
                    {comparisonData.leader_evaluation?.score 
                      ? Number(comparisonData.leader_evaluation.score).toFixed(1)
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">领导评分</div>
                </div>
                {comparisonData.leader_evaluation?.score ? (
                  <div className="space-y-2">
                    <Badge 
                      variant="outline" 
                      className={`${getOverallScoreLevel(Number(comparisonData.leader_evaluation.score)).bgColor} ${getOverallScoreLevel(Number(comparisonData.leader_evaluation.score)).color} ${getOverallScoreLevel(Number(comparisonData.leader_evaluation.score)).borderColor}`}
                    >
                      {getOverallScoreLevel(Number(comparisonData.leader_evaluation.score)).level}
                    </Badge>
                    {getOverallScoreLevel(Number(comparisonData.leader_evaluation.score)).description && (
                      <div className="text-xs text-gray-500">
                        {getOverallScoreLevel(Number(comparisonData.leader_evaluation.score)).description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">未完成</div>
                )}
              </div>

              {/* Boss评分 */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-3xl font-bold text-purple-600">
                    {comparisonData.boss_evaluation?.score 
                      ? Number(comparisonData.boss_evaluation.score).toFixed(1)
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {comparisonData.evaluation_status?.boss_enabled ? '老板评分' : '上级评分'}
                  </div>
                </div>
                {comparisonData.boss_evaluation?.score ? (
                  <div className="space-y-2">
                    <Badge 
                      variant="outline" 
                      className={`${getOverallScoreLevel(Number(comparisonData.boss_evaluation.score)).bgColor} ${getOverallScoreLevel(Number(comparisonData.boss_evaluation.score)).color} ${getOverallScoreLevel(Number(comparisonData.boss_evaluation.score)).borderColor}`}
                    >
                      {getOverallScoreLevel(Number(comparisonData.boss_evaluation.score)).level}
                    </Badge>
                    {getOverallScoreLevel(Number(comparisonData.boss_evaluation.score)).description && (
                      <div className="text-xs text-gray-500">
                        {getOverallScoreLevel(Number(comparisonData.boss_evaluation.score)).description}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    {templateData?.scoring_rules?.boss_evaluation?.enabled ? '未完成' : '不适用'}
                  </div>
                )}
              </div>

              {/* 分差分析 */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="space-y-1">
                    {/* 自评与领导评分差 */}
                    {comparisonData.self_evaluation?.score && comparisonData.leader_evaluation?.score && (
                      <div className="flex items-center justify-center gap-1">
                        {(() => {
                          const diff = Number(comparisonData.leader_evaluation.score) - Number(comparisonData.self_evaluation.score)
                          return (
                            <>
                              {diff > 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : diff < 0 ? (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              ) : (
                                <Minus className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={`text-sm font-medium ${
                                diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    )}
                    
                    {/* Boss评分与领导评分差 */}
                    {comparisonData.boss_evaluation?.score && comparisonData.leader_evaluation?.score && (
                      <div className="flex items-center justify-center gap-1">
                        {(() => {
                          const diff = Number(comparisonData.boss_evaluation.score) - Number(comparisonData.leader_evaluation.score)
                          return (
                            <>
                              {diff > 0 ? (
                                <TrendingUp className="w-3 h-3 text-purple-500" />
                              ) : diff < 0 ? (
                                <TrendingDown className="w-3 h-3 text-orange-500" />
                              ) : (
                                <Minus className="w-3 h-3 text-gray-400" />
                              )}
                              <span className={`text-xs ${
                                diff > 0 ? 'text-purple-600' : diff < 0 ? 'text-orange-600' : 'text-gray-600'
                              }`}>
                                Boss {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">评分差异</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    领导 vs 自评
                  </div>
                  {comparisonData.boss_evaluation?.score && (
                    <div className="text-xs text-gray-500">
                      {comparisonData.evaluation_status?.boss_enabled ? '老板 vs 领导' : '上级 vs 领导'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="comparison" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comparison">分项对比</TabsTrigger>
            <TabsTrigger value="self">自评详情</TabsTrigger>
            <TabsTrigger value="leader">领导评分</TabsTrigger>
            <TabsTrigger value="boss" disabled={!comparisonData.boss_evaluation}>
              {comparisonData.evaluation_status?.boss_enabled ? '老板评分' : '上级评分'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>分项评分对比</CardTitle>
                <CardDescription>各个评分项目的详细对比分析</CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.self_evaluation && comparisonData.leader_evaluation ? (
                <div className="space-y-6">
                  {comparisonData.self_evaluation.detailed_scores.map((selfCategory, index) => {
                    // 找到对应的领导评分分类
                    const leaderCategory = comparisonData.leader_evaluation?.detailed_scores.find(
                      cat => cat.categoryId === selfCategory.categoryId
                    )
                    
                    if (!leaderCategory) return null
                    
                    const categoryDifference = Number(leaderCategory.categoryScore) - Number(selfCategory.categoryScore)
                    const categoryName = getCategoryName(selfCategory.categoryId)
                    
                    return (
                      <div key={selfCategory.categoryId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{categoryName}</h3>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(categoryDifference)}
                            <span className={`font-medium ${getDifferenceColor(categoryDifference)}`}>
                              {formatDifference(categoryDifference)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {Number(selfCategory.categoryScore).toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">自评得分</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {Number(leaderCategory.categoryScore).toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">领导评分</div>
                          </div>
                        </div>

                        {/* 详细项目对比 */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700">详细项目对比</h4>
                          {selfCategory.items.map((selfItem) => {
                            // 找到对应的领导评分项目
                            const leaderItem = leaderCategory.items.find(
                              item => item.itemId === selfItem.itemId
                            )
                            
                            if (!leaderItem) return null
                            
                            const itemDifference = Number(leaderItem.score) - Number(selfItem.score)
                            const itemName = getItemName(selfCategory.categoryId, selfItem.itemId)
                            const selfLevel = getItemScoreLevel(Number(selfItem.score), selfCategory.categoryId, selfItem.itemId)
                            const leaderLevel = getItemScoreLevel(Number(leaderItem.score), selfCategory.categoryId, selfItem.itemId)
                            
                            return (
                              <div key={selfItem.itemId} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-medium">{itemName}</span>
                                  <div className="flex items-center gap-2">
                                    {getDifferenceIcon(itemDifference)}
                                    <span className={`text-sm ${getDifferenceColor(itemDifference)}`}>
                                      {formatDifference(itemDifference)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600 text-sm">自评：</span>
                                      <span className="font-medium">{Number(selfItem.score).toFixed(1)}</span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${selfLevel.bgColor} ${selfLevel.color} ${selfLevel.borderColor}`}
                                    >
                                      {selfLevel.level}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600 text-sm">领导：</span>
                                      <span className="font-medium">{Number(leaderItem.score).toFixed(1)}</span>
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${leaderLevel.bgColor} ${leaderLevel.color} ${leaderLevel.borderColor}`}
                                    >
                                      {leaderLevel.level}
                                    </Badge>
                                  </div>
                                </div>
                                
                                {/* 等级差异提示 */}
                                {selfLevel.level !== leaderLevel.level && (
                                  <div className="mt-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                                    等级差异：自评为"{selfLevel.level}"，领导评价为"{leaderLevel.level}"
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>暂无对比数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="self" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  自评详情
                </CardTitle>
                <CardDescription>
                  您的自我评估内容和详细评分
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.self_evaluation ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {Number(comparisonData.self_evaluation.score).toFixed(1)}
                      </div>
                      <div className="text-gray-600">
                        {getScoreLevel(Number(comparisonData.self_evaluation.score))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {comparisonData.self_evaluation.detailed_scores.map((category) => (
                        <div key={category.categoryId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                              {getCategoryName(category.categoryId)}
                            </h3>
                            <Badge variant="outline">
                              {Number(category.categoryScore).toFixed(1)}分
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {category.items.map((item) => {
                              const itemLevel = getItemScoreLevel(Number(item.score), category.categoryId, item.itemId)
                              return (
                                <div key={item.itemId} className="bg-blue-50 rounded-lg p-3">
                                  {/* 主要信息水平排列 */}
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="font-medium truncate">
                                        {getItemName(category.categoryId, item.itemId)}
                                      </span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs whitespace-nowrap ${itemLevel.bgColor} ${itemLevel.color} ${itemLevel.borderColor}`}
                                      >
                                        {itemLevel.level}
                                      </Badge>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-blue-600 font-medium text-lg">
                                        {Number(item.score).toFixed(1)}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">分</span>
                                    </div>
                                  </div>
                                  
                                  {/* 等级描述和评论 */}
                                  <div className="space-y-1">
                                    {itemLevel.description && (
                                      <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded">
                                        {itemLevel.description}
                                      </div>
                                    )}
                                    {item.comment && (
                                      <p className="text-sm text-gray-600 bg-white/50 px-2 py-1 rounded">{item.comment}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>尚未完成自评</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leader" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  领导评分详情
                </CardTitle>
                <CardDescription>
                  领导对您的评估内容和详细评分
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.leader_evaluation ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {Number(comparisonData.leader_evaluation.score).toFixed(1)}
                      </div>
                      <div className="text-gray-600">
                        {getScoreLevel(Number(comparisonData.leader_evaluation.score))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {comparisonData.leader_evaluation.detailed_scores.map((category) => (
                        <div key={category.categoryId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                              {getCategoryName(category.categoryId)}
                            </h3>
                            <Badge variant="outline">
                              {Number(category.categoryScore).toFixed(1)}分
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {category.items.map((item) => {
                              const itemLevel = getItemScoreLevel(Number(item.score), category.categoryId, item.itemId)
                              return (
                                <div key={item.itemId} className="bg-purple-50 rounded-lg p-3">
                                  {/* 主要信息水平排列 */}
                                  <div className="flex items-center justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="font-medium truncate">
                                        {getItemName(category.categoryId, item.itemId)}
                                      </span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs whitespace-nowrap ${itemLevel.bgColor} ${itemLevel.color} ${itemLevel.borderColor}`}
                                      >
                                        {itemLevel.level}
                                      </Badge>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-purple-600 font-medium text-lg">
                                        {Number(item.score).toFixed(1)}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">分</span>
                                    </div>
                                  </div>
                                  
                                  {/* 等级描述和评论 */}
                                  <div className="space-y-1">
                                    {itemLevel.description && (
                                      <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded">
                                        {itemLevel.description}
                                      </div>
                                    )}
                                    {item.comment && (
                                      <p className="text-sm text-gray-600 bg-white/50 px-2 py-1 rounded">{item.comment}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>领导尚未完成评分</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boss" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  {comparisonData.evaluation_status?.boss_enabled ? '老板评分详情' : '上级评分详情'}
                </CardTitle>
                <CardDescription>
                  {comparisonData.evaluation_status?.boss_enabled ? '老板对您的评估内容和详细评分' : '上级对您的评估内容和详细评分'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.boss_evaluation ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {Number(comparisonData.boss_evaluation.score).toFixed(1)}
                      </div>
                      <div className="text-gray-600">
                        {getScoreLevel(Number(comparisonData.boss_evaluation.score))}
                      </div>
                    </div>
                    {comparisonData.boss_evaluation.detailed_scores ? (
                    <div className="space-y-4">
                      {comparisonData.boss_evaluation.detailed_scores.map((category) => (
                        <div key={category.categoryId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                              {getCategoryName(category.categoryId)}
                            </h3>
                            <Badge variant="outline">
                              {Number(category.categoryScore).toFixed(1)} 分
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {category.items.map((item) => {
                              const itemLevel = getItemScoreLevel(item.score, category.categoryId, item.itemId)
                              return (
                                <div key={item.itemId} className="p-3 bg-purple-50 rounded-lg">
                                  {/* 项目标题和分数 */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="font-medium truncate">
                                        {getItemName(category.categoryId, item.itemId)}
                                      </span>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs whitespace-nowrap ${itemLevel.bgColor} ${itemLevel.color} ${itemLevel.borderColor}`}
                                      >
                                        {itemLevel.level}
                                      </Badge>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <span className="text-purple-600 font-medium text-lg">
                                        {Number(item.score).toFixed(1)}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">分</span>
                                    </div>
                                  </div>
                                  
                                  {/* 等级描述和评论 */}
                                  <div className="space-y-1">
                                    {itemLevel.description && (
                                      <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded">
                                        {itemLevel.description}
                                      </div>
                                    )}
                                    {item.comment && (
                                      <p className="text-sm text-gray-600 bg-white/50 px-2 py-1 rounded">{item.comment}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    ) : (
                    <div className="space-y-4">
                      {/* 显示反馈信息，无详细分项 */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          评估反馈
                        </h3>
                        
                        <div className="space-y-3">
                          {comparisonData.boss_evaluation.feedback && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">总体反馈</label>
                              <p className="text-gray-600 bg-white p-3 rounded border">
                                {comparisonData.boss_evaluation.feedback}
                              </p>
                            </div>
                          )}
                          
                          {comparisonData.boss_evaluation.strengths && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">优势与亮点</label>
                              <p className="text-gray-600 bg-white p-3 rounded border">
                                {comparisonData.boss_evaluation.strengths}
                              </p>
                            </div>
                          )}
                          
                          {comparisonData.boss_evaluation.improvements && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">改进建议</label>
                              <p className="text-gray-600 bg-white p-3 rounded border">
                                {comparisonData.boss_evaluation.improvements}
                              </p>
                            </div>
                          )}
                          
                          {comparisonData.boss_evaluation.submitted_at && (
                            <div className="text-sm text-gray-500 pt-2 border-t">
                              提交时间：{new Date(comparisonData.boss_evaluation.submitted_at).toLocaleString('zh-CN')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>
                      {templateData?.scoring_rules?.boss_evaluation?.enabled 
                        ? (comparisonData.evaluation_status?.boss_enabled ? '老板尚未完成评分' : '上级尚未完成评分')
                        : '此考核不包含上级评分'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}