"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, AlertTriangle, Crown, Save, Send, User, Award } from "lucide-react"
import { toast } from "sonner"
import BossHeader from "@/components/boss-header"
import { safeParseUserInfo } from "@/lib/utils"
import {
  evaluationService,
  BossEvaluationTemplate,
  SubmitBossEvaluationRequest
} from "@/lib/evaluation"
import { userService } from "@/lib/user"

export default function BossEvaluationFormPage() {
  const params = useParams()
  const router = useRouter()
  
  const assessmentId = parseInt(params.assessmentId as string)
  const evaluateeId = parseInt(params.evaluateeId as string)
  
  const [userInfo, setUserInfo] = useState<any>(null)
  const [template, setTemplate] = useState<BossEvaluationTemplate | null>(null)
  const [evaluateeInfo, setEvaluateeInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 表单数据
  const [score, setScore] = useState<number>(85)
  const [feedback, setFeedback] = useState<string>('')
  const [strengths, setStrengths] = useState<string>('')
  const [improvements, setImprovements] = useState<string>('')

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
      loadEvaluationData()
    } else {
      router.push('/')
      return
    }
  }, [])

  // 加载评估数据
  const loadEvaluationData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 检查参数有效性
      if (!assessmentId || !evaluateeId) {
        throw new Error('评估参数无效')
      }

      // 并行加载模板和被评估人信息
      const [templateResponse, evaluateeResponse] = await Promise.all([
        evaluationService.getBossEvaluationTemplate(assessmentId, evaluateeId),
        userService.getUser(evaluateeId)
      ])

      // 处理模板响应
      if (templateResponse.code === 200 && templateResponse.data) {
        const templateData = templateResponse.data
        
        // 检查是否是简化模式
        if (!templateData.is_boss_simplified) {
          throw new Error('该考核不支持Boss简化评分模式')
        }
        
        setTemplate(templateData)
      } else {
        throw new Error(templateResponse.message || '获取评估模板失败')
      }

      // 处理被评估人信息
      if (evaluateeResponse.code === 200 && evaluateeResponse.data) {
        setEvaluateeInfo(evaluateeResponse.data)
      } else {
        throw new Error(evaluateeResponse.message || '获取被评估人信息失败')
      }

      // 检查是否已经完成评分
      try {
        const evaluationsResponse = await evaluationService.getEvaluations({
          assessment_id: assessmentId,
          evaluatee_id: evaluateeId,
          type: 'boss'
        })
        
        if (evaluationsResponse.code === 200 && evaluationsResponse.data?.items?.length > 0) {
          const evaluation = evaluationsResponse.data.items[0]
          if (evaluation.status === 'submitted' || evaluation.status === 'completed') {
            toast.info('您已完成对该员工的Boss评分')
            router.push('/boss/evaluation')
            return
          }
        }
      } catch (checkError) {
        // 检查失败不影响主流程
        console.warn('检查现有评分失败:', checkError)
      }

    } catch (error: any) {
      console.error('加载评估数据失败:', error)
      setError(error.message || '加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理评分提交
  const handleSubmit = async () => {
    try {
      // 验证表单数据
      if (score < 0 || score > 100) {
        toast.error('评分必须在0-100之间')
        return
      }

      if (!feedback.trim()) {
        toast.error('请填写评价意见')
        return
      }

      setSubmitting(true)

      const submitData: SubmitBossEvaluationRequest = {
        assessment_id: assessmentId,
        evaluatee_id: evaluateeId,
        score: score,
        feedback: feedback.trim(),
        strengths: strengths.trim() || undefined,
        improvements: improvements.trim() || undefined
      }

      const response = await evaluationService.submitBossEvaluation(submitData)
      
      if (response.code === 200) {
        toast.success('Boss评分提交成功！', {
          description: '系统将自动计算最终加权得分'
        })
        router.push('/boss/evaluation')
      } else {
        throw new Error(response.message || '提交失败')
      }

    } catch (error: any) {
      console.error('提交Boss评分失败:', error)
      toast.error('提交失败', {
        description: error.message || '服务器错误，请稍后重试'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 返回任务列表
  const goBack = () => {
    router.push('/boss/evaluation')
  }

  // 获取评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 90) return { text: '优秀', color: 'text-green-600' }
    if (score >= 80) return { text: '良好', color: 'text-blue-600' }
    if (score >= 70) return { text: '合格', color: 'text-yellow-600' }
    return { text: '待改进', color: 'text-red-600' }
  }

  const scoreLevel = getScoreLevel(score)

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
            <Button variant="outline" onClick={loadEvaluationData}>
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
            <span className="text-lg">正在加载评估模板...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!template || !evaluateeInfo) {
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
              未找到评估模板或被评估人信息，请联系管理员
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BossHeader userInfo={userInfo} />
      
      <div className="container mx-auto p-6 max-w-4xl">
        {/* 页面头部 */}
        <div className="mb-8">
          <Button variant="ghost" onClick={goBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回评分中心
          </Button>
          
          <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Crown className="w-8 h-8 text-yellow-600" />
              Boss 简化评分
            </h1>
            <p className="text-gray-600 text-lg">
              {template.assessment_title} · {template.assessment_period}
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-300">
                <span className="font-medium text-yellow-700">权重占比:</span>
                <span className="ml-1 font-bold text-yellow-800">
                  {template.scoring_rules.two_tier_config?.boss_weight || 10}%
                </span>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-300">
                <span className="font-medium text-yellow-700">满分:</span>
                <span className="ml-1 font-bold text-yellow-800">{template.total_score}分</span>
              </div>
            </div>
          </div>
        </div>

        {/* 被评估人信息 */}
        <Card className="mb-6">
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

        {/* Boss简化评分说明 */}
        <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <Crown className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>简化评分说明：</strong>{template.boss_evaluation_note}
          </AlertDescription>
        </Alert>

        {/* 简化评分表单 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-600" />
              Boss 评分
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 评分滑块 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">总体评分 (0-100分)</Label>
                <div className="text-right">
                  <span className={`text-3xl font-bold ${scoreLevel.color}`}>
                    {score}
                  </span>
                  <span className="text-lg text-gray-500 ml-1">/ 100</span>
                </div>
              </div>
              
              <div className="px-3 py-2">
                <Slider
                  value={[score]}
                  onValueChange={(values) => setScore(values[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2 px-1">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">精确输入：</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value) || 0)}
                    className="w-20 text-center font-bold"
                  />
                </div>
                <Badge className={`${scoreLevel.color.replace('text-', 'bg-').replace('-600', '-100')} ${scoreLevel.color} border-current`}>
                  {scoreLevel.text}
                </Badge>
              </div>
            </div>

            {/* 评价意见 */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-base font-medium">
                评价意见 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="feedback"
                placeholder="请从公司整体角度对该员工进行评价，包括工作表现、能力水平、贡献价值等..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={submitting}
              />
              <p className="text-xs text-gray-500">
                建议从管理者视角提供总体性、战略性的评价意见
              </p>
            </div>

            {/* 优势亮点 */}
            <div className="space-y-2">
              <Label htmlFor="strengths" className="text-base font-medium">
                优势亮点 <span className="text-gray-400">(可选)</span>
              </Label>
              <Textarea
                id="strengths"
                placeholder="请列举该员工的主要优势和突出表现..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={submitting}
              />
            </div>

            {/* 改进建议 */}
            <div className="space-y-2">
              <Label htmlFor="improvements" className="text-base font-medium">
                改进建议 <span className="text-gray-400">(可选)</span>
              </Label>
              <Textarea
                id="improvements"
                placeholder="请提出改进建议和发展方向..."
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={submitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <p>Boss评分将在最终结果中占 <strong>{template.scoring_rules.two_tier_config?.boss_weight || 10}%</strong> 权重</p>
                <p>提交后将自动触发最终分数的加权计算</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/boss/evaluation')}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !feedback.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  提交Boss评分
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}