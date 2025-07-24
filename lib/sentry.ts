/**
 * Sentry集成工具类
 * 为OKR绩效评估系统提供统一的错误监控和性能追踪
 */

import * as Sentry from "@sentry/nextjs"

// 用户角色类型
type UserRole = 'admin' | 'boss' | 'lead' | 'employee'

// 业务操作类型
type BusinessOperation = 
  | 'login'
  | 'logout'
  | 'evaluation_submit'
  | 'evaluation_view'
  | 'assessment_create'
  | 'assessment_update'
  | 'template_modify'
  | 'user_management'
  | 'statistics_view'

// 评估上下文信息
interface EvaluationContext {
  assessmentId?: string | number
  evaluateeId?: string | number
  evaluationType?: 'self' | 'leader' | 'boss'
  templateId?: string | number
}

export class SentryOKRService {
  /**
   * 设置用户上下文信息
   */
  static setUserContext(user: {
    id: string | number
    username: string
    name: string
    role: UserRole
    department?: string
  }) {
    Sentry.setUser({
      id: String(user.id),
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department
    })

    // 设置用户相关标签
    Sentry.setTags({
      user_role: user.role,
      user_department: user.department || 'unknown',
      user_type: 'authenticated'
    })
  }

  /**
   * 清除用户上下文（登出时调用）
   */
  static clearUserContext() {
    Sentry.setUser(null)
    Sentry.setTags({
      user_type: 'anonymous'
    })
  }

  /**
   * 设置评估操作上下文
   */
  static setEvaluationContext(context: EvaluationContext) {
    Sentry.setContext('evaluation', {
      assessment_id: context.assessmentId ? String(context.assessmentId) : undefined,
      evaluatee_id: context.evaluateeId ? String(context.evaluateeId) : undefined,
      evaluation_type: context.evaluationType,
      template_id: context.templateId ? String(context.templateId) : undefined
    })

    // 设置评估相关标签
    if (context.evaluationType) {
      Sentry.setTag('evaluation_type', context.evaluationType)
    }
  }

  /**
   * 记录业务操作
   */
  static addBreadcrumb(operation: BusinessOperation, message: string, data?: any) {
    Sentry.addBreadcrumb({
      message,
      category: 'business_operation',
      level: 'info',
      data: {
        operation,
        timestamp: new Date().toISOString(),
        ...data
      }
    })
  }

  /**
   * 捕获业务错误
   */
  static captureBusinessError(
    error: Error, 
    operation: BusinessOperation,
    context?: {
      userId?: string | number
      assessmentId?: string | number
      additionalData?: any
    }
  ) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'business_error')
      scope.setTag('operation', operation)
      
      if (context) {
        scope.setContext('business_context', {
          user_id: context.userId ? String(context.userId) : undefined,
          assessment_id: context.assessmentId ? String(context.assessmentId) : undefined,
          additional_data: context.additionalData
        })
      }

      Sentry.captureException(error)
    })
  }

  /**
   * 捕获API错误
   */
  static captureAPIError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    responseData?: any
  ) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error')
      scope.setTag('api_endpoint', endpoint)
      scope.setTag('http_method', method)
      
      if (statusCode) {
        scope.setTag('status_code', String(statusCode))
      }

      scope.setContext('api_request', {
        endpoint,
        method,
        status_code: statusCode,
        response_data: responseData ? '[FILTERED]' : undefined // 过滤敏感响应数据
      })

      Sentry.captureException(error)
    })
  }

  /**
   * 测量性能
   */
  static async measurePerformance<T>(
    operation: BusinessOperation,
    fn: () => Promise<T>
  ): Promise<T> {
    return Sentry.withActiveSpan(null, async () => {
      const span = Sentry.startSpan({
        name: operation,
        op: 'business_operation'
      }, async (span) => {
        try {
          const result = await fn()
          span.setStatus({ code: 1 }) // OK
          return result
        } catch (error) {
          span.setStatus({ code: 2 }) // ERROR
          this.captureBusinessError(error as Error, operation)
          throw error
        }
      })
      
      return span
    })
  }

  /**
   * 记录用户操作事件
   */
  static trackUserAction(
    action: string,
    properties?: Record<string, any>
  ) {
    Sentry.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user_action',
      level: 'info',
      data: {
        action,
        timestamp: new Date().toISOString(),
        properties: properties || {}
      }
    })
  }

  /**
   * 设置页面上下文
   */
  static setPageContext(pageName: string, pageProps?: any) {
    Sentry.setContext('page', {
      name: pageName,
      props: pageProps ? '[FILTERED]' : undefined, // 过滤页面属性中的敏感数据
      timestamp: new Date().toISOString()
    })

    Sentry.setTag('current_page', pageName)
  }
}

// 导出便捷方法
export const sentryOKR = SentryOKRService