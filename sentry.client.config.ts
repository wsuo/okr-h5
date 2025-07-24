// This file configures the initialization of Sentry on the browser/client side
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // 为OKR系统配置特定的错误过滤和标签
  beforeSend(event, hint) {
    // 过滤掉一些不重要的错误
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof Error) {
        // 过滤网络超时错误
        if (error.message.includes('timeout') || error.message.includes('NetworkError')) {
          return null
        }
      }
    }

    // 添加环境标签
    event.tags = {
      ...event.tags,
      component: 'okr-frontend',
      system: 'performance-evaluation'
    }

    return event
  },

  // 设置环境
  environment: process.env.NODE_ENV || 'development',

  // 发布版本
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
})