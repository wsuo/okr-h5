"use client"

import { useState, useEffect, useCallback } from 'react'
import { evaluationService } from '@/lib/evaluation'
import { toast } from 'sonner'

interface AssessmentStatusMonitorOptions {
  assessmentId: number
  intervalMs?: number
  onStatusChanged?: (newStatus: any) => void
  onAssessmentEnded?: () => void
  enabled?: boolean
}

export function useAssessmentStatusMonitor({
  assessmentId,
  intervalMs = 30000, // 默认30秒检查一次
  onStatusChanged,
  onAssessmentEnded,
  enabled = true
}: AssessmentStatusMonitorOptions) {
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const checkStatus = useCallback(async () => {
    if (!enabled || !assessmentId) return

    try {
      const response = await evaluationService.checkAssessmentStatus(assessmentId)
      if (response.code === 200 && response.data) {
        const newStatus = response.data
        
        // 检查状态是否发生变化
        if (currentStatus && currentStatus.status !== newStatus.status) {
          console.log('Assessment status changed:', {
            from: currentStatus.status,
            to: newStatus.status
          })
          
          // 如果考核结束了，触发回调
          if (newStatus.isEnded && !currentStatus.isEnded) {
            toast.info('考核状态更新', {
              description: '考核已结束，所有参与者已完成评分'
            })
            
            if (onAssessmentEnded) {
              onAssessmentEnded()
            }
          }
          
          if (onStatusChanged) {
            onStatusChanged(newStatus)
          }
        }
        
        setCurrentStatus(newStatus)
      }
    } catch (error) {
      console.warn('检查考核状态失败:', error)
      // 不显示错误提示，避免干扰用户
    }
  }, [assessmentId, currentStatus, enabled, onStatusChanged, onAssessmentEnded])

  // 启动监听
  const startMonitoring = useCallback(() => {
    if (!enabled || isMonitoring) return

    setIsMonitoring(true)
    
    // 立即检查一次
    checkStatus()
    
    // 设置定时检查
    const interval = setInterval(checkStatus, intervalMs)
    
    return () => {
      clearInterval(interval)
      setIsMonitoring(false)
    }
  }, [enabled, isMonitoring, checkStatus, intervalMs])

  // 停止监听
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  // 手动检查状态
  const manualCheck = useCallback(() => {
    return checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (enabled && assessmentId) {
      const cleanup = startMonitoring()
      return cleanup
    }
  }, [enabled, assessmentId, startMonitoring])

  return {
    currentStatus,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    manualCheck
  }
}

// 专门用于评分页面的状态监听Hook
export function useEvaluationPageMonitor(assessmentId: number, enabled: boolean = true) {
  const [viewMode, setViewMode] = useState(false)
  const [showEndedDialog, setShowEndedDialog] = useState(false)

  const { currentStatus, manualCheck } = useAssessmentStatusMonitor({
    assessmentId,
    enabled,
    onAssessmentEnded: () => {
      setShowEndedDialog(true)
    },
    onStatusChanged: (newStatus) => {
      if (!newStatus.canEvaluate) {
        setViewMode(true)
      }
    }
  })

  const handleEndedDialogConfirm = useCallback(() => {
    setShowEndedDialog(false)
    setViewMode(true)
    // 重新检查状态
    manualCheck()
  }, [manualCheck])

  // 处理评分提交错误
  const handleEvaluationError = useCallback((error: any) => {
    if (error.message && error.message.includes('考核已结束')) {
      setViewMode(true)
      setShowEndedDialog(true)
      return {
        shouldShowDialog: true,
        title: '考核已结束',
        message: '此考核已结束，无法进行评分操作。页面将切换为查看模式。',
        type: 'warning' as const
      }
    }
    return {
      shouldShowDialog: false,
      message: error.message || '操作失败',
      type: 'error' as const
    }
  }, [])

  return {
    currentStatus,
    viewMode,
    showEndedDialog,
    setViewMode,
    setShowEndedDialog,
    handleEndedDialogConfirm,
    handleEvaluationError,
    manualCheck
  }
}