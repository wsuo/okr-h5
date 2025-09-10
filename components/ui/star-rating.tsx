"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  showLabel?: boolean
  className?: string
}

const STAR_TO_SCORE_MAP = {
  5: 95,  // 优秀
  4: 85,  // 良好  
  3: 75,  // 中等
  2: 65,  // 需改进
  1: 50   // 不合格
}

const SCORE_LABELS = {
  5: '优秀',
  4: '良好', 
  3: '中等',
  2: '需改进',
  1: '不合格'
}

export function StarRating({
  value = 0,
  onChange,
  disabled = false,
  showLabel = true,
  className
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const handleClick = (starValue: number) => {
    if (!disabled && onChange) {
      onChange(starValue)
    }
  }

  const handleMouseEnter = (starValue: number) => {
    if (!disabled) {
      setHoverValue(starValue)
    }
  }

  const handleMouseLeave = () => {
    setHoverValue(0)
  }

  const displayValue = hoverValue || value

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            className={cn(
              "transition-colors duration-200 touch-manipulation p-1 rounded",
              !disabled && "hover:bg-gray-100 cursor-pointer",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors duration-200",
                star <= displayValue
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          </button>
        ))}
      </div>
      
      {showLabel && value > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">
            {SCORE_LABELS[value as keyof typeof SCORE_LABELS]}
          </span>
          <span className="text-gray-500">
            ({STAR_TO_SCORE_MAP[value as keyof typeof STAR_TO_SCORE_MAP]}分)
          </span>
        </div>
      )}
    </div>
  )
}

// 导出转换函数供其他组件使用
export const starToScore = (stars: number): number => {
  return STAR_TO_SCORE_MAP[stars as keyof typeof STAR_TO_SCORE_MAP] || 0
}

export const scoreToStars = (score: number): number => {
  for (let stars = 5; stars >= 1; stars--) {
    if (score >= STAR_TO_SCORE_MAP[stars as keyof typeof STAR_TO_SCORE_MAP]) {
      return stars
    }
  }
  return 1
}