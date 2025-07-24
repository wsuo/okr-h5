// This file configures the initialization of Sentry for edge runtimes.
// The config you add here will be used whenever one of the edge runtime APIs is loaded.
// Note that this config is not used when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // 边缘运行时的特定配置
  beforeSend(event, hint) {
    // 添加边缘运行时标签
    event.tags = {
      ...event.tags,
      component: 'okr-edge',
      system: 'performance-evaluation',
      runtime: 'edge'
    }

    return event
  },

  // 设置环境
  environment: process.env.NODE_ENV || 'development',

  // 发布版本
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
})