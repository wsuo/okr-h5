"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, BarChart3, Clock, CheckCircle, AlertTriangle, Search, TrendingUp, TrendingDown, Loader2, FileText } from "lucide-react"
import LeadHeader from "@/components/lead-header"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import {
  evaluationService,
  EvaluationProgress,
  EvaluationComparison,
  evaluationUtils
} from "@/lib/evaluation"
import { assessmentService, Assessment } from "@/lib/assessment"
import { safeParseUserInfo } from "@/lib/utils"

interface TeamMemberResult {
  user_id: number
  user_name: string
  department: string
  self_status: 'pending' | 'completed'
  leader_status: 'pending' | 'completed'
  self_score?: number
  leader_score?: number
  final_score?: number
  current_score?: number
  completion_status?: string
  comparison?: EvaluationComparison
  last_updated?: string
}

export default function LeadEvaluationResultPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<Assessment | null>(null)
  const [progressData, setProgressData] = useState<EvaluationProgress | null>(null)
  const [teamResults, setTeamResults] = useState<TeamMemberResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState("")
  const [isDataLoaded, setIsDataLoaded] = useState(false)

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

  // 安全获取对比差值
  const getOverallDifference = (comparison: any): number => {
    return comparison?.comparison?.overall_difference ?? 0
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      // 并行加载考核详情和进度数据
      const [assessmentResponse, progressResponse] = await Promise.all([
        assessmentService.getAssessmentById(assessmentId),
        evaluationService.getEvaluationProgress(assessmentId)
      ])

      // 处理考核详情
      if (assessmentResponse.code === 200 && assessmentResponse.data) {
        setAssessmentDetail(assessmentResponse.data)
      }

      // 处理进度数据
      if (progressResponse.code === 200 && progressResponse.data) {
        setProgressData(progressResponse.data)

        // 为每个参与者加载对比数据
        const resultPromises = progressResponse.data.participants.map(async (participant) => {
          try {
            const comparisonResponse = await evaluationService.getEvaluationComparison(
              assessmentId,
              participant.user_id
            )
            
            const comparison = comparisonResponse.code === 200 ? comparisonResponse.data : undefined
            
            // 从考核详情中获取正确的final_score
            const assessmentParticipant = assessmentResponse.data?.participants?.find(
              p => p.user.id === participant.user_id
            )
            
            return {
              user_id: participant.user_id,
              user_name: participant.user_name,
              department: participant.department,
              self_status: participant.self_status,
              leader_status: participant.leader_status,
              self_score: comparison?.self_evaluation?.score,
              leader_score: comparison?.leader_evaluation?.score,
              final_score: assessmentParticipant?.final_score || comparison?.leader_evaluation?.score || comparison?.self_evaluation?.score,
              current_score: comparison?.evaluation_status?.current_score,
              completion_status: comparison?.evaluation_status?.completion_status,
              comparison,
              last_updated: participant.leader_completed_at || participant.self_completed_at
            } as TeamMemberResult
          } catch (error) {
            console.warn(`获取用户${participant.user_id}对比数据失败:`, error)
            
            // 即使对比数据获取失败，也要从考核详情中获取final_score
            const assessmentParticipant = assessmentResponse.data?.participants?.find(
              p => p.user.id === participant.user_id
            )
            
            return {
              user_id: participant.user_id,
              user_name: participant.user_name,
              department: participant.department,
              self_status: participant.self_status,
              leader_status: participant.leader_status,
              final_score: assessmentParticipant?.final_score,
              current_score: undefined,
              completion_status: undefined,
              last_updated: participant.leader_completed_at || participant.self_completed_at
            } as TeamMemberResult
          }
        })

        const results = await Promise.all(resultPromises)
        setTeamResults(results)
      }

    } catch (error: any) {
      console.error('加载评估结果失败:', error)
      setError(error.message || '服务器错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [assessmentId])

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }
    
    loadData()
  }, [assessmentId, loadData])

  const handleBack = () => {
    router.push('/lead/evaluation')
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

  const getStatusBadge = (selfStatus: string, leaderStatus: string, completionStatus?: string) => {
    // 如果有完成状态，优先显示完成状态
    if (completionStatus) {
      return <Badge className={getCompletionStatusStyle(completionStatus)}>
        {getCompletionStatusLabel(completionStatus)}
      </Badge>
    }
    
    // 否则使用原有逻辑
    if (selfStatus === 'completed' && leaderStatus === 'completed') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">全部完成</Badge>
    }
    if (leaderStatus === 'completed') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">领导已评</Badge>
    }
    if (selfStatus === 'completed') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">自评已完成</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">待处理</Badge>
  }

  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (difference < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <span className="w-4 h-4 text-gray-600">-</span>
  }

  const filteredResults = teamResults.filter(result => {
    const matchesSearch = result.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.department.toLowerCase().includes(searchQuery.toLowerCase())
    
    switch (activeTab) {
      case 'completed':
        return matchesSearch && result.self_status === 'completed' && result.leader_status === 'completed'
      case 'pending':
        return matchesSearch && (result.self_status === 'pending' || result.leader_status === 'pending')
      case 'comparison':
        return matchesSearch && result.comparison && result.self_score && result.leader_score
      default:
        return matchesSearch
    }
  })

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
            <span className="ml-2 text-gray-600">加载评估结果...</span>
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
              返回评估中心
            </Button>
          </div>

          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无法获取评估结果</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadData}>
              重新加载
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} pendingTasksCount={0} />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回评估中心
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {assessmentDetail?.title || `考核 #${assessmentId}`}
              </h1>
              <p className="text-gray-600 mt-1">
                {assessmentDetail?.period || '评估结果'} · 团队评估结果分析
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索团队成员..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* 总体统计 */}
        {progressData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">团队人数</p>
                    <p className="text-2xl font-bold">{progressData.total_participants}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">自评完成</p>
                    <p className="text-2xl font-bold text-green-600">{progressData.self_completed_count}</p>
                    <p className="text-xs text-gray-500">{safeToFixed(progressData.self_completion_rate, 0)}%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">领导评分</p>
                    <p className="text-2xl font-bold text-purple-600">{progressData.leader_completed_count}</p>
                    <p className="text-xs text-gray-500">{safeToFixed(progressData.leader_completion_rate, 0)}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">整体完成</p>
                    <p className="text-2xl font-bold text-orange-600">{progressData.fully_completed_count}</p>
                    <p className="text-xs text-gray-500">{safeToFixed(progressData.overall_completion_rate, 0)}%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">总体概览</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="pending">待处理</TabsTrigger>
            <TabsTrigger value="comparison">评分对比</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  团队成员评估状态
                </CardTitle>
                <CardDescription>
                  所有团队成员的评估完成情况和得分概览
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredResults.map((result) => (
                    <div key={result.user_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{result.user_name}</h3>
                          <p className="text-sm text-gray-600">{result.department}</p>
                        </div>
                        {getStatusBadge(result.self_status, result.leader_status, result.completion_status)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">自评得分：</span>
                          <span className={`font-semibold ${getScoreColor(safeToNumber(result.self_score))}`}>
                            {safeToFixed(result.self_score)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">领导评分：</span>
                          <span className={`font-semibold ${getScoreColor(safeToNumber(result.leader_score))}`}>
                            {safeToFixed(result.leader_score)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">当前得分：</span>
                          <span className={`font-semibold ${getScoreColor(safeToNumber(result.current_score || result.final_score))}`}>
                            {safeToFixed(result.current_score || result.final_score)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {result.last_updated && (
                            <span>最后更新：{evaluationUtils.formatDateTime(result.last_updated)}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {result.leader_status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => router.push(`/lead/evaluation/${assessmentId}/${result.user_id}`)}
                            >
                              评分
                            </Button>
                          )}
                          {result.comparison && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/lead/evaluation/comparison/${assessmentId}/${result.user_id}`)}
                            >
                              查看对比
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  已完成评估
                </CardTitle>
                <CardDescription>
                  已完成自评和领导评分的团队成员
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredResults.length > 0 ? (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <div key={result.user_id} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{result.user_name}</h3>
                            <p className="text-sm text-gray-600">{result.department}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {safeToFixed(result.current_score || result.final_score)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(result.current_score || result.final_score) ? getScoreLevel(safeToNumber(result.current_score || result.final_score)) : ''}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">自评得分：</span>
                            <span className="font-semibold">{safeToFixed(result.self_score)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">领导评分：</span>
                            <span className="font-semibold">{safeToFixed(result.leader_score)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            完成时间：{result.last_updated && evaluationUtils.formatDateTime(result.last_updated)}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/lead/evaluation/comparison/${assessmentId}/${result.user_id}`)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无已完成评估</h3>
                    <p>等待团队成员完成评估</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  待处理评估
                </CardTitle>
                <CardDescription>
                  尚未完成自评或领导评分的团队成员
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredResults.length > 0 ? (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <div key={result.user_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{result.user_name}</h3>
                            <p className="text-sm text-gray-600">{result.department}</p>
                          </div>
                          {getStatusBadge(result.self_status, result.leader_status, result.completion_status)}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            {result.self_status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span>自评：{result.self_status === 'completed' ? '已完成' : '待完成'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.leader_status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span>领导评分：{result.leader_status === 'completed' ? '已完成' : '待完成'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {result.last_updated && (
                              <span>最后更新：{evaluationUtils.formatDateTime(result.last_updated)}</span>
                            )}
                          </div>
                          {result.leader_status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => router.push(`/lead/evaluation/${assessmentId}/${result.user_id}`)}
                            >
                              开始评分
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
                    <h3 className="text-lg font-medium mb-2">所有评估已完成</h3>
                    <p>团队成员都已完成评估</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  评分对比分析
                </CardTitle>
                <CardDescription>
                  自评与领导评分的对比分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredResults.length > 0 ? (
                  <div className="space-y-4">
                    {filteredResults.map((result) => (
                      <div key={result.user_id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{result.user_name}</h3>
                            <p className="text-sm text-gray-600">{result.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.self_score && result.leader_score && (
                              <>
                                {(() => {
                                  const difference = safeToNumber(result.leader_score) - safeToNumber(result.self_score)
                                  return getDifferenceIcon(difference)
                                })()}
                                <span className="font-medium">
                                  {safeToFixed(Math.abs(safeToNumber(result.leader_score) - safeToNumber(result.self_score)))}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {safeToFixed(result.self_score)}
                            </div>
                            <div className="text-sm text-gray-600">自评得分</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {safeToFixed(result.leader_score)}
                            </div>
                            <div className="text-sm text-gray-600">领导评分</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">
                              {result.self_score && result.leader_score 
                                ? safeToFixed(Math.abs(safeToNumber(result.leader_score) - safeToNumber(result.self_score)))
                                : '--'
                              }
                            </div>
                            <div className="text-sm text-gray-600">分差</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {result.self_score && result.leader_score && (
                              <span>
                                {(() => {
                                  const difference = safeToNumber(result.leader_score) - safeToNumber(result.self_score)
                                  if (difference > 0) return '领导评分更高'
                                  if (difference < 0) return '自评更高'
                                  return '评分一致'
                                })()}
                              </span>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/lead/evaluation/comparison/${assessmentId}/${result.user_id}`)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无对比数据</h3>
                    <p>需要完成自评和领导评分后才能进行对比</p>
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