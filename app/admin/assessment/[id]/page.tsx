"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Users, CheckCircle, Download, AlertTriangle, BarChart3, FileText } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import AdminHeader from "@/components/admin-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AssessmentDetail {
  id: string
  title: string
  period: string
  status: "active" | "completed" | "ended"
  deadline: string
  createdAt: string
  participants: Array<{
    id: string
    name: string
    department: string
    position: string
    selfCompleted: boolean
    leaderCompleted: boolean
    finalScore?: number
    selfScore?: number
    leaderScore?: number
  }>
  statistics: {
    totalParticipants: number
    selfCompletedCount: number
    leaderCompletedCount: number
    fullyCompletedCount: number
    averageScore: number
    highestScore: number
    lowestScore: number
  }
}

export default function AssessmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetail | null>(null)
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }

    // 模拟加载考核详情数据
    const mockAssessmentDetail: AssessmentDetail = {
      id: params.id as string,
      title: params.id === "2024-01" ? "2024年1月绩效考核" : "2023年12月绩效考核",
      period: params.id as string,
      status: params.id === "2024-01" ? "active" : "completed",
      deadline: params.id === "2024-01" ? "2024-01-31" : "2023-12-31",
      createdAt: params.id === "2024-01" ? "2024-01-01" : "2023-12-01",
      participants: [
        {
          id: "zhangsan",
          name: "张三",
          department: "技术部",
          position: "前端工程师",
          selfCompleted: true,
          leaderCompleted: params.id === "2024-01" ? false : true,
          finalScore: params.id === "2024-01" ? undefined : 87.5,
          selfScore: 85.2,
          leaderScore: params.id === "2024-01" ? undefined : 88.9,
        },
        {
          id: "wangwu",
          name: "王五",
          department: "技术部",
          position: "后端工程师",
          selfCompleted: true,
          leaderCompleted: params.id === "2024-01" ? false : true,
          finalScore: params.id === "2024-01" ? undefined : 90.2,
          selfScore: 88.1,
          leaderScore: params.id === "2024-01" ? undefined : 91.5,
        },
        {
          id: "lisi",
          name: "李四",
          department: "技术部",
          position: "技术经理",
          selfCompleted: true,
          leaderCompleted: params.id === "2024-01" ? false : true,
          finalScore: params.id === "2024-01" ? undefined : 92.1,
          selfScore: 90.5,
          leaderScore: params.id === "2024-01" ? undefined : 93.2,
        },
        {
          id: "zhaoliu",
          name: "赵六",
          department: "市场部",
          position: "市场经理",
          selfCompleted: true,
          leaderCompleted: params.id === "2024-01" ? false : true,
          finalScore: params.id === "2024-01" ? undefined : 87.3,
          selfScore: 85.8,
          leaderScore: params.id === "2024-01" ? undefined : 88.4,
        },
      ],
      statistics: {
        totalParticipants: 4,
        selfCompletedCount: 4,
        leaderCompletedCount: params.id === "2024-01" ? 0 : 4,
        fullyCompletedCount: params.id === "2024-01" ? 0 : 4,
        averageScore: params.id === "2024-01" ? 0 : 89.3,
        highestScore: params.id === "2024-01" ? 0 : 92.1,
        lowestScore: params.id === "2024-01" ? 0 : 87.3,
      },
    }

    setAssessmentDetail(mockAssessmentDetail)
  }, [params.id])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">进行中</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
      case "ended":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">已结束</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getCompletionRate = () => {
    if (!assessmentDetail) return 0
    return (assessmentDetail.statistics.fullyCompletedCount / assessmentDetail.statistics.totalParticipants) * 100
  }

  const handleExportData = () => {
    if (!assessmentDetail) return

    // 模拟导出数据
    const csvContent = [
      ["姓名", "部门", "职位", "自评完成", "领导评分完成", "自评得分", "领导得分", "最终得分"],
      ...assessmentDetail.participants.map((p) => [
        p.name,
        p.department,
        p.position,
        p.selfCompleted ? "是" : "否",
        p.leaderCompleted ? "是" : "否",
        p.selfScore?.toString() || "",
        p.leaderScore?.toString() || "",
        p.finalScore?.toString() || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${assessmentDetail.title}_考核数据.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEndAssessment = () => {
    if (!assessmentDetail) return

    // 模拟结束考核
    setAssessmentDetail({
      ...assessmentDetail,
      status: "ended",
    })
    setIsEndDialogOpen(false)
    alert("考核已结束")
  }

  if (!userInfo || !assessmentDetail) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-6xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/admin")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理后台
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessmentDetail.title}</h1>
              <p className="text-gray-600">考核详情与数据分析</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                导出数据
              </Button>
              {assessmentDetail.status === "active" && (
                <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      结束考核
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认结束考核</DialogTitle>
                      <DialogDescription>
                        结束考核后，未完成的评分将无法继续进行。此操作不可撤销，请确认是否继续？
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setIsEndDialogOpen(false)}>
                        取消
                      </Button>
                      <Button variant="destructive" onClick={handleEndAssessment}>
                        确认结束
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* 考核概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">考核状态</p>
                  <div className="mt-1">{getStatusBadge(assessmentDetail.status)}</div>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">参与人数</p>
                  <p className="text-2xl font-bold">{assessmentDetail.statistics.totalParticipants}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成率</p>
                  <p className="text-2xl font-bold">{getCompletionRate().toFixed(0)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {assessmentDetail.statistics.averageScore || "--"}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="participants" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="participants">参与人员</TabsTrigger>
            <TabsTrigger value="statistics">数据统计</TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>参与人员详情</CardTitle>
                <CardDescription>查看所有参与人员的完成情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentDetail.participants.map((participant) => (
                    <div key={participant.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{participant.name}</h3>
                          <p className="text-sm text-gray-600">
                            {participant.department} · {participant.position}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {participant.selfCompleted && participant.leaderCompleted ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">进行中</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">自评状态：</span>
                          <span className={participant.selfCompleted ? "text-green-600 font-medium" : "text-red-600"}>
                            {participant.selfCompleted ? "已完成" : "未完成"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">领导评分：</span>
                          <span className={participant.leaderCompleted ? "text-green-600 font-medium" : "text-red-600"}>
                            {participant.leaderCompleted ? "已完成" : "未完成"}
                          </span>
                        </div>
                        {participant.selfScore && (
                          <div>
                            <span className="text-gray-600">自评得分：</span>
                            <span className="font-medium">{participant.selfScore}</span>
                          </div>
                        )}
                        {participant.finalScore && (
                          <div>
                            <span className="text-gray-600">最终得分：</span>
                            <span className="font-medium text-blue-600">{participant.finalScore}</span>
                          </div>
                        )}
                      </div>

                      {participant.selfCompleted && participant.leaderCompleted && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>完成进度</span>
                            <span>100%</span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>完成情况统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>自评完成</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {assessmentDetail.statistics.selfCompletedCount}/
                          {assessmentDetail.statistics.totalParticipants}
                        </span>
                        <Progress
                          value={
                            (assessmentDetail.statistics.selfCompletedCount /
                              assessmentDetail.statistics.totalParticipants) *
                            100
                          }
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>领导评分完成</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {assessmentDetail.statistics.leaderCompletedCount}/
                          {assessmentDetail.statistics.totalParticipants}
                        </span>
                        <Progress
                          value={
                            (assessmentDetail.statistics.leaderCompletedCount /
                              assessmentDetail.statistics.totalParticipants) *
                            100
                          }
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>全部完成</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {assessmentDetail.statistics.fullyCompletedCount}/
                          {assessmentDetail.statistics.totalParticipants}
                        </span>
                        <Progress value={getCompletionRate()} className="w-20 h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>得分统计</CardTitle>
                </CardHeader>
                <CardContent>
                  {assessmentDetail.status === "completed" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>平均得分</span>
                        <span className="text-lg font-bold text-blue-600">
                          {assessmentDetail.statistics.averageScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>最高得分</span>
                        <span className="text-lg font-bold text-green-600">
                          {assessmentDetail.statistics.highestScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>最低得分</span>
                        <span className="text-lg font-bold text-orange-600">
                          {assessmentDetail.statistics.lowestScore}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2" />
                      <p>考核完成后将显示得分统计</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
