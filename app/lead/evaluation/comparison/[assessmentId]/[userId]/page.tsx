"use client"

import { useParams } from "next/navigation"
import EvaluationComparisonView from "@/components/evaluation-comparison-view"
import LeadHeader from "@/components/lead-header"

export default function EvaluationComparisonPage() {
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  const userId = parseInt(params.userId as string)

  return (
    <EvaluationComparisonView
      assessmentId={assessmentId}
      userId={userId}
      role="lead"
      HeaderComponent={LeadHeader}
      backPath={`/lead/evaluation/result/${assessmentId}`}
      backLabel="返回评估结果"
      pageTitle="评分对比分析"
      pageDescription="自评、领导评分与Boss评分的详细对比"
    />
  )
}