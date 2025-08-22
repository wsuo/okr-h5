"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, AlertTriangle, Crown, User, Award, Star, TrendingUp, TrendingDown, Minus, Calendar, Clock, Target, BarChart3 } from "lucide-react"
import BossHeader from "@/components/boss-header"
import { safeParseUserInfo } from "@/lib/utils"
import {
  evaluationService,
  DetailedEvaluation,
  EvaluationComparison,
  evaluationUtils
} from "@/lib/evaluation"
import { userService } from "@/lib/user"

export default function BossEvaluationViewPage() {
  const params = useParams()
  const router = useRouter()
  
  const evaluationId = parseInt(params.evaluationId as string)
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [evaluation, setEvaluation] = useState<DetailedEvaluation | null>(null)
  const [comparison, setComparison] = useState<EvaluationComparison | null>(null)
  const [completeEvaluation, setCompleteEvaluation] = useState<any>(null)
  const [evaluateeInfo, setEvaluateeInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
      loadEvaluationDetails()
    } else {
      router.push('/')
      return
    }
  }, [])

  // 加载评估详情
  const loadEvaluationDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // 检查参数有效性
      if (!evaluationId) {
        throw new Error('评估ID无效')
      }

      // 获取评估详情
      const evaluationResponse = await evaluationService.getDetailedEvaluation(evaluationId)
      
      if (evaluationResponse.code === 200 && evaluationResponse.data) {
        const evaluationData = evaluationResponse.data
        console.log('✅ 获取评估数据成功:', evaluationData)
        console.log('🔍 检查关键字段:')
        console.log('   - assessment_id:', evaluationData.assessment_id)
        console.log('   - evaluatee_id:', evaluationData.evaluatee_id)
        console.log('   - evaluatee对象:', evaluationData.evaluatee)
        
        setEvaluation(evaluationData)

        // 获取被评估人信息
        if (evaluationData.evaluatee_id) {
          const evaluateeResponse = await userService.getUser(evaluationData.evaluatee_id)
          if (evaluateeResponse.code === 200 && evaluateeResponse.data) {
            setEvaluateeInfo(evaluateeResponse.data)
          }
        } else if (evaluationData.evaluatee) {
          setEvaluateeInfo(evaluationData.evaluatee)
        }

        // 获取对比数据（如果有的话）
        const assessmentId = evaluationData.assessment_id || evaluationData.assessment?.id
        const evaluateeId = evaluationData.evaluatee_id || evaluationData.evaluatee?.id
        
        console.log('🔍 修正后的ID:')
        console.log('   - assessmentId:', assessmentId)
        console.log('   - evaluateeId:', evaluateeId)
        
        if (assessmentId && evaluateeId) {
          try {
            console.log('📊 开始获取对比数据...', {
              assessment_id: assessmentId, 
              evaluatee_id: evaluateeId
            })
            
            const comparisonResponse = await evaluationService.getEvaluationComparison(
              assessmentId,
              evaluateeId
            )
            console.log('📊 对比数据响应:', comparisonResponse)
            if (comparisonResponse.code === 200 && comparisonResponse.data) {
              setComparison(comparisonResponse.data)
              console.log('✅ 设置对比数据成功')
            }

            console.log('🔍 开始调用完整评估接口...')
            // 获取完整评估数据
            const completeResponse = await evaluationService.getCompleteEvaluationDetails(
              assessmentId,
              evaluateeId,
              { include_details: true, include_comments: true, include_comparison: true }
            )
            console.log('🔍 完整评估数据响应:', completeResponse)
            if (completeResponse.code === 200 && completeResponse.data) {
              console.log('✅ 设置完整评估数据前:', completeResponse.data)
              setCompleteEvaluation(completeResponse.data)
              console.log('✅ 设置完整评估数据成功')
            } else {
              console.error('❌ 完整评估接口调用失败:', completeResponse)
            }
          } catch (comparisonError) {
            console.error('💢 获取对比数据失败:', comparisonError)
            console.error('💢 错误详情:', comparisonError.message, comparisonError.stack)
            // 对比数据获取失败不影响主流程
          }
        } else {
          console.warn('⚠️ 缺少assessmentId或evaluateeId，无法获取详细数据')
          console.warn('   - assessmentId:', assessmentId)
          console.warn('   - evaluateeId:', evaluateeId)
        }

      } else {
        throw new Error(evaluationResponse.message || '获取评估详情失败')
      }

    } catch (error: any) {
      console.error('加载评估详情失败:', error)
      setError(error.message || '加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 返回评分列表
  const goBack = () => {
    router.push('/boss/evaluation')
  }

  // 获取评分等级和颜色
  const getScoreInfo = (score: number) => {
    if (score >= 90) return { level: '优秀', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (score >= 80) return { level: '良好', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    if (score >= 70) return { level: '合格', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    return { level: '待改进', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  // 获取对比趋势图标
  const getTrendIcon = (selfScore: number | string, leaderScore: number | string, bossScore: number | string) => {
    const self = parseFloat(selfScore.toString())
    const leader = parseFloat(leaderScore.toString())
    const boss = parseFloat(bossScore.toString())
    
    if (boss > Math.max(self, leader)) {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    } else if (boss < Math.min(self, leader)) {
      return <TrendingDown className="w-4 h-4 text-red-600" />
    }
    return <Minus className="w-4 h-4 text-gray-600" />
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">加载用户信息...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回评分中心
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={loadEvaluationDetails}>
              重新加载
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg">正在加载评估详情...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!evaluation || !evaluateeInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BossHeader userInfo={userInfo} />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={goBack} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回评分中心
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              未找到评估详情或被评估人信息
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const bossScoreInfo = getScoreInfo(parseFloat(evaluation.score) || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <BossHeader userInfo={userInfo} />
      
      <div className="container mx-auto p-6 max-w-6xl">
        {/* 页面头部 */}
        <div className="mb-8">
          <Button variant="ghost" onClick={goBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回评分中心
          </Button>
          
          <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Crown className="w-8 h-8 text-yellow-600" />
              Boss 评分详情
            </h1>
            <p className="text-gray-600 text-lg">
              {evaluation.assessment?.title} · {evaluation.assessment?.period}
            </p>
          </div>
        </div>

        {/* Tab 导航 */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              评分概览
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              详细评分
            </TabsTrigger>
          </TabsList>

          {/* 评分概览 Tab */}
          <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 被评估人信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                被评估人信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                  <span className="text-blue-700 font-semibold text-xl">
                    {evaluateeInfo.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-xl text-gray-900">{evaluateeInfo.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">
                      {evaluateeInfo.department?.name || '未分配部门'}
                    </span>
                    <span>·</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md">
                      {evaluateeInfo.position || '未设置职位'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boss评分总览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                您的评分
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-5xl font-bold mb-2 ${bossScoreInfo.color}`}>
                  {parseFloat(evaluation.score)?.toFixed(1) || '--'}
                </div>
                <Badge className={`${bossScoreInfo.bgColor} ${bossScoreInfo.color} border-current mb-4`}>
                  {bossScoreInfo.level}
                </Badge>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">提交时间</span>
                  </div>
                  <div className="text-right">
                    {evaluation.submitted_at ? 
                      evaluationUtils.formatDateTime(evaluation.submitted_at) : 
                      '未提交'
                    }
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">更新时间</span>
                  </div>
                  <div className="text-right">
                    {evaluationUtils.formatDateTime(evaluation.updated_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 评分对比（如果有对比数据） */}
        {comparison && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                三维度评分对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 自评 */}
                {comparison.self_evaluation && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {parseFloat(comparison.self_evaluation.score).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">员工自评</div>
                    <div className="text-xs text-gray-500">
                      {evaluationUtils.formatDate(comparison.self_evaluation.submitted_at)}
                    </div>
                  </div>
                )}

                {/* 领导评分 */}
                {comparison.leader_evaluation && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {parseFloat(comparison.leader_evaluation.score).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">领导评分</div>
                    <div className="text-xs text-gray-500">
                      {evaluationUtils.formatDate(comparison.leader_evaluation.submitted_at)}
                    </div>
                  </div>
                )}

                {/* Boss评分 */}
                {comparison.boss_evaluation && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <div className={`text-2xl font-bold mb-2 ${bossScoreInfo.color}`}>
                      {parseFloat(comparison.boss_evaluation.score).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 mb-1 flex items-center justify-center gap-1">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      Boss评分
                    </div>
                    <div className="text-xs text-gray-500">
                      {evaluationUtils.formatDate(comparison.boss_evaluation.submitted_at)}
                    </div>
                  </div>
                )}
              </div>

              {/* 评分差异分析 */}
              {comparison.self_evaluation && comparison.leader_evaluation && comparison.boss_evaluation && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    评分差异分析
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Boss vs 自评:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(comparison.self_evaluation.score, comparison.leader_evaluation.score, comparison.boss_evaluation.score)}
                        <span className={`font-medium ${
                          parseFloat(comparison.boss_evaluation.score) > parseFloat(comparison.self_evaluation.score) ? 'text-green-600' : 
                          parseFloat(comparison.boss_evaluation.score) < parseFloat(comparison.self_evaluation.score) ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {(parseFloat(comparison.boss_evaluation.score) - parseFloat(comparison.self_evaluation.score)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Boss vs 领导:</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(comparison.leader_evaluation.score, comparison.self_evaluation.score, comparison.boss_evaluation.score)}
                        <span className={`font-medium ${
                          parseFloat(comparison.boss_evaluation.score) > parseFloat(comparison.leader_evaluation.score) ? 'text-green-600' : 
                          parseFloat(comparison.boss_evaluation.score) < parseFloat(comparison.leader_evaluation.score) ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {(parseFloat(comparison.boss_evaluation.score) - parseFloat(comparison.leader_evaluation.score)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">三方均值:</span>
                      <span className="font-medium text-purple-600">
                        {((parseFloat(comparison.self_evaluation.score) + parseFloat(comparison.leader_evaluation.score) + parseFloat(comparison.boss_evaluation.score)) / 3).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Boss评价内容 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              您的评价内容
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 总体评价 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">总体评价</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">
                  {evaluation.feedback || evaluation.boss_review || '未填写评价'}
                </p>
              </div>
            </div>

            {/* 优势亮点 */}
            {evaluation.strengths && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">优势亮点</h4>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-green-800 leading-relaxed">
                    {evaluation.strengths}
                  </p>
                </div>
              </div>
            )}

            {/* 改进建议 */}
            {evaluation.improvements && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">改进建议</h4>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-blue-800 leading-relaxed">
                    {evaluation.improvements}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 评估信息总览 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              评估信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">评估ID:</span>
                <span className="ml-2 font-medium">#{evaluation.id}</span>
              </div>
              <div>
                <span className="text-gray-600">评估类型:</span>
                <Badge variant="outline" className="ml-2">
                  {evaluationUtils.getTypeText(evaluation.type)}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">评估状态:</span>
                <Badge className={`ml-2 ${evaluationUtils.getStatusStyle(evaluation.status)}`}>
                  {evaluationUtils.getStatusText(evaluation.status)}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">截止时间:</span>
                <span className="ml-2 font-medium">
                  {evaluation.assessment?.deadline ? 
                    evaluationUtils.formatDate(evaluation.assessment.deadline) : 
                    '未设置'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={goBack}>
            返回评分列表
          </Button>
          
          {(() => {
            const assessmentIdForLink = (evaluation as any)?.assessment_id || (evaluation as any)?.assessment?.id
            const evaluateeIdForLink = (evaluation as any)?.evaluatee_id || (evaluation as any)?.evaluatee?.id
            return comparison && assessmentIdForLink && evaluateeIdForLink ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/boss/evaluation/comparison/${assessmentIdForLink}/${evaluateeIdForLink}`)}
              >
                查看详细对比
              </Button>
            ) : null
          })()}
        </div>
          </TabsContent>

          {/* 详细评分 Tab */}
          <TabsContent value="details" className="space-y-6">
            {(() => {
              console.log('🎯 Tab详细评分渲染检查:')
              console.log('   - completeEvaluation状态:', completeEvaluation)
              console.log('   - completeEvaluation是否存在:', !!completeEvaluation)
              console.log('   - completeEvaluation类型:', typeof completeEvaluation)
              if (completeEvaluation) {
                console.log('   - final_result:', completeEvaluation.final_result)
                console.log('   - self_evaluation:', completeEvaluation.self_evaluation)
                console.log('   - leader_evaluation:', completeEvaluation.leader_evaluation)
                console.log('   - boss_evaluation:', completeEvaluation.boss_evaluation)
              }
              return null
            })()}
            
            {completeEvaluation ? (
              <div className="space-y-6">
                {/* 评分权重配置 */}
                {completeEvaluation.final_result?.weight_config && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        权重配置
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {completeEvaluation.final_result.weight_config.self_weight}%
                          </div>
                          <div className="text-sm text-gray-600">员工自评权重</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {completeEvaluation.final_result.weight_config.leader_weight}%
                          </div>
                          <div className="text-sm text-gray-600">领导评分权重</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {completeEvaluation.final_result.weight_config.boss_weight}%
                          </div>
                          <div className="text-sm text-gray-600">Boss权重</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 最终得分分解 */}
                {completeEvaluation.final_result && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        最终得分: {completeEvaluation.final_result.final_score}分
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {completeEvaluation.final_result.calculation_details?.breakdown && (
                          <>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <span className="font-medium">员工自评贡献</span>
                              <span className="text-blue-600 font-bold">
                                {completeEvaluation.final_result.calculation_details.breakdown.self_contribution.toFixed(2)}分
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <span className="font-medium">领导评分贡献</span>
                              <span className="text-green-600 font-bold">
                                {completeEvaluation.final_result.calculation_details.breakdown.leader_contribution.toFixed(2)}分
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                              <span className="font-medium">Boss评分贡献</span>
                              <span className="text-yellow-600 font-bold">
                                {completeEvaluation.final_result.calculation_details.breakdown.boss_contribution.toFixed(2)}分
                              </span>
                            </div>
                            <Separator />
                          </>
                        )}
                        <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                          <span className="font-bold text-lg">最终得分</span>
                          <span className="text-indigo-600 font-bold text-xl">
                            {completeEvaluation.final_result.final_score}分
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 评分信息 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 员工自评 */}
                  {completeEvaluation.self_evaluation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-600">
                          <User className="w-5 h-5" />
                          员工自评
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {completeEvaluation.self_evaluation.overall_score}
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                              {completeEvaluation.self_evaluation.completed ? '已完成' : '未完成'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><strong>评价:</strong> {completeEvaluation.self_evaluation.review || '无'}</p>
                            {completeEvaluation.self_evaluation.strengths && (
                              <p><strong>优势:</strong> {completeEvaluation.self_evaluation.strengths}</p>
                            )}
                            {completeEvaluation.self_evaluation.improvements && (
                              <p><strong>改进:</strong> {completeEvaluation.self_evaluation.improvements}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 领导评分 */}
                  {completeEvaluation.leader_evaluation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                          <Award className="w-5 h-5" />
                          领导评分
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {completeEvaluation.leader_evaluation.overall_score}
                            </div>
                            <Badge className="bg-green-50 text-green-600 border-green-200">
                              {completeEvaluation.leader_evaluation.leader_name}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><strong>评价:</strong> {completeEvaluation.leader_evaluation.review || '无'}</p>
                            {completeEvaluation.leader_evaluation.strengths && (
                              <p><strong>优势:</strong> {completeEvaluation.leader_evaluation.strengths}</p>
                            )}
                            {completeEvaluation.leader_evaluation.improvements && (
                              <p><strong>改进:</strong> {completeEvaluation.leader_evaluation.improvements}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Boss评分 */}
                  {completeEvaluation.boss_evaluation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-600">
                          <Crown className="w-5 h-5" />
                          Boss评分
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-600 mb-2">
                              {completeEvaluation.boss_evaluation.overall_score}
                            </div>
                            <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              {completeEvaluation.boss_evaluation.boss_name}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p><strong>评价:</strong> {completeEvaluation.boss_evaluation.review || '无'}</p>
                            {completeEvaluation.boss_evaluation.strengths && (
                              <p><strong>优势:</strong> {completeEvaluation.boss_evaluation.strengths}</p>
                            )}
                            {completeEvaluation.boss_evaluation.improvements && (
                              <p><strong>改进:</strong> {completeEvaluation.boss_evaluation.improvements}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* 时间线 */}
                {completeEvaluation.timeline && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        评估时间线
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {completeEvaluation.timeline.map((event: any, index: number) => (
                          <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                              <div className="font-medium">{event.description}</div>
                              <div className="text-sm text-gray-600">
                                {event.actor} · {new Date(event.timestamp).toLocaleString('zh-CN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">正在加载详细评分数据...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
