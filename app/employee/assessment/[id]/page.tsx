"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import EmployeeHeader from "@/components/employee-header"

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

export default function EmployeeAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [assessmentData, setAssessmentData] = useState<AssessmentItem[]>([])

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }

    // 模拟加载考核模板快照
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
    ]

    setAssessmentData(mockTemplate)
  }, [])

  const availableItems = assessmentData.filter((item) => !item.leaderOnly)
  const currentItem = availableItems[currentStep]

  const calculateItemScore = (item: AssessmentItem) => {
    const validScores = item.subItems.filter((sub) => sub.score > 0)
    if (validScores.length === 0) return 0
    return validScores.reduce((sum, sub) => sum + sub.score, 0) / validScores.length
  }

  const calculateTotalScore = () => {
    let totalScore = 0
    let totalWeight = 0

    availableItems.forEach((item) => {
      const itemScore = calculateItemScore(item)
      if (itemScore > 0) {
        totalScore += itemScore * (item.weight / 100)
        totalWeight += item.weight
      }
    })

    return totalWeight > 0 ? ((totalScore / totalWeight) * 100).toFixed(1) : "0.0"
  }

  const getProgress = () => {
    const totalSubItems = availableItems.reduce((sum, item) => sum + item.subItems.length, 0)
    const completedSubItems = availableItems.reduce(
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
    // 保存草稿
    localStorage.setItem(`assessment-draft-${params.id}`, JSON.stringify(assessmentData))
    alert("已保存草稿")
  }

  const handleSubmit = () => {
    // 提交自评
    const completedItems = availableItems.filter((item) => item.subItems.some((sub) => sub.score > 0))

    if (completedItems.length === 0) {
      alert("请至少完成一个大项的评分")
      return
    }

    alert("自评提交成功！")
    router.push("/employee")
  }

  if (!userInfo || !currentItem) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-4xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/employee")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">2024年1月绩效考核</h1>
          <p className="text-gray-600">请认真填写您的自评分数和说明</p>
        </div>

        {/* 进度条 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">完成进度</span>
              <span className="text-sm text-gray-600">{getProgress().toFixed(0)}%</span>
            </div>
            <Progress value={getProgress()} className="h-2 mb-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                当前：{currentStep + 1} / {availableItems.length}
              </span>
              <span className="font-semibold text-blue-600">预计得分：{calculateTotalScore()}</span>
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
                      <Label htmlFor={`comment-${subItem.id}`}>说明备注</Label>
                      <Textarea
                        id={`comment-${subItem.id}`}
                        value={subItem.comment}
                        onChange={(e) => updateSubItemComment(subItem.id, e.target.value)}
                        placeholder="请简要说明评分理由..."
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
              onClick={() => setCurrentStep(Math.min(availableItems.length - 1, currentStep + 1))}
              disabled={currentStep === availableItems.length - 1}
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
              提交自评
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
