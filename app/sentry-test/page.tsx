'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Bug, Zap, User } from 'lucide-react'
import { sentryOKR } from '@/lib/sentry'
import { useSentryPageTracking } from '@/hooks/use-sentry'
import * as Sentry from '@sentry/nextjs'

export default function SentryTestPage() {
  useSentryPageTracking('sentry-test', { test: true })
  const [testResults, setTestResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testJavaScriptError = () => {
    try {
      // 故意抛出错误
      throw new Error('这是一个测试JavaScript错误')
    } catch (error) {
      sentryOKR.captureBusinessError(
        error as Error,
        'user_management',
        { userId: 'test-user', additionalData: { test: true } }
      )
      addResult('JavaScript错误已发送到Sentry')
    }
  }

  const testAPIError = () => {
    const fakeAPIError = new Error('API调用失败: 服务器无响应')
    sentryOKR.captureAPIError(
      fakeAPIError,
      '/api/v1/test-endpoint',
      'POST',
      500,
      { error: 'Internal Server Error' }
    )
    addResult('API错误已发送到Sentry')
  }

  const testPerformanceMeasurement = async () => {
    try {
      await sentryOKR.measurePerformance('evaluation_submit', async () => {
        // 模拟一个耗时操作
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'success'
      })
      addResult('性能测量已完成并发送到Sentry')
    } catch (error) {
      addResult('性能测量出错')
    }
  }

  const testUserContext = () => {
    sentryOKR.setUserContext({
      id: 'test-123',
      username: 'testuser',
      name: '测试用户',
      role: 'employee',
      department: '技术部'
    })
    addResult('用户上下文已设置')
  }

  const testBreadcrumbs = () => {
    sentryOKR.addBreadcrumb('evaluation_view', '用户查看评估结果', {
      assessmentId: 'test-assessment-123',
      score: 85
    })
    sentryOKR.trackUserAction('button_click', {
      button_name: 'test_breadcrumbs',
      page: 'sentry-test'
    })
    addResult('面包屑和用户行为已记录')
  }

  const testEvaluationContext = () => {
    sentryOKR.setEvaluationContext({
      assessmentId: 'test-assessment-456',
      evaluateeId: 'test-employee-789',
      evaluationType: 'boss',
      templateId: 'test-template-001'
    })
    addResult('评估上下文已设置')
  }

  const testSentryCapture = () => {
    Sentry.captureMessage('这是一个测试消息', 'info')
    addResult('测试消息已直接发送到Sentry')
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sentry 集成测试页面
          </h1>
          <p className="text-gray-600">
            测试OKR系统的Sentry错误监控和性能追踪功能
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-500" />
                错误测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={testJavaScriptError}
                variant="outline"
                className="w-full"
              >
                测试JavaScript错误
              </Button>
              <Button
                onClick={testAPIError}
                variant="outline"
                className="w-full"
              >
                测试API错误
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                性能测试
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testPerformanceMeasurement}
                variant="outline"
                className="w-full"
              >
                测试性能监控
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                上下文测试
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={testUserContext}
                variant="outline"
                className="w-full"
              >
                设置用户上下文
              </Button>
              <Button
                onClick={testEvaluationContext}
                variant="outline"
                className="w-full"
              >
                设置评估上下文
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>行为追踪测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={testBreadcrumbs}
                variant="outline"
                className="w-full"
              >
                测试面包屑记录
              </Button>
              <Button
                onClick={testSentryCapture}
                variant="outline"
                className="w-full"
              >
                直接发送消息
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无测试结果</p>
                ) : (
                  testResults.map((result, index) => (
                    <div
                      key={index}
                      className="text-sm bg-green-50 border border-green-200 rounded p-2"
                    >
                      {result}
                    </div>
                  ))
                )}
              </div>
              {testResults.length > 0 && (
                <Button
                  onClick={clearResults}
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                >
                  清除结果
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 点击不同的按钮测试各种Sentry功能</p>
              <p>• 测试结果会显示在右侧面板中</p>
              <p>• 实际的错误和性能数据会发送到Sentry控制台</p>
              <p>• 在Sentry控制台中查看项目 <code className="bg-gray-100 px-1 rounded">gerenuk_okr</code> 的数据</p>
              <p>• 这个页面仅用于开发和测试，生产环境中应该移除</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}