"use client"

import { useState, useEffect, useMemo, ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, User, Award, Calendar, Loader2, FileText, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  evaluationService,
  EvaluationComparison,
  evaluationUtils
} from "@/lib/evaluation"
import { safeParseUserInfo } from "@/lib/utils"

// 组件配置接口
export interface EvaluationComparisonViewProps {
  assessmentId: number
  userId: number
  role: 'boss' | 'lead'
  HeaderComponent: React.ComponentType<any>
  backPath: string
  backLabel: string
  pageTitle: string
  pageDescription: string
}

export default function EvaluationComparisonView({
  assessmentId,
  userId,
  role,
  HeaderComponent,
  backPath,
  backLabel,
  pageTitle,
  pageDescription
}: EvaluationComparisonViewProps) {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [comparisonData, setComparisonData] = useState<EvaluationComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const safeToFixed = (value: any, digits: number = 1): string => {
    if (value === null || value === undefined) return '--'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? '--' : num.toFixed(digits)
  }

  const safeToNumber = (value: any): number => {
    if (value === null || value === undefined) return 0
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? 0 : num
  }

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }

    loadComparisonData()
  }, [assessmentId, userId])

  const loadComparisonData = async () => {
    try {
      setLoading(true)
      setError("")

      const response = await evaluationService.getEvaluationComparison(assessmentId, userId)
      if (response.code === 200 && response.data) {
        setComparisonData(response.data)
      } else {
        setError(response.message || '获取对比数据失败')
      }
    } catch (error: any) {
      console.error('加载对比数据失败:', error)
      setError(error.message || '服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push(backPath)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLevel = (score: number) => {
    if (score >= 90) return "优秀"
    if (score >= 80) return "良好"
    if (score >= 70) return "合格"
    return "待改进"
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (difference < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  const getDifferenceDescription = (difference: number) => {
    if (difference > 0) return "领导评分更高"
    if (difference < 0) return "自评更高"
    return "评分一致"
  }

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return "text-green-600"
    if (difference < 0) return "text-red-600"
    return "text-gray-600"
  }

  const calculatePercentageDifference = (selfScore: number, leaderScore: number) => {
    if (selfScore === 0) return 0
    return ((leaderScore - selfScore) / selfScore) * 100
  }

  // 完成状态中文映射
  const getCompletionStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '待处理',
      'partial': '部分完成',
      'waiting_for_boss': '等待老板评分',
      'completed': '已完成'
    }
    return statusMap[status] || status
  }

  // 完成状态样式映射
  const getCompletionStatusStyle = (status: string) => {
    const styleMap: { [key: string]: string } = {
      'pending': 'bg-gray-100 text-gray-800 border-gray-200',
      'partial': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'waiting_for_boss': 'bg-blue-100 text-blue-800 border-blue-200',
      'completed': 'bg-green-100 text-green-800 border-green-200'
    }
    return styleMap[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // 计算分类对比数据
  const computedCategoryDiffs = useMemo(() => {
    if (!comparisonData) return []

    const selfCats = (comparisonData.self_evaluation as any)?.detailed_scores_with_template || []
    const leaderCats = (comparisonData.leader_evaluation as any)?.detailed_scores_with_template || []

    const map: Record<string, { categoryId: string, categoryName: string, self_score: number, leader_score: number }> = {}

    for (const c of selfCats) {
      const categoryId = c.categoryId
      const categoryName = c.categoryName || categoryId
      const selfScore = typeof c.categoryScore === 'string' ? parseFloat(c.categoryScore) : (c.categoryScore ?? 0)
      map[categoryId] = {
        categoryId,
        categoryName,
        self_score: isNaN(selfScore) ? 0 : selfScore,
        leader_score: 0,
      }
    }
    for (const c of leaderCats) {
      const categoryId = c.categoryId
      const leaderScore = typeof c.categoryScore === 'string' ? parseFloat(c.categoryScore) : (c.categoryScore ?? 0)
      if (!map[categoryId]) {
        map[categoryId] = {
          categoryId,
          categoryName: c.categoryName || categoryId,
          self_score: 0,
          leader_score: isNaN(leaderScore) ? 0 : leaderScore,
        }
      } else {
        map[categoryId].leader_score = isNaN(leaderScore) ? 0 : leaderScore
      }
    }

    return Object.values(map).map(v => ({
      ...v,
      difference: (v.leader_score - v.self_score)
    }))
  }, [comparisonData])

  // 计算项目级对比数据
  const computedItemDiffs = useMemo(() => {
    if (!comparisonData) return []

    const selfCats = (comparisonData.self_evaluation as any)?.detailed_scores_with_template || []
    const leaderCats = (comparisonData.leader_evaluation as any)?.detailed_scores_with_template || []

    const byCategory: Record<string, { categoryId: string, categoryName: string, items: Record<string, any> }> = {}

    // 合并自评项
    for (const c of selfCats) {
      const categoryId = c.categoryId
      const categoryName = c.categoryName || categoryId
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = { categoryId, categoryName, items: {} }
      }
      for (const it of (c.items || [])) {
        const itemId = it.itemId
        const selfScore = typeof it.score === 'string' ? parseFloat(it.score) : (it.score ?? 0)
        byCategory[categoryId].items[itemId] = {
          itemId,
          itemName: it.itemName || itemId,
          self_score: isNaN(selfScore) ? 0 : selfScore,
          leader_score: 0,
          difference: 0,
          itemWeight: it.itemWeight,
          maxScore: it.maxScore,
        }
      }
    }

    // 合并领导项
    for (const c of leaderCats) {
      const categoryId = c.categoryId
      const categoryName = c.categoryName || categoryId
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = { categoryId, categoryName, items: {} }
      }
      for (const it of (c.items || [])) {
        const itemId = it.itemId
        const leaderScore = typeof it.score === 'string' ? parseFloat(it.score) : (it.score ?? 0)
        if (!byCategory[categoryId].items[itemId]) {
          byCategory[categoryId].items[itemId] = {
            itemId,
            itemName: it.itemName || itemId,
            self_score: 0,
            leader_score: isNaN(leaderScore) ? 0 : leaderScore,
            difference: 0,
            itemWeight: it.itemWeight,
            maxScore: it.maxScore,
          }
        } else {
          byCategory[categoryId].items[itemId].leader_score = isNaN(leaderScore) ? 0 : leaderScore
        }
      }
    }

    // 计算差异并展开为数组
    return Object.values(byCategory).map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      items: Object.values(cat.items).map(item => ({
        ...item,
        difference: (item.leader_score - item.self_score)
      }))
    }))
  }, [comparisonData])

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
        <HeaderComponent userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载对比数据...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Button>
          </div>

          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无法获取对比数据</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadComparisonData}>
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
        <HeaderComponent userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backLabel}
            </Button>
          </div>
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无对比数据</h3>
            <p className="text-gray-600">该员工尚未完成自评或领导评分</p>
          </div>
        </div>
      </div>
    )
  }

  // 确定显示的评分维度
  const hasBossEvaluation = comparisonData.boss_evaluation && comparisonData.boss_evaluation.score
  const evaluationCount = hasBossEvaluation ? 4 : 3

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderComponent userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              role === 'boss' ? 'bg-yellow-600' : 'bg-blue-600'
            }`}>
              {role === 'boss' ? <Crown className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {pageTitle}
              </h1>
              <p className="text-gray-600 mt-1">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>

        {/* 总体对比概览 */}
        <div className={`grid grid-cols-1 md:grid-cols-${evaluationCount} gap-4 mb-6`}>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">自评得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(safeToNumber(comparisonData.self_evaluation?.score))}`}>
                    {safeToFixed(comparisonData.self_evaluation?.score)}
                  </p>
                  <p className="text-xs text-blue-600">
                    {comparisonData.self_evaluation?.score ? getScoreLevel(safeToNumber(comparisonData.self_evaluation.score)) : '--'}
                  </p>
                </div>
                <Award className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">领导评分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(safeToNumber(comparisonData.leader_evaluation?.score))}`}>
                    {safeToFixed(comparisonData.leader_evaluation?.score)}
                  </p>
                  <p className="text-xs text-purple-600">
                    {comparisonData.leader_evaluation?.score ? getScoreLevel(safeToNumber(comparisonData.leader_evaluation.score)) : '--'}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {hasBossEvaluation && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-700">Boss评分</p>
                    <p className={`text-2xl font-bold ${getScoreColor(safeToNumber(comparisonData.boss_evaluation?.score))}`}>
                      {safeToFixed(comparisonData.boss_evaluation?.score)}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {comparisonData.boss_evaluation?.score ? getScoreLevel(safeToNumber(comparisonData.boss_evaluation.score)) : '--'}
                    </p>
                  </div>
                  <Crown className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">当前得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(safeToNumber(comparisonData.evaluation_status?.current_score))}`}>
                    {safeToFixed(comparisonData.evaluation_status?.current_score)}
                  </p>
                  <p className="text-xs text-green-600">
                    {comparisonData.evaluation_status?.current_score ? getScoreLevel(safeToNumber(comparisonData.evaluation_status.current_score)) : '--'}
                  </p>
                </div>
                <div className="text-right">
                  {comparisonData.evaluation_status?.completion_status && (
                    <Badge className={getCompletionStatusStyle(comparisonData.evaluation_status.completion_status)}>
                      {getCompletionStatusLabel(comparisonData.evaluation_status.completion_status)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 权重配置显示 */}
        {comparisonData.evaluation_status?.weight_config && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>评分权重配置</CardTitle>
              <CardDescription>当前考核的评分权重分配</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {(comparisonData.evaluation_status.weight_config.self_weight * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-blue-700">自评权重</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {(comparisonData.evaluation_status.weight_config.leader_weight * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-purple-700">领导权重</div>
                </div>
                {comparisonData.evaluation_status.weight_config.boss_enabled && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {(comparisonData.evaluation_status.weight_config.boss_weight * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-yellow-700">Boss权重</div>
                  </div>
                )}
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {safeToFixed(comparisonData.evaluation_status.current_score)}
                  </div>
                  <div className="text-sm text-green-700">加权得分</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分差分析 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>分差分析</CardTitle>
            <CardDescription>各维度评分差异对比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 自评 vs 领导 */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">自评 vs 领导评分</h4>
                <div className="flex items-center gap-2">
                  {(() => {
                    const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                    const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                    const difference = leaderScore - selfScore
                    return (
                      <>
                        {getDifferenceIcon(difference)}
                        <span className={`text-xl font-bold ${getDifferenceColor(difference)}`}>
                          {Math.abs(difference).toFixed(2)}分
                        </span>
                      </>
                    )
                  })()}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {(() => {
                    const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                    const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                    const difference = leaderScore - selfScore
                    return getDifferenceDescription(difference)
                  })()}
                </p>
              </div>

              {/* Boss vs 其他 */}
              {hasBossEvaluation && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Boss评分分析</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Boss vs 自评:</span>
                      <span className={getDifferenceColor(safeToNumber(comparisonData.boss_evaluation?.score) - safeToNumber(comparisonData.self_evaluation?.score))}>
                        {(safeToNumber(comparisonData.boss_evaluation?.score) - safeToNumber(comparisonData.self_evaluation?.score)).toFixed(1)}分
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Boss vs 领导:</span>
                      <span className={getDifferenceColor(safeToNumber(comparisonData.boss_evaluation?.score) - safeToNumber(comparisonData.leader_evaluation?.score))}>
                        {(safeToNumber(comparisonData.boss_evaluation?.score) - safeToNumber(comparisonData.leader_evaluation?.score)).toFixed(1)}分
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 提交时间对比 */}
        {(comparisonData.self_evaluation?.submitted_at || comparisonData.leader_evaluation?.submitted_at || comparisonData.boss_evaluation?.submitted_at) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                提交时间对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 md:grid-cols-${hasBossEvaluation ? '3' : '2'} gap-4`}>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">自评提交</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {comparisonData.self_evaluation?.submitted_at 
                      ? evaluationUtils.formatDateTime(comparisonData.self_evaluation.submitted_at)
                      : '尚未提交'
                    }
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-900">领导评分</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    {comparisonData.leader_evaluation?.submitted_at 
                      ? evaluationUtils.formatDateTime(comparisonData.leader_evaluation.submitted_at)
                      : '尚未评分'
                    }
                  </p>
                </div>
                {hasBossEvaluation && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Boss评分</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {comparisonData.boss_evaluation?.submitted_at 
                        ? evaluationUtils.formatDateTime(comparisonData.boss_evaluation.submitted_at)
                        : '尚未评分'
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 详细对比分析 */}
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">分类对比</TabsTrigger>
            <TabsTrigger value="items">项目对比</TabsTrigger>
            <TabsTrigger value="feedback">反馈对比</TabsTrigger>
          </TabsList>

          {/* 分类对比 */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>评分分类对比</CardTitle>
                <CardDescription>各评分分类的详细对比分析</CardDescription>
              </CardHeader>
              <CardContent>
                {computedCategoryDiffs.length > 0 ? (
                  <div className="space-y-6">
                    {computedCategoryDiffs.map((category) => (
                      <div key={category.categoryId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{category.categoryName}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(category.difference)}
                            <span className={`font-medium ${getDifferenceColor(category.difference)}`}>
                              {category.difference > 0 ? '+' : ''}{safeToFixed(category.difference)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {safeToFixed(category.self_score)}
                              </div>
                              <div className="text-sm text-blue-700">自评分数</div>
                            </div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {safeToFixed(category.leader_score)}
                              </div>
                              <div className="text-sm text-purple-700">领导评分</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-600">自评</span>
                            <span className="text-sm text-blue-600">{safeToFixed(category.self_score)}</span>
                          </div>
                          <Progress value={Math.min(category.self_score, 100)} className="h-2 bg-blue-100" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-600">领导评分</span>
                            <span className="text-sm text-purple-600">{safeToFixed(category.leader_score)}</span>
                          </div>
                          <Progress value={Math.min(category.leader_score, 100)} className="h-2 bg-purple-100" />
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">分差分析:</span>
                            <span className={`font-medium ${getDifferenceColor(category.difference)}`}>
                              {getDifferenceDescription(category.difference)} {safeToFixed(Math.abs(category.difference))} 分
                            </span>
                          </div>
                          {Math.abs(category.difference) > 5 && (
                            <p className="text-xs text-orange-600 mt-1">
                              💡 此分类存在较大分差，建议关注
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>暂无分类对比数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 项目对比 */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>具体项目对比</CardTitle>
                <CardDescription>各评分项目的详细对比分析</CardDescription>
              </CardHeader>
              <CardContent>
                {computedItemDiffs.length > 0 ? (
                  <div className="space-y-6">
                    {computedItemDiffs.map((category) => (
                      <div key={category.categoryId} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">
                          {category.categoryName}
                        </h3>

                        <div className="space-y-4">
                          {category.items.map((item: any) => (
                            <div key={item.itemId} className="border-l-4 border-gray-200 pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-800">{item.itemName}</h4>
                                <div className="flex items-center gap-2">
                                  {getDifferenceIcon(item.difference)}
                                  <span className={`text-sm font-medium ${getDifferenceColor(item.difference)}`}>
                                    {item.difference > 0 ? '+' : ''}{safeToFixed(item.difference)}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center p-2 bg-blue-50 rounded">
                                  <div className="font-semibold text-blue-600">
                                    {safeToFixed(item.self_score)}
                                  </div>
                                  <div className="text-blue-600">自评</div>
                                </div>
                                <div className="text-center p-2 bg-purple-50 rounded">
                                  <div className="font-semibold text-purple-600">
                                    {safeToFixed(item.leader_score)}
                                  </div>
                                  <div className="text-purple-600">领导评分</div>
                                </div>
                                <div className="text-center p-2 bg-gray-50 rounded">
                                  <div className="font-semibold text-gray-600">
                                    {safeToFixed(Math.abs(item.difference))}
                                  </div>
                                  <div className="text-gray-600">分差</div>
                                </div>
                              </div>

                              {Math.abs(item.difference) > 10 && (
                                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                                  ⚠️ 此项目分差较大，建议深入沟通了解原因
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>暂无项目对比数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 反馈对比 */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>反馈意见对比</CardTitle>
                <CardDescription>各维度评分者的文字反馈</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 自评反馈 */}
                  {comparisonData.self_evaluation && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        自评反馈
                      </h4>
                      <div className="space-y-3 text-sm">
                        {comparisonData.self_evaluation.feedback && (
                          <div>
                            <span className="font-medium text-blue-800">总体反馈：</span>
                            <p className="text-blue-700 mt-1">{comparisonData.self_evaluation.feedback}</p>
                          </div>
                        )}
                        {comparisonData.self_evaluation.strengths && (
                          <div>
                            <span className="font-medium text-blue-800">优势亮点：</span>
                            <p className="text-blue-700 mt-1">{comparisonData.self_evaluation.strengths}</p>
                          </div>
                        )}
                        {comparisonData.self_evaluation.improvements && (
                          <div>
                            <span className="font-medium text-blue-800">改进建议：</span>
                            <p className="text-blue-700 mt-1">{comparisonData.self_evaluation.improvements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 领导反馈 */}
                  {comparisonData.leader_evaluation && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        领导反馈
                      </h4>
                      <div className="space-y-3 text-sm">
                        {comparisonData.leader_evaluation.feedback && (
                          <div>
                            <span className="font-medium text-purple-800">总体反馈：</span>
                            <p className="text-purple-700 mt-1">{comparisonData.leader_evaluation.feedback}</p>
                          </div>
                        )}
                        {comparisonData.leader_evaluation.strengths && (
                          <div>
                            <span className="font-medium text-purple-800">优势亮点：</span>
                            <p className="text-purple-700 mt-1">{comparisonData.leader_evaluation.strengths}</p>
                          </div>
                        )}
                        {comparisonData.leader_evaluation.improvements && (
                          <div>
                            <span className="font-medium text-purple-800">改进建议：</span>
                            <p className="text-purple-700 mt-1">{comparisonData.leader_evaluation.improvements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Boss反馈 */}
                  {comparisonData.boss_evaluation && (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Boss反馈
                      </h4>
                      <div className="space-y-3 text-sm">
                        {comparisonData.boss_evaluation.feedback && (
                          <div>
                            <span className="font-medium text-yellow-800">总体反馈：</span>
                            <p className="text-yellow-700 mt-1">{comparisonData.boss_evaluation.feedback}</p>
                          </div>
                        )}
                        {comparisonData.boss_evaluation.strengths && (
                          <div>
                            <span className="font-medium text-yellow-800">优势亮点：</span>
                            <p className="text-yellow-700 mt-1">{comparisonData.boss_evaluation.strengths}</p>
                          </div>
                        )}
                        {comparisonData.boss_evaluation.improvements && (
                          <div>
                            <span className="font-medium text-yellow-800">改进建议：</span>
                            <p className="text-yellow-700 mt-1">{comparisonData.boss_evaluation.improvements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 总结建议 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>对比分析总结</CardTitle>
            <CardDescription>基于评分对比的分析建议</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">整体分析</h4>
                <p className="text-blue-800 text-sm">
                  {(() => {
                    const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                    const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                    const overallDifference = leaderScore - selfScore

                    const userName = comparisonData.self_evaluation?.evaluator?.name || '该员工'

                    if (Math.abs(overallDifference) < 5) {
                      return `${userName}的自评与领导评分比较一致，说明对自己的表现有准确的认知。`
                    } else if (overallDifference > 0) {
                      return `领导对${userName}的评价高于自评${safeToFixed(overallDifference)}分，说明可能存在自我认知偏保守的情况。`
                    } else {
                      return `${userName}的自评高于领导评分${safeToFixed(Math.abs(overallDifference))}分，需要重新审视自己的表现。`
                    }
                  })()}
                </p>
              </div>

              {computedCategoryDiffs && computedCategoryDiffs.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">建议关注</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    {computedCategoryDiffs
                      .filter(cat => Math.abs(cat.difference) > 5)
                      .map(cat => (
                        <li key={cat.categoryId}>
                          • {cat.categoryName}: {getDifferenceDescription(cat.difference)} {safeToFixed(Math.abs(cat.difference))} 分，建议沟通确认
                        </li>
                      ))
                    }
                    {computedCategoryDiffs.every(cat => Math.abs(cat.difference) <= 5) && (
                      <li>各分类评分都比较接近，整体评价一致性良好</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}