"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Info } from "lucide-react"
import { EvaluationItem, DetailedScoreItem, ScoringCriteria } from "@/lib/evaluation"

interface EvaluationItemComponentProps {
  item: EvaluationItem
  value: DetailedScoreItem
  onChange: (value: DetailedScoreItem) => void
  disabled?: boolean
  showComment?: boolean
  globalScoringCriteria?: ScoringCriteria  // 全局评分标准（从模板传入）
}

export default function EvaluationItemComponent({
  item,
  value,
  onChange,
  disabled = false,
  showComment = true,
  globalScoringCriteria
}: EvaluationItemComponentProps) {
  const [showCriteria, setShowCriteria] = useState(false)

  const handleScoreChange = (score: number) => {
    // 避免不必要的更新
    if (value.score !== score) {
      onChange({
        ...value,
        score
      })
    }
  }

  const handleCommentChange = (comment: string) => {
    onChange({
      ...value,
      comment
    })
  }

  const getScoreLevel = (score: number, criteria?: ScoringCriteria) => {
    // 提供默认的评分标准，防止 criteria 不存在或结构不完整
    const defaultCriteria = {
      excellent: { min: 90, description: "优秀：超额完成目标，表现突出" },
      good: { min: 80, description: "良好：完成目标，表现符合预期" },
      average: { min: 70, description: "一般：基本完成目标，表现一般" },
      poor: { min: 0, description: "较差：未完成目标，表现不佳" }
    }
    
    // 优先使用项目自身的评分标准，其次使用全局评分标准，最后使用默认标准
    const safeCriteria = criteria || globalScoringCriteria || defaultCriteria
    
    // 确保每个等级都存在
    const excellent = safeCriteria.excellent || defaultCriteria.excellent
    const good = safeCriteria.good || defaultCriteria.good
    const average = safeCriteria.average || defaultCriteria.average
    
    if (score >= excellent.min) return { level: 'excellent', label: '优秀', color: 'bg-green-100 text-green-800' }
    if (score >= good.min) return { level: 'good', label: '良好', color: 'bg-blue-100 text-blue-800' }
    if (score >= average.min) return { level: 'average', label: '一般', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'poor', label: '较差', color: 'bg-red-100 text-red-800' }
  }

  const currentLevel = getScoreLevel(value.score || 0, item.scoring_criteria)

  return (
    <Card className={`transition-all duration-200 ${disabled ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{item.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              权重: {item.weight}%
            </Badge>
            <Badge className={currentLevel.color}>
              {currentLevel.label}
            </Badge>
          </div>
        </div>
        {item.description && (
          <p className="text-sm text-gray-600">{item.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 评分区域 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`score-${item.id}`} className="text-sm font-medium">
              分数 (0-{item.max_score})
            </Label>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{value.score || 0}</span>
              <span className="text-sm text-muted-foreground ml-1">/ {item.max_score}</span>
            </div>
          </div>
          
          {/* 滑块评分 */}
          <div className="px-2 py-1">
            <Slider
              id={`score-${item.id}`}
              min={0}
              max={item.max_score}
              step={1}
              value={[value.score || 0]}
              onValueChange={(values) => handleScoreChange(values[0] || 0)}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-sm font-medium text-foreground mt-3 px-1">
              <span className="bg-muted px-2 py-1 rounded-md">0</span>
              <span className="bg-muted px-2 py-1 rounded-md">{item.max_score}</span>
            </div>
          </div>
          
          {/* 数字输入和操作按钮 */}
          <div className="flex items-center justify-between gap-3 bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-muted-foreground">精确输入:</Label>
              <Input
                type="number"
                min={0}
                max={item.max_score}
                value={value.score || 0}
                onChange={(e) => handleScoreChange(Number(e.target.value) || 0)}
                disabled={disabled}
                className="w-20 text-center font-bold bg-background border-border focus:border-primary"
                inputMode="numeric"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCriteria(!showCriteria)}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors touch-manipulation min-h-[40px] px-3 py-2 rounded-md hover:bg-primary/10"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">评分标准</span>
              <span className="sm:hidden">标准</span>
            </button>
          </div>
        </div>

        {/* 评分标准展示 */}
        {showCriteria && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">评分标准</h4>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {(() => {
                // 提供默认的评分标准，防止 scoring_criteria 不存在或结构不完整
                const defaultCriteria = {
                  excellent: { min: 90, description: "优秀：超额完成目标，表现突出" },
                  good: { min: 80, description: "良好：完成目标，表现符合预期" },
                  average: { min: 70, description: "一般：基本完成目标，表现一般" },
                  poor: { min: 0, description: "较差：未完成目标，表现不佳" }
                }
                
                // 优先使用项目自身的评分标准，其次使用全局评分标准，最后使用默认标准
                const safeCriteria = item.scoring_criteria || globalScoringCriteria || defaultCriteria
                const excellent = safeCriteria.excellent || defaultCriteria.excellent
                const good = safeCriteria.good || defaultCriteria.good
                const average = safeCriteria.average || defaultCriteria.average
                const poor = safeCriteria.poor || defaultCriteria.poor
                
                return (
                  <>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        {excellent.min}+
                      </Badge>
                      <span>{excellent.description}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {good.min}+
                      </Badge>
                      <span>{good.description}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        {average.min}+
                      </Badge>
                      <span>{average.description}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                      <Badge className="bg-red-100 text-red-800 text-xs">
                        {poor.min}+
                      </Badge>
                      <span>{poor.description}</span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* 评论区域 */}
        {showComment && (
          <div className="space-y-2">
            <Label htmlFor={`comment-${item.id}`} className="text-sm font-medium">
              评价说明 (可选)
            </Label>
            <Textarea
              id={`comment-${item.id}`}
              placeholder="请简要说明您的评分理由..."
              value={value.comment || ''}
              onChange={(e) => handleCommentChange(e.target.value)}
              disabled={disabled}
              rows={3}
              className="resize-none"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}