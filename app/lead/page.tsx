"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react"
import LeadHeader from "@/components/lead-header"
import { useRouter } from "next/navigation"

export default function LeadDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }
  }, [])

  // 模拟数据 - 根据不同领导显示不同下属
  const getSubordinates = (leaderId: string) => {
    if (leaderId === "lisi") {
      return [
        {
          id: "zhangsan",
          name: "张三",
          position: "前端工程师",
          pendingAssessments: [
            {
              id: "2024-01",
              title: "2024年1月绩效考核",
              deadline: "2024-01-31",
              selfCompleted: true,
              leaderCompleted: false,
            },
          ],
          lastScore: 85.2,
          avgScore: 83.5,
        },
        {
          id: "wangwu",
          name: "王五",
          position: "后端工程师",
          pendingAssessments: [
            {
              id: "2024-01",
              title: "2024年1月绩效考核",
              deadline: "2024-01-31",
              selfCompleted: true,
              leaderCompleted: false,
            },
          ],
          lastScore: 88.7,
          avgScore: 86.3,
        },
      ]
    }
    return []
  }

  const subordinates = userInfo ? getSubordinates(userInfo.id) : []

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (!userInfo) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">团队管理</h1>
          <p className="text-gray-600">管理您的团队绩效考核</p>
        </div>

        {/* 团队统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">团队人数</p>
                  <p className="text-2xl font-bold">{subordinates.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">待我评分</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {subordinates.filter((s) => s.pendingAssessments.some((a) => !a.leaderCompleted)).length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">团队平均分</p>
                  <p className="text-2xl font-bold text-green-600">84.9</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">完成率</p>
                  <p className="text-2xl font-bold text-purple-600">75%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 待我评分 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              待我评分
            </CardTitle>
            <CardDescription>需要您完成评分的下属考核</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subordinates
                .filter((subordinate) =>
                  subordinate.pendingAssessments.some((a) => a.selfCompleted && !a.leaderCompleted),
                )
                .map((subordinate) => (
                  <div key={subordinate.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{subordinate.name}</h3>
                        <p className="text-sm text-gray-600">{subordinate.position}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        待评分
                      </Badge>
                    </div>
                    {subordinate.pendingAssessments
                      .filter((a) => a.selfCompleted && !a.leaderCompleted)
                      .map((assessment) => (
                        <div key={assessment.id} className="mt-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{assessment.title}</p>
                              <p className="text-xs text-gray-500">截止：{assessment.deadline}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => router.push(`/lead/assessment/${subordinate.id}/${assessment.id}`)}
                            >
                              开始评分
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              {subordinates.filter((s) => s.pendingAssessments.some((a) => a.selfCompleted && !a.leaderCompleted))
                .length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>暂无待评分项目</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 团队成员 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              团队成员
            </CardTitle>
            <CardDescription>您的团队成员绩效概览</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subordinates.map((subordinate) => (
                <div key={subordinate.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{subordinate.name}</h3>
                      <p className="text-sm text-gray-600">{subordinate.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">最近得分</p>
                      <p className={`text-lg font-bold ${getScoreColor(subordinate.lastScore)}`}>
                        {subordinate.lastScore}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">平均得分：</span>
                      <span className={`font-semibold ${getScoreColor(subordinate.avgScore)}`}>
                        {subordinate.avgScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">待办事项：</span>
                      <span className="font-semibold">{subordinate.pendingAssessments.length}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => router.push(`/lead/member/${subordinate.id}`)}
                  >
                    查看详情
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
