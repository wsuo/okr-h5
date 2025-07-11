"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, User, TrendingUp, MessageSquare, Award } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import EmployeeHeader from "@/components/employee-header"
import { safeParseUserInfo } from "@/lib/utils"

interface HistoryDetail {
  id: string
  title: string
  period: string
  completedDate: string
  finalScore: number
  selfScore: number
  leaderScore: number
  leaderComment: string
  status: string
  items: Array<{
    id: string
    name: string
    weight: number
    leaderOnly: boolean
    selfAvgScore: number
    leaderAvgScore: number
    subItems: Array<{
      id: string
      name: string
      selfScore: number
      selfComment: string
      leaderScore: number
      leaderComment: string
    }>
  }>
}

export default function EmployeeHistoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [historyDetail, setHistoryDetail] = useState<HistoryDetail | null>(null)

  useEffect(() => {
    const user = safeParseUserInfo()
    if (user) {
      setUserInfo(user)
    } else {
      router.push('/')
      return
    }

    // 模拟加载历史考核详情数据
    const mockHistoryDetail: HistoryDetail = {
      id: params.id as string,
      title: params.id === "2023-12" ? "2023年12月绩效考核" : "2023年11月绩效考核",
      period: params.id as string,
      completedDate: params.id === "2023-12" ? "2023-12-31" : "2023-11-30",
      finalScore: params.id === "2023-12" ? 87.5 : 82.3,
      selfScore: params.id === "2023-12" ? 85.2 : 80.1,
      leaderScore: params.id === "2023-12" ? 88.9 : 83.8,
      leaderComment:
        params.id === "2023-12"
          ? "张三在本月的工作表现非常出色，工作效率和质量都有显著提升。特别是在项目执行方面表现突出，能够按时完成任务并主动汇报进度。建议继续保持，在团队协作方面可以更加积极主动。"
          : "本月工作完成情况良好，但在工作饱和度方面还有提升空间。建议在下个月能够承担更多的工作任务，提高工作效率。",
      status: "completed",
      items: [
        {
          id: "work-performance",
          name: "工作绩效",
          weight: 60,
          leaderOnly: false,
          selfAvgScore: params.id === "2023-12" ? 86.0 : 82.0,
          leaderAvgScore: params.id === "2023-12" ? 89.0 : 85.0,
          subItems: [
            {
              id: "work-saturation",
              name: "工作饱和度",
              selfScore: params.id === "2023-12" ? 85 : 80,
              selfComment: "本月承担了多个项目，工作量较为饱和",
              leaderScore: params.id === "2023-12" ? 88 : 83,
              leaderComment: "工作安排合理，能够有效管理多个任务",
            },
            {
              id: "work-execution",
              name: "工作执行度",
              selfScore: params.id === "2023-12" ? 87 : 84,
              selfComment: "能够按照计划执行工作任务",
              leaderScore: params.id === "2023-12" ? 90 : 87,
              leaderComment: "执行力强，能够严格按照要求完成任务",
            },
            {
              id: "work-completion",
              name: "工作完成度",
              selfScore: params.id === "2023-12" ? 86 : 82,
              selfComment: "按时完成了所有分配的工作任务",
              leaderScore: params.id === "2023-12" ? 89 : 85,
              leaderComment: "完成质量高，很少出现延期情况",
            },
            {
              id: "work-efficiency",
              name: "工作效率",
              selfScore: params.id === "2023-12" ? 85 : 81,
              selfComment: "通过优化工作流程提高了效率",
              leaderScore: params.id === "2023-12" ? 89 : 85,
              leaderComment: "效率提升明显，能够在规定时间内完成任务",
            },
            {
              id: "work-quality",
              name: "工作质量",
              selfScore: params.id === "2023-12" ? 87 : 83,
              selfComment: "注重工作质量，减少了返工次数",
              leaderScore: params.id === "2023-12" ? 90 : 86,
              leaderComment: "质量控制良好，交付物符合要求",
            },
          ],
        },
        {
          id: "daily-management",
          name: "日常管理",
          weight: 30,
          leaderOnly: false,
          selfAvgScore: params.id === "2023-12" ? 84.0 : 78.0,
          leaderAvgScore: params.id === "2023-12" ? 88.0 : 82.0,
          subItems: [
            {
              id: "work-attitude",
              name: "工作态度",
              selfScore: params.id === "2023-12" ? 88 : 82,
              selfComment: "保持积极的工作态度",
              leaderScore: params.id === "2023-12" ? 90 : 85,
              leaderComment: "态度端正，工作积极主动",
            },
            {
              id: "approval-process",
              name: "审批流程",
              selfScore: params.id === "2023-12" ? 85 : 78,
              selfComment: "严格按照审批流程执行",
              leaderScore: params.id === "2023-12" ? 88 : 82,
              leaderComment: "流程执行规范，很少出现错误",
            },
            {
              id: "daily-attendance",
              name: "日常出勤",
              selfScore: params.id === "2023-12" ? 90 : 85,
              selfComment: "出勤率100%，无迟到早退",
              leaderScore: params.id === "2023-12" ? 92 : 88,
              leaderComment: "出勤表现优秀，时间观念强",
            },
            {
              id: "work-report",
              name: "工作汇报",
              selfScore: params.id === "2023-12" ? 82 : 75,
              selfComment: "定期进行工作汇报",
              leaderScore: params.id === "2023-12" ? 86 : 80,
              leaderComment: "汇报及时，内容详实",
            },
            {
              id: "team-activity",
              name: "团队活动",
              selfScore: params.id === "2023-12" ? 80 : 72,
              selfComment: "积极参与团队活动",
              leaderScore: params.id === "2023-12" ? 85 : 78,
              leaderComment: "参与度较高，团队合作意识强",
            },
            {
              id: "office-environment",
              name: "办公室环境维护",
              selfScore: params.id === "2023-12" ? 85 : 80,
              selfComment: "保持工位整洁，维护公共环境",
              leaderScore: params.id === "2023-12" ? 88 : 82,
              leaderComment: "环境维护良好，有责任心",
            },
            {
              id: "rules-compliance",
              name: "规章制度遵守",
              selfScore: params.id === "2023-12" ? 88 : 84,
              selfComment: "严格遵守公司各项规章制度",
              leaderScore: params.id === "2023-12" ? 90 : 86,
              leaderComment: "制度执行到位，无违规行为",
            },
          ],
        },
        {
          id: "leader-evaluation",
          name: "领导评价",
          weight: 10,
          leaderOnly: true,
          selfAvgScore: 0,
          leaderAvgScore: params.id === "2023-12" ? 92.0 : 88.0,
          subItems: [
            {
              id: "special-tasks",
              name: "交代的专项按时完成并及时反馈",
              selfScore: 0,
              selfComment: "",
              leaderScore: params.id === "2023-12" ? 92 : 88,
              leaderComment: "专项任务完成质量高，反馈及时准确",
            },
          ],
        },
      ],
    }

    setHistoryDetail(mockHistoryDetail)
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

  if (!userInfo || !historyDetail) {
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
          <h1 className="text-2xl font-bold text-gray-900">{historyDetail.title}</h1>
          <p className="text-gray-600">考核详情与分析报告</p>
        </div>

        {/* 考核概览 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              考核概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">完成时间：</span>
                  <span className="font-medium">{historyDetail.completedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">考核状态：</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
                </div>
              </div>

              {/* 得分信息 */}
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(historyDetail.finalScore)} mb-2`}>
                    {historyDetail.finalScore}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-600">最终得分</span>
                    {getScoreBadge(historyDetail.finalScore)}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* 分数构成 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">分数构成</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">自评得分 (40%)</span>
                    <span className={`font-semibold ${getScoreColor(historyDetail.selfScore)}`}>
                      {historyDetail.selfScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">领导评分 (60%)</span>
                    <span className={`font-semibold ${getScoreColor(historyDetail.leaderScore)}`}>
                      {historyDetail.leaderScore}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">计算公式</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  最终得分 = 自评得分 × 40% + 领导评分 × 60%
                  <br />= {historyDetail.selfScore} × 0.4 + {historyDetail.leaderScore} × 0.6
                  <br />= <span className="font-semibold text-gray-900">{historyDetail.finalScore}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 详细评分对比 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              详细评分对比
            </CardTitle>
            <CardDescription>各项评分的详细对比分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {historyDetail.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge variant="outline">{item.weight}%</Badge>
                      {item.leaderOnly && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">仅限领导评分</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      {!item.leaderOnly && (
                        <div className="text-sm text-gray-600">
                          自评:{" "}
                          <span className={`font-semibold ${getScoreColor(item.selfAvgScore)}`}>
                            {item.selfAvgScore.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        领导:{" "}
                        <span className={`font-semibold ${getScoreColor(item.leaderAvgScore)}`}>
                          {item.leaderAvgScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {item.subItems.map((subItem) => (
                      <div key={subItem.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3">{subItem.name}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 自评部分 */}
                          {!item.leaderOnly && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">我的自评</span>
                                <span className={`font-semibold ${getScoreColor(subItem.selfScore)}`}>
                                  {subItem.selfScore}分
                                </span>
                              </div>
                              {subItem.selfComment && (
                                <div className="text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-blue-200">
                                  {subItem.selfComment}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 领导评分部分 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">领导评分</span>
                              <span className={`font-semibold ${getScoreColor(subItem.leaderScore)}`}>
                                {subItem.leaderScore}分
                              </span>
                            </div>
                            {subItem.leaderComment && (
                              <div className="text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-green-200">
                                {subItem.leaderComment}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 分数对比进度条 */}
                        {!item.leaderOnly && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>分数对比</span>
                              <span>
                                差值: {subItem.leaderScore - subItem.selfScore > 0 ? "+" : ""}
                                {(subItem.leaderScore - subItem.selfScore).toFixed(1)}
                              </span>
                            </div>
                            <div className="relative">
                              <Progress value={subItem.selfScore} className="h-2 bg-blue-100" />
                              <Progress
                                value={subItem.leaderScore}
                                className="h-2 bg-green-100 absolute top-0 opacity-70"
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-600">● 自评 ({subItem.selfScore})</span>
                              <span className="text-green-600">● 领导 ({subItem.leaderScore})</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 领导总体评价 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              领导总体评价
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed">{historyDetail.leaderComment}</p>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push("/employee")}>
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
