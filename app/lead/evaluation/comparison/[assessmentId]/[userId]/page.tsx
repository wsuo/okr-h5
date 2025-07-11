"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, User, Award, Calendar, Loader2, FileText } from "lucide-react"
import LeadHeader from "@/components/lead-header"
import { useRouter, useParams } from "next/navigation"
import {
  evaluationService,
  EvaluationComparison,
  CategoryDifference,
  ItemDifference,
  evaluationUtils
} from "@/lib/evaluation"
import { safeParseUserInfo } from "@/lib/utils"

export default function EvaluationComparisonPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  const userId = parseInt(params.userId as string)
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [comparisonData, setComparisonData] = useState<EvaluationComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // 安全的数字格式化函数
  const safeToFixed = (value: any, digits: number = 1): string => {
    if (value === null || value === undefined) return '--'
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? '--' : num.toFixed(digits)
  }

  // 安全的数字转换函数
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
    router.push(`/lead/evaluation/result/${assessmentId}`)
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
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回评估结果
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
        <LeadHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回评估结果
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

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回评估结果
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {comparisonData.self_evaluation?.evaluator?.name || comparisonData.leader_evaluation?.evaluator?.name || '未知用户'} - 评分对比分析
              </h1>
              <p className="text-gray-600 mt-1">
                自评与领导评分的详细对比
              </p>
            </div>
          </div>
        </div>

        {/* 总体对比概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">分差 (绝对值)</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      // 从新的数据结构中计算分差
                      const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                      const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                      const difference = leaderScore - selfScore
                      return getDifferenceIcon(difference)
                    })()}
                    <p className="text-2xl font-bold text-gray-600">
                      {(() => {
                        // 前端计算分差并保留两位小数
                        const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                        const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                        const difference = Math.abs(leaderScore - selfScore)
                        return difference.toFixed(2)
                      })()}
                    </p>
                  </div>
                  <p className={`text-xs ${(() => {
                    const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                    const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                    const difference = leaderScore - selfScore
                    return getDifferenceColor(difference)
                  })()}`}>
                    {(() => {
                      const selfScore = safeToNumber(comparisonData.self_evaluation?.score)
                      const leaderScore = safeToNumber(comparisonData.leader_evaluation?.score)
                      const difference = leaderScore - selfScore
                      return getDifferenceDescription(difference)
                    })()}
                  </p>
                </div>
                <div className="text-right">
                  {comparisonData.self_evaluation?.score && comparisonData.leader_evaluation?.score && (
                    <p className="text-xs text-gray-500">
                      相对差异: {safeToFixed(calculatePercentageDifference(
                        safeToNumber(comparisonData.self_evaluation.score),
                        safeToNumber(comparisonData.leader_evaluation.score)
                      ))}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 提交时间对比 */}
        {(comparisonData.self_evaluation?.submitted_at || comparisonData.leader_evaluation?.submitted_at) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                提交时间
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">自评提交时间</span>
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
                    <span className="font-medium text-purple-900">领导评分时间</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    {comparisonData.leader_evaluation?.submitted_at 
                      ? evaluationUtils.formatDateTime(comparisonData.leader_evaluation.submitted_at)
                      : '尚未评分'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 详细分类对比 */}
        <Tabs defaultValue="categories" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="categories">分类对比</TabsTrigger>
            <TabsTrigger value="items">具体项目对比</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>评分分类对比</CardTitle>
                <CardDescription>各评分分类的自评与领导评分对比</CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.comparison_analysis?.category_differences && comparisonData.comparison_analysis.category_differences.length > 0 ? (
                  <div className="space-y-6">
                    {comparisonData.comparison_analysis.category_differences.map((category) => (
                      <div key={category.categoryId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {(() => {
                                // 从详细评分数据中找到分类名称
                                const selfCategory = comparisonData.self_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === category.categoryId)
                                const leaderCategory = comparisonData.leader_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === category.categoryId)
                                return selfCategory?.categoryName || leaderCategory?.categoryName || category.categoryId
                              })()}
                            </h3>
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
                        
                        {/* 分数进度条对比 */}
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

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>具体项目对比</CardTitle>
                <CardDescription>各评分项目的详细对比分析</CardDescription>
              </CardHeader>
              <CardContent>
                {comparisonData.comparison_analysis?.category_differences && comparisonData.comparison_analysis.category_differences.length > 0 ? (
                  <div className="space-y-6">
                    {comparisonData.comparison_analysis.category_differences.map((category) => (
                      <div key={category.categoryId} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 text-gray-900">
                          {(() => {
                            // 从详细评分数据中找到分类名称
                            const selfCategory = comparisonData.self_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === category.categoryId)
                            const leaderCategory = comparisonData.leader_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === category.categoryId)
                            return selfCategory?.categoryName || leaderCategory?.categoryName || category.categoryId
                          })()}
                        </h3>
                        
                        {(() => {
                          // 从详细评分数据中生成具体项目对比
                          const selfCategory = comparisonData.self_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === category.categoryId)
                          const leaderCategory = comparisonData.leader_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === category.categoryId)
                          
                          if (!selfCategory || !leaderCategory) {
                            return <p className="text-gray-500 text-sm">该分类暂无具体项目对比数据</p>
                          }
                          
                          // 合并两个评分的项目数据
                          const itemComparisons: any[] = []
                          selfCategory.items.forEach(selfItem => {
                            const leaderItem = leaderCategory.items.find(l => l.itemId === selfItem.itemId)
                            if (leaderItem) {
                              itemComparisons.push({
                                itemId: selfItem.itemId,
                                itemName: selfItem.itemName,
                                self_score: selfItem.score,
                                leader_score: leaderItem.score,
                                difference: leaderItem.score - selfItem.score
                              })
                            }
                          })
                          
                          return (
                            <div className="space-y-4">
                              {itemComparisons.map((item) => (
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
                          )
                        })()}
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
        </Tabs>

        {/* 总结建议 */}
        {comparisonData.comparison && (
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
                      
                      const userName = comparisonData.self_evaluation?.evaluator?.name || comparisonData.leader_evaluation?.evaluator?.name || '未知用户'
                      
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

                {comparisonData.comparison_analysis.category_differences && comparisonData.comparison_analysis.category_differences.length > 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">建议关注</h4>
                    <ul className="text-green-800 text-sm space-y-1">
                      {comparisonData.comparison_analysis.category_differences
                        .filter(cat => Math.abs(cat.difference) > 5)
                        .map(cat => (
                          <li key={cat.categoryId}>
                            • {(() => {
                              const selfCategory = comparisonData.self_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === cat.categoryId)
                              const leaderCategory = comparisonData.leader_evaluation?.detailed_scores_with_template?.find(c => c.categoryId === cat.categoryId)
                              return selfCategory?.categoryName || leaderCategory?.categoryName || cat.categoryId
                            })()}: {getDifferenceDescription(cat.difference)} {safeToFixed(Math.abs(cat.difference))} 分，建议沟通确认
                          </li>
                        ))
                      }
                      {comparisonData.comparison_analysis.category_differences.every(cat => Math.abs(cat.difference) <= 5) && (
                        <li>各分类评分都比较接近，整体评价一致性良好</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}