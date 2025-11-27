"use client"

import type { ReactNode } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn, formatYearMonth, parseYearMonth } from "@/lib/utils"

interface MonthFilterProps {
  value?: Date
  onChange: (value?: Date) => void
  label?: string
  includeAllOption?: boolean
  allLabel?: string
  showClear?: boolean
  clearLabel?: string
  className?: string
  selectClassName?: string
  placeholder?: string
  minYear?: number
  minMonth?: number
}

const CLEAR_VALUE = "__clear__"

export function MonthFilter({
  value,
  onChange,
  label = "筛选月份",
  includeAllOption = true,
  allLabel = "全部月份",
  showClear = true,
  clearLabel = "清除",
  className,
  selectClassName = "w-56",
  placeholder = "选择月份（默认全部）",
  minYear = 2025,
  minMonth = 8
}: MonthFilterProps) {
  const monthValue = value ? formatYearMonth(value) : ""

  const handleChange = (val: string) => {
    if (val === CLEAR_VALUE || val === "") {
      onChange(undefined)
      return
    }
    const parsed = parseYearMonth(val)
    onChange(parsed)
  }

  const monthItems: ReactNode[] = []
  const current = new Date()
  const currentYear = current.getFullYear()
  const currentMonth = current.getMonth() + 1

  for (let year = minYear; year <= currentYear; year++) {
    const beginMonth = year === minYear ? minMonth : 1
    const endMonth = year === currentYear ? currentMonth : 12
    for (let month = beginMonth; month <= endMonth; month++) {
      const value = `${year}-${String(month).padStart(2, "0")}`
      monthItems.push(
        <SelectItem key={value} value={value}>{`${year}年${month}月`}</SelectItem>
      )
    }
  }

  const orderedItems = monthItems.reverse()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm text-gray-600 whitespace-nowrap">{label}</span>
      )}
      <Select value={monthValue} onValueChange={handleChange}>
        <SelectTrigger className={selectClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAllOption && <SelectItem value={CLEAR_VALUE}>{allLabel}</SelectItem>}
          {orderedItems}
        </SelectContent>
      </Select>
      {showClear && value && (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
          {clearLabel}
        </Button>
      )}
    </div>
  )
}
