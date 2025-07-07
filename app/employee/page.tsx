"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, AlertCircle, TrendingUp, Calendar, User } from "lucide-react"
import EmployeeHeader from "@/components/employee-header"
import { useRouter } from "next/navigation"

export default function EmployeeDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }
  }, [])

  // 模拟数据
  const pendingAssessments = [
    {
      id: "2024-01",
      title: "2024年1月绩效考核",
      deadline: "2024-01-31",
      status: "pending",
      progress: 0,
    },
  ]

  const historyAssessments = [
    {
      id: "2023-12",
      title: "2023年12月绩效考核",
      finalScore: 87.5,
      selfScore: 85.2,
      leaderScore: 88.9,
      status: "completed",
      date: "2023-12-31",
    },
    {
      id: "2023-11",
      title: "2023年11月绩效考核",
      finalScore: 82.3,
      selfScore: 80.1,
      leaderScore: 83.8,
      status: "completed",
      date: "2023-11-30",
    },
  ]

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

  if (!userInfo) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的绩效中心</h1>
          <p className="text-gray-600">查看和管理您的绩效考核</p>
        </div>

        {/* 个人统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最近得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(87.5)}`}>87.5</p>
                  <p className="text-xs text-gray-500">优秀</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className="text-2xl font-bold text-blue-600">84.9</p>
                  <p className="text-xs text-gray-500">良好</p>
                </div>
                <User className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待办事项</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingAssessments.length}</p>
                  <p className="text-xs text-gray-500">需处理</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 待办事项 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              待办事项
            </CardTitle>
            <CardDescription>需要您完成的绩效考核任务</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingAssessments.length > 0 ? (
              <div className="space-y-4">
                {pendingAssessments.map((assessment) => (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{assessment.title}</h3>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        待完成
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        截止：{assessment.deadline}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>完成进度</span>
                          <span>{assessment.progress}%</span>
                        </div>
                        <Progress value={assessment.progress} className="h-2" />
                      </div>
                      <Button onClick={() => router.push(`/employee/assessment/${assessment.id}`)} size="sm">
                        开始评分
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>暂无待办事项</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 历史记录 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              历史记录
            </CardTitle>
            <CardDescription>您的绩效考核历史记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historyAssessments.map((assessment) => (
                <div key={assessment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{assessment.title}</h3>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      已完成
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">最终得分：</span>
                      <span className={`font-semibold ${getScoreColor(assessment.finalScore)}`}>
                        {assessment.finalScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">自评得分：</span>
                      <span className="font-semibold">{assessment.selfScore}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">领导评分：</span>
                      <span className="font-semibold">{assessment.leaderScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">完成时间：{assessment.date}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/employee/history/${assessment.id}`)}
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
