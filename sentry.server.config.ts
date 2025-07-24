// This file configures the initialization of Sentry on the server side
// The config you add here will be used whenever the server handles a request
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // 为OKR系统配置特定的错误过滤和标签
  beforeSend(event, hint) {
    // 过滤敏感信息
    if (event.request) {
      // 移除可能包含敏感信息的请求头
      delete event.request.headers?.authorization
      delete event.request.headers?.cookie
      
      // 过滤包含用户评估数据的请求
      if (event.request.url && event.request.url.includes('/evaluation')) {
        if (event.request.data) {
          // 移除评估内容，只保留结构信息
          event.request.data = '[FILTERED_EVALUATION_DATA]'
        }
      }
    }

    // 添加服务器端标签
    event.tags = {
      ...event.tags,
      component: 'okr-backend',
      system: 'performance-evaluation',
      server: 'nextjs-api'
    }

    return event
  },

  // 设置环境
  environment: process.env.NODE_ENV || 'development',

  // 发布版本
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
})