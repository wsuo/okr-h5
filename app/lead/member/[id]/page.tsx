"use client"

import { useParams } from "next/navigation"
import { Calendar } from "lucide-react"
import EmployeeDetailView from "@/components/employee-detail-view"
import LeadHeader from "@/components/lead-header"

export default function MemberDetailPage() {
  const params = useParams()
  const userId = parseInt(params.id as string)

  return (
    <EmployeeDetailView
      userId={userId}
      role="lead"
      HeaderComponent={LeadHeader}
      backPath="/lead"
      backLabel="返回团队管理"
      showSkillsTab={false}
      historyActionConfig={{
        buttonText: "查看对比",
        getPath: (assessmentId: number, employeeId: number) => 
          `/lead/evaluation/result/${assessmentId}?userId=${employeeId}`
      }}
      fourthCardConfig={{
        title: "入职时间",
        icon: Calendar,
        getValue: (employeeInfo, employeeStats) => (
          <p className="text-sm font-medium">
            {employeeInfo?.join_date ?
              new Date(employeeInfo.join_date).toLocaleDateString() :
              '未设置'
            }
          </p>
        )
      }}
    />
  )
}