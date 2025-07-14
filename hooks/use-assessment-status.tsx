"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbacksRef = useRef({ onStatusChanged, onAssessmentEnded })

  // 更新回调引用
  useEffect(() => {
    callbacksRef.current = { onStatusChanged, onAssessmentEnded }
  }, [onStatusChanged, onAssessmentEnded])

  const checkStatus = useCallback(async () => {
    if (!enabled || !assessmentId) return

    try {
      const response = await evaluationService.checkAssessmentStatus(assessmentId)
      if (response.code === 200 && response.data) {
        const newStatus = response.data
        
        // 使用函数式更新来避免依赖currentStatus
        setCurrentStatus(prevStatus => {
          // 检查状态是否发生变化
          if (prevStatus && prevStatus.status !== newStatus.status) {
            console.log('Assessment status changed:', {
              from: prevStatus.status,
              to: newStatus.status
            })
            
            // 如果考核结束了，触发回调
            if (newStatus.isEnded && !prevStatus.isEnded) {
              toast.info('考核状态更新', {
                description: '考核已结束，所有参与者已完成评分'
              })
              
              if (callbacksRef.current.onAssessmentEnded) {
                callbacksRef.current.onAssessmentEnded()
              }
            }
            
            if (callbacksRef.current.onStatusChanged) {
              callbacksRef.current.onStatusChanged(newStatus)
            }
          }
          
          return newStatus
        })
      }
    } catch (error) {
      console.warn('检查考核状态失败:', error)
      // 不显示错误提示，避免干扰用户
    }
  }, [assessmentId, enabled])

  // 启动监听
  const startMonitoring = useCallback(() => {
    if (!enabled || isMonitoring || !assessmentId) return

    setIsMonitoring(true)
    
    // 立即检查一次
    checkStatus()
    
    // 设置定时检查
    intervalRef.current = setInterval(checkStatus, intervalMs)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsMonitoring(false)
    }
  }, [enabled, isMonitoring, assessmentId, checkStatus, intervalMs])

  // 停止监听
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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

  // 暂时禁用自动监听，避免无限循环
  const { currentStatus, manualCheck } = useAssessmentStatusMonitor({
    assessmentId,
    enabled: false, // 暂时禁用
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