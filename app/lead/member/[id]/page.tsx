"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, TrendingUp, Calendar, Award, BarChart3 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import LeadHeader from "@/components/lead-header"

export default function MemberDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [memberInfo, setMemberInfo] = useState<any>(null)

  useEffect(() => {
    const user = localStorage.getItem("userInfo")
    if (user) {
      setUserInfo(JSON.parse(user))
    }

    // 模拟加载成员详细信息
    const mockMemberInfo = {
      id: params.id,
      name: params.id === "zhangsan" ? "张三" : "王五",
      position: params.id === "zhangsan" ? "前端工程师" : "后端工程师",
      department: "技术部",
      joinDate: params.id === "zhangsan" ? "2023-03-15" : "2023-05-20",
      currentScore: params.id === "zhangsan" ? 85.2 : 88.7,
      avgScore: params.id === "zhangsan" ? 83.5 : 86.3,
      trend: "up",
      historyRecords: [
        {
          id: "2023-12",
          title: "2023年12月绩效考核",
          finalScore: params.id === "zhangsan" ? 87.5 : 90.2,
          selfScore: params.id === "zhangsan" ? 85.2 : 88.1,
          leaderScore: params.id === "zhangsan" ? 88.9 : 91.5,
          date: "2023-12-31",
          status: "completed",
        },
        {
          id: "2023-11",
          title: "2023年11月绩效考核",
          finalScore: params.id === "zhangsan" ? 82.3 : 85.8,
          selfScore: params.id === "zhangsan" ? 80.1 : 84.2,
          leaderScore: params.id === "zhangsan" ? 83.8 : 86.9,
          date: "2023-11-30",
          status: "completed",
        },
        {
          id: "2023-10",
          title: "2023年10月绩效考核",
          finalScore: params.id === "zhangsan" ? 80.8 : 83.5,
          selfScore: params.id === "zhangsan" ? 79.5 : 82.1,
          leaderScore: params.id === "zhangsan" ? 81.7 : 84.3,
          date: "2023-10-31",
          status: "completed",
        },
      ],
      trendData: [
        { month: "10月", score: params.id === "zhangsan" ? 80.8 : 83.5 },
        { month: "11月", score: params.id === "zhangsan" ? 82.3 : 85.8 },
        { month: "12月", score: params.id === "zhangsan" ? 87.5 : 90.2 },
      ],
    }

    setMemberInfo(mockMemberInfo)
  }, [params.id])

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

  const getScoreBadge = (score: number) => {
    const level = getScoreLevel(score)
    const colorClass =
      score >= 90
        ? "bg-green-100 text-green-800 border-green-200"
        : score >= 80
          ? "bg-blue-100 text-blue-800 border-blue-200"
          : score >= 70
            ? "bg-yellow-100 text-yellow-800 border-yellow-200"
            : "bg-red-100 text-red-800 border-red-200"

    return <Badge className={colorClass}>{level}</Badge>
  }

  if (!userInfo || !memberInfo) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeadHeader userInfo={userInfo} />

      <div className="container mx-auto p-4 max-w-6xl">
        {/* 头部信息 */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/lead")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回团队管理
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{memberInfo.name}</h1>
              <p className="text-gray-600">
                {memberInfo.position} · {memberInfo.department}
              </p>
            </div>
          </div>
        </div>

        {/* 概览统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">最近得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(memberInfo.currentScore)}`}>
                    {memberInfo.currentScore}
                  </p>
                </div>
                <Award className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">平均得分</p>
                  <p className={`text-2xl font-bold ${getScoreColor(memberInfo.avgScore)}`}>{memberInfo.avgScore}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">绩效等级</p>
                  <div className="mt-1">{getScoreBadge(memberInfo.currentScore)}</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">入职时间</p>
                  <p className="text-sm font-medium">{memberInfo.joinDate}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Tabs defaultValue="trend" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trend">绩效趋势</TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <Card>
              <CardHeader>
                <CardTitle>绩效趋势分析</CardTitle>
                <CardDescription>近三个月的绩效变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={memberInfo.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">趋势分析</h4>
                  <p className="text-blue-800 text-sm">
                    {memberInfo.name}在近三个月的绩效表现呈现
                    <span className="font-semibold text-green-600">上升趋势</span>， 从10月的
                    {memberInfo.trendData[0].score}分提升到12月的{memberInfo.trendData[2].score}分， 提升了
                    {(memberInfo.trendData[2].score - memberInfo.trendData[0].score).toFixed(1)}分，
                    表现出良好的成长性。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>历史考核记录</CardTitle>
                <CardDescription>查看详细的历史考核记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {memberInfo.historyRecords.map((record: any) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{record.title}</h3>
                          <p className="text-sm text-gray-600">完成时间：{record.date}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">最终得分：</span>
                          <span className={`font-semibold ${getScoreColor(record.finalScore)}`}>
                            {record.finalScore}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">自评得分：</span>
                          <span className="font-semibold">{record.selfScore}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">我的评分：</span>
                          <span className="font-semibold">{record.leaderScore}</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/lead/history/${memberInfo.id}/${record.id}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
