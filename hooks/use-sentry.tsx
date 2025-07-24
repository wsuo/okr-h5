/**
 * Sentry页面追踪Hook
 * 用于在页面级别集成Sentry监控
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { sentryOKR } from '@/lib/sentry'

/**
 * 页面追踪Hook
 * 自动设置页面上下文和记录页面访问
 */
export function useSentryPageTracking(pageName: string, pageProps?: any) {
  const pathname = usePathname()

  useEffect(() => {
    // 设置页面上下文
    sentryOKR.setPageContext(pageName, pageProps)
    
    // 记录页面访问
    sentryOKR.trackUserAction('page_view', {
      page_name: pageName,
      pathname,
      timestamp: new Date().toISOString()
    })

    // 清理函数（可选）
    return () => {
      // 页面卸载时的清理工作
    }
  }, [pageName, pathname, pageProps])
}

/**
 * 评估操作追踪Hook
 * 专门用于评估相关页面的上下文设置
 */
export function useSentryEvaluationTracking(context: {
  assessmentId?: string | number
  evaluateeId?: string | number
  evaluationType?: 'self' | 'leader' | 'boss'
  templateId?: string | number
}) {
  useEffect(() => {
    sentryOKR.setEvaluationContext(context)
    
    // 记录评估上下文设置
    sentryOKR.trackUserAction('evaluation_context_set', {
      assessment_id: context.assessmentId,
      evaluatee_id: context.evaluateeId,
      evaluation_type: context.evaluationType,
      template_id: context.templateId
    })
  }, [context.assessmentId, context.evaluateeId, context.evaluationType, context.templateId])
}

/**
 * 错误边界Hook
 * 用于捕获和报告React错误
 */
export function useSentryErrorBoundary() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      sentryOKR.captureBusinessError(
        new Error(event.error?.message || 'JavaScript Error'),
        'user_management' // 默认操作类型
      )
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      sentryOKR.captureBusinessError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        'user_management'
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])
}