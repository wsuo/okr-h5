import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 开发环境禁用缓存
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

// Sentry配置选项
const sentryWebpackPluginOptions = {
  // 为了避免源码泄漏，可以在生产环境中禁用source map上传
  silent: true,
  
  // 组织和项目信息
  org: "bma-ct",
  project: "gerenuk_okr",

  // 只在生产环境上传source maps
  widenClientFileUpload: true,
  
  // 隐藏source maps from generated client bundles
  hideSourceMaps: true,
  
  // 禁用自动release creation
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
}

// 使用withSentryConfig包装Next.js配置
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
