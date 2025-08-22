"use client"

import { useParams } from "next/navigation"
import { Building2 } from "lucide-react"
import EmployeeDetailView from "@/components/employee-detail-view"
import BossHeader from "@/components/boss-header"

export default function EmployeeDetailPage() {
  const params = useParams()
  const userId = parseInt(params.id as string)

  return (
    <EmployeeDetailView
      userId={userId}
      role="boss"
      HeaderComponent={BossHeader}
      backPath="/boss"
      backLabel="返回全员看板"
      showSkillsTab={true}
      historyActionConfig={{
        buttonText: "查看详情",
        getPath: (assessmentId: number, employeeId: number) => 
          `/boss/evaluation/comparison/${assessmentId}/${employeeId}`
      }}
      fourthCardConfig={{
        title: "考核参与",
        icon: Building2,
        getValue: (employeeInfo, employeeStats) => (
          <p className="text-2xl font-bold text-orange-600">
            {employeeStats?.completed_assessments || 0}/{employeeStats?.total_assessments || 0}
          </p>
        )
      }}
    />
  )
}