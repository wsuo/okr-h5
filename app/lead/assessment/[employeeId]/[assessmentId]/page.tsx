"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, ArrowRight, Save, Send, User, AlertTriangle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import LeadHeader from "@/components/lead-header"

interface AssessmentItem {
  id: string
  name: string
  weight: number
  leaderOnly: boolean
  subItems: Array<{
    id: string
    name: string
    score: number
    comment: string
  }>
}

export default function LeadAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [employeeInfo, setEmployeeInfo] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [assessmentData, setAssessmentData] = useState<AssessmentItem[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [finalComment, setFinalComment] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }

    // 模拟加载员工信息
    const getEmployeeInfo = (employeeId: string) => {
      const employees = {
        zhangsan: { name: "张三", position: "前端工程师" },
        wangwu: { name: "王五", position: "后端工程师" },
      }
      return employees[employeeId as keyof typeof employees]
    }

    setEmployeeInfo(getEmployeeInfo(params.employeeId as string))

    // 模拟加载考核模板快照（领导版本，包含所有项目）
    const mockTemplate: AssessmentItem[] = [
      {
        id: "work-performance",
        name: "工作绩效",
        weight: 60,
        leaderOnly: false,
        subItems: [
          { id: "work-saturation", name: "工作饱和度", score: 0, comment: "" },
          { id: "work-execution", name: "工作执行度", score: 0, comment: "" },
          { id: "work-completion", name: "工作完成度", score: 0, comment: "" },
          { id: "work-efficiency", name: "工作效率", score: 0, comment: "" },
          { id: "work-quality", name: "工作质量", score: 0, comment: "" },
        ],
      },
      {
        id: "daily-management",
        name: "日常管理",
        weight: 30,
        leaderOnly: false,
        subItems: [
          { id: "work-attitude", name: "工作态度", score: 0, comment: "" },
          { id: "approval-process", name: "审批流程", score: 0, comment: "" },
          { id: "daily-attendance", name: "日常出勤", score: 0, comment: "" },
          { id: "work-report", name: "工作汇报", score: 0, comment: "" },
          { id: "team-activity", name: "团队活动", score: 0, comment: "" },
          { id: "office-environment", name: "办公室环境维护", score: 0, comment: "" },
          { id: "rules-compliance", name: "规章制度遵守", score: 0, comment: "" },
        ],
      },
      {
        id: "leader-evaluation",
        name: "领导评价",
        weight: 10,
        leaderOnly: true,
        subItems: [{ id: "special-tasks", name: "交代的专项按时完成并及时反馈", score: 0, comment: "" }],
      },
    ]

    setAssessmentData(mockTemplate)
  }, [params.employeeId, params.assessmentId])

  const currentItem = assessmentData[currentStep]

  const calculateItemScore = (item: AssessmentItem) => {
    const validScores = item.subItems.filter((sub) => sub.score > 0)
    if (validScores.length === 0) return 0
    return validScores.reduce((sum, sub) => sum + sub.score, 0) / validScores.length
  }

  const calculateTotalScore = () => {
    let totalScore = 0
    let totalWeight = 0

    assessmentData.forEach((item) => {
      const itemScore = calculateItemScore(item)
      if (itemScore > 0) {
        totalScore += itemScore * (item.weight / 100)
        totalWeight += item.weight
      }
    })

    return totalWeight > 0 ? ((totalScore / totalWeight) * 100).toFixed(1) : "0.0"
  }

  const getProgress = () => {
    const totalSubItems = assessmentData.reduce((sum, item) => sum + item.subItems.length, 0)
    const completedSubItems = assessmentData.reduce(
      (sum, item) => sum + item.subItems.filter((sub) => sub.score > 0).length,
      0,
    )
    return totalSubItems > 0 ? (completedSubItems / totalSubItems) * 100 : 0
  }

  const updateSubItemScore = (subItemId: string, score: number) => {
    setAssessmentData((prev) =>
      prev.map((item) => ({
        ...item,
        subItems: item.subItems.map((sub) => (sub.id === subItemId ? { ...sub, score } : sub)),
      })),
    )
  }

  const updateSubItemComment = (subItemId: string, comment: string) => {
    setAssessmentData((prev) =>
      prev.map((item) => ({
        ...item,
        subItems: item.subItems.map((sub) => (sub.id === subItemId ? { ...sub, comment } : sub)),
      })),
    )
  }

  const handleSave = () => {
    localStorage.setItem(
      `lead-assessment-draft-${params.employeeId}-${params.assessmentId}`,
      JSON.stringify(assessmentData),
    )
    alert("已保存草稿")
  }

  const handleSubmit = () => {
    const completedItems = assessmentData.filter((item) => item.subItems.some((sub) => sub.score > 0))

    if (completedItems.length === 0) {
      alert("请至少完成一个大项的评分")
      return
    }

    setIsPreviewMode(true)
  }

  const handlePublish = () => {
    if (!finalComment.trim()) {
      alert("请填写总体评价")
      return
    }

    // 模拟计算最终得分
    const leaderScore = Number.parseFloat(calculateTotalScore())
    const selfScore = params.employeeId === "zhangsan" ? 85.2 : 88.1 // 模拟员工自评分数
    const finalScore = selfScore * 0.4 + leaderScore * 0.6

    alert(`评分已发布！\n员工自评：${selfScore}\n领导评分：${leaderScore}\n最终得分：${finalScore.toFixed(1)}`)
    router.push("/lead")
  }

  if (!userInfo || !employeeInfo || !currentItem) {
    return <div>Loading...</div>
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LeadHeader userInfo={userInfo} />

        <div className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setIsPreviewMode(false)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回编辑
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">评分结果预览</h1>
            <p className="text-gray-600">
              为 {employeeInfo.name} 的 {params.assessmentId} 考核评分
            </p>
          </div>

          {/* 评分结果概览 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                评分结果概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{calculateTotalScore()}</div>
                  <div className="text-gray-600">我的评分</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {params.employeeId === "zhangsan" ? "85.2" : "88.1"}
                  </div>
                  <div className="text-gray-600">员工自评</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {(
                      (params.employeeId === "zhangsan" ? 85.2 : 88.1) * 0.4 +
                      Number.parseFloat(calculateTotalScore()) * 0.6
                    ).toFixed(1)}
                  </div>
                  <div className="text-gray-600">最终得分</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-semibold">各项得分详情</h4>
                {assessmentData.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline">{item.weight}%</Badge>
                      {item.leaderOnly && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">仅限领导评分</Badge>
                      )}
                    </div>
                    <span className="font-semibold text-blue-600">{calculateItemScore(item).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 总体评价 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>总体评价</CardTitle>
              <CardDescription>请填写对该员工本次考核的总体评价</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={finalComment}
                onChange={(e) => setFinalComment(e.target.value)}
                placeholder="请填写总体评价，包括优点、不足和改进建议..."
                rows={6}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* 发布按钮 */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              返回编辑
            </Button>
            <Button onClick={handlePublish} className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              发布结果
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-4xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/lead")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">为 {employeeInfo.name} 评分</h1>
          <p className="text-gray-600">
            {params.assessmentId} 考核 · {employeeInfo.position}
          </p>
        </div>

        {/* 重要提示 */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">评分说明</h4>
                <p className="text-sm text-orange-800">
                  为确保评分公平性，您在评分过程中无法看到员工的自评分数。请根据员工的实际工作表现进行客观评分。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 进度条 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">评分进度</span>
              <span className="text-sm text-gray-600">{getProgress().toFixed(0)}%</span>
            </div>
            <Progress value={getProgress()} className="h-2 mb-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                当前：{currentStep + 1} / {assessmentData.length}
              </span>
              <span className="font-semibold text-blue-600">当前评分：{calculateTotalScore()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 评分区域 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentItem.name}
                  <Badge variant="outline">{currentItem.weight}%</Badge>
                  {currentItem.leaderOnly && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">仅限领导评分</Badge>
                  )}
                </CardTitle>
                <CardDescription>当前大项得分：{calculateItemScore(currentItem).toFixed(1)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {currentItem.subItems.map((subItem, index) => (
                <div key={subItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{subItem.name}</h3>
                    <Badge variant={subItem.score > 0 ? "default" : "outline"}>
                      {subItem.score > 0 ? `${subItem.score}分` : "未评分"}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`score-${subItem.id}`}>评分 (0-100分)</Label>
                      <Input
                        id={`score-${subItem.id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={subItem.score || ""}
                        onChange={(e) => updateSubItemScore(subItem.id, Number.parseInt(e.target.value) || 0)}
                        placeholder="请输入分数"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`comment-${subItem.id}`}>评分说明</Label>
                      <Textarea
                        id={`comment-${subItem.id}`}
                        value={subItem.comment}
                        onChange={(e) => updateSubItemComment(subItem.id, e.target.value)}
                        placeholder="请说明评分理由和具体表现..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 导航按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              上一项
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.min(assessmentData.length - 1, currentStep + 1))}
              disabled={currentStep === assessmentData.length - 1}
            >
              下一项
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              保存草稿
            </Button>
            <Button onClick={handleSubmit}>
              <Send className="w-4 h-4 mr-2" />
              完成评分
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
