"use client"

import { useParams } from "next/navigation"
import EvaluationComparisonView from "@/components/evaluation-comparison-view"
import BossHeader from "@/components/boss-header"

export default function BossEvaluationComparisonPage() {
  const params = useParams()
  const assessmentId = parseInt(params.assessmentId as string)
  const evaluateeId = parseInt(params.evaluateeId as string)

  return (
    <EvaluationComparisonView
      assessmentId={assessmentId}
      userId={evaluateeId}
      role="boss"
      HeaderComponent={BossHeader}
      backPath="/boss/evaluation"
      backLabel="返回评分中心"
      pageTitle="评分对比分析"
      pageDescription="自评、领导评分与Boss评分的对比概览"
    />
  )
}