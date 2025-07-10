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
  evaluationUtils
} from "@/lib/evaluation"

export default function EmployeeEvaluationResultPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [comparisonData, setComparisonData] = useState<EvaluationComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated || !user) {
      setError('请先登录')
      setLoading(false)
      return
    }

    const loadComparisonData = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await evaluationService.getEvaluationComparison(assessmentId, user.id)
        
        if (response.code === 200 && response.data) {
          setComparisonData(response.data)
        } else {
          throw new Error(response.message || '无法获取评估结果')
        }

      } catch (error: any) {
        console.error('加载评估结果失败:', error)
        setError(error.message || '服务器错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    
    loadComparisonData()
  }, [assessmentId, isAuthenticated, user, authLoading])

  const reloadComparisonData = async () => {
    if (!isAuthenticated || !user) {
      setError('请先登录')
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await evaluationService.getEvaluationComparison(assessmentId, user.id)
      
      if (response.code === 200 && response.data) {
        setComparisonData(response.data)
      } else {
        throw new Error(response.message || '无法获取评估结果')
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

  const getDifferenceColor = (difference: number) => {
    if (difference > 0) return "text-green-600"
    if (difference < 0) return "text-red-600"
    return "text-gray-600"
  }

  const formatDifference = (difference: number) => {
    if (difference > 0) return `+${difference.toFixed(1)}`
    return difference.toFixed(1)
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
            <Button variant="outline" onClick={reloadComparisonData}>
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
              {comparisonData.user_name} · 考核 #{comparisonData.assessment_id}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="text-sm text-gray-500">
                  {comparisonData.self_evaluation?.score 
                    ? getScoreLevel(Number(comparisonData.self_evaluation.score))
                    : '未完成'
                  }
                </div>
                {comparisonData.self_evaluation?.submitted_at && (
                  <div className="text-xs text-gray-400 mt-1">
                    {evaluationUtils.formatDateTime(comparisonData.self_evaluation.submitted_at)}
                  </div>
                )}
              </div>

              {/* 领导评分 */}
              <div className="text-center">
                <div className="mb-3">
                  <div className="text-3xl font-bold text-purple-600">
                    {comparisonData.leader_evaluation?.score 
                      ? Number(comparisonData.leader_evaluation.score).toFixed(1)
                      : '--'}
                  </div>
                  <div className="text-sm text-gray-600">领导评分</div>
                </div>
                <div className="text-sm text-gray-500">
                  {comparisonData.leader_evaluation?.score 
                    ? getScoreLevel(Number(comparisonData.leader_evaluation.score))
                    : '未完成'
                  }
                </div>
                {comparisonData.leader_evaluation?.submitted_at && (
                  <div className="text-xs text-gray-400 mt-1">
                    {evaluationUtils.formatDateTime(comparisonData.leader_evaluation.submitted_at)}
                  </div>
                )}
              </div>

              {/* 分差 */}
              <div className="text-center">
                <div className="mb-3">
                  <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${getDifferenceColor(comparisonData.comparison.overall_difference)}`}>
                    {getDifferenceIcon(comparisonData.comparison.overall_difference)}
                    {Math.abs(Number(comparisonData.comparison.overall_difference)).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">分差</div>
                </div>
                <div className="text-sm text-gray-500">
                  {comparisonData.comparison.overall_difference > 0 
                    ? '领导评分更高' 
                    : comparisonData.comparison.overall_difference < 0 
                      ? '自评更高' 
                      : '评分一致'
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="comparison" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">分项对比</TabsTrigger>
            <TabsTrigger value="self">自评详情</TabsTrigger>
            <TabsTrigger value="leader">领导评分</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>分项评分对比</CardTitle>
                <CardDescription>各个评分项目的详细对比分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {comparisonData.comparison.category_differences.map((category) => (
                    <div key={category.categoryId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{category.category_name}</h3>
                        <div className="flex items-center gap-2">
                          {getDifferenceIcon(category.difference)}
                          <span className={`font-medium ${getDifferenceColor(category.difference)}`}>
                            {formatDifference(category.difference)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {Number(category.self_score).toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">自评得分</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {Number(category.leader_score).toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">领导评分</div>
                        </div>
                      </div>

                      {/* 详细项目对比 */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">详细项目对比</h4>
                        {category.item_differences.map((item) => (
                          <div key={item.itemId} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{item.item_name}</span>
                              <div className="flex items-center gap-2">
                                {getDifferenceIcon(item.difference)}
                                <span className={`text-sm ${getDifferenceColor(item.difference)}`}>
                                  {formatDifference(item.difference)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">自评：</span>
                                <span className="font-medium">{Number(item.self_score).toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">领导：</span>
                                <span className="font-medium">{Number(item.leader_score).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
                              {comparisonData.comparison.category_differences.find(
                                c => c.categoryId === category.categoryId
                              )?.category_name || category.categoryId}
                            </h3>
                            <Badge variant="outline">
                              {Number(category.categoryScore).toFixed(1)}分
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {category.items.map((item) => (
                              <div key={item.itemId} className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    {comparisonData.comparison.category_differences
                                      .find(c => c.categoryId === category.categoryId)
                                      ?.item_differences.find(i => i.itemId === item.itemId)
                                      ?.item_name || item.itemId}
                                  </span>
                                  <span className="text-blue-600 font-medium">
                                    {Number(item.score).toFixed(1)}
                                  </span>
                                </div>
                                {item.comment && (
                                  <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                                )}
                              </div>
                            ))}
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
                              {comparisonData.comparison.category_differences.find(
                                c => c.categoryId === category.categoryId
                              )?.category_name || category.categoryId}
                            </h3>
                            <Badge variant="outline">
                              {Number(category.categoryScore).toFixed(1)}分
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {category.items.map((item) => (
                              <div key={item.itemId} className="bg-purple-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">
                                    {comparisonData.comparison.category_differences
                                      .find(c => c.categoryId === category.categoryId)
                                      ?.item_differences.find(i => i.itemId === item.itemId)
                                      ?.item_name || item.itemId}
                                  </span>
                                  <span className="text-purple-600 font-medium">
                                    {Number(item.score).toFixed(1)}
                                  </span>
                                </div>
                                {item.comment && (
                                  <p className="text-sm text-gray-600 mt-1">{item.comment}</p>
                                )}
                              </div>
                            ))}
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
        </Tabs>
      </div>
    </div>
  )
}