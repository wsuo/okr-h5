"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Calendar, Users, CheckCircle, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AssessmentManagement() {
  const router = useRouter()
  const [assessments, setAssessments] = useState([
    {
      id: "2024-01",
      title: "2024年1月绩效考核",
      period: "2024-01",
      status: "active",
      deadline: "2024-01-31",
      participants: 4,
      completed: 0,
      createdAt: "2024-01-01",
    },
    {
      id: "2023-12",
      title: "2023年12月绩效考核",
      period: "2023-12",
      status: "completed",
      deadline: "2023-12-31",
      participants: 4,
      completed: 4,
      createdAt: "2023-12-01",
    },
  ])

  const [newAssessment, setNewAssessment] = useState({
    title: "",
    period: "",
    deadline: "",
    description: "",
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateAssessment = () => {
    const assessment = {
      id: `${newAssessment.period}`,
      title: newAssessment.title,
      period: newAssessment.period,
      status: "active" as const,
      deadline: newAssessment.deadline,
      participants: 4,
      completed: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setAssessments([assessment, ...assessments])
    setNewAssessment({ title: "", period: "", deadline: "", description: "" })
    setIsDialogOpen(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">进行中</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">已完成</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              考核管理
            </CardTitle>
            <CardDescription>创建和管理绩效考核任务</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                发布新考核
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>发布新考核</DialogTitle>
                <DialogDescription>创建一个新的绩效考核任务</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">考核标题</Label>
                  <Input
                    id="title"
                    placeholder="例如：2024年2月绩效考核"
                    value={newAssessment.title}
                    onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">考核周期</Label>
                  <Input
                    id="period"
                    type="month"
                    value={newAssessment.period}
                    onChange={(e) => setNewAssessment({ ...newAssessment, period: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">截止日期</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newAssessment.deadline}
                    onChange={(e) => setNewAssessment({ ...newAssessment, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">考核说明</Label>
                  <Textarea
                    id="description"
                    placeholder="请填写本次考核的相关说明..."
                    value={newAssessment.description}
                    onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleCreateAssessment}
                  className="w-full"
                  disabled={!newAssessment.title || !newAssessment.period || !newAssessment.deadline}
                >
                  发布考核
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{assessment.title}</h3>
                  <p className="text-sm text-gray-600">考核周期：{assessment.period}</p>
                </div>
                {getStatusBadge(assessment.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>截止：{assessment.deadline}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>参与：{assessment.participants}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span>完成：{assessment.completed}人</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>创建：{assessment.createdAt}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/assessment/${assessment.id}`)}>
                  查看详情
                </Button>
                <Button variant="outline" size="sm">
                  导出数据
                </Button>
                {assessment.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                  >
                    结束考核
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
