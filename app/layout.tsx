import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OKR绩效考核系统',
  description: '企业级目标与关键结果管理平台，提供全面的绩效考核和目标管理解决方案',
  keywords: ['OKR', '绩效考核', '目标管理', '企业管理', '绩效评估'],
  authors: [{ name: 'wsuo' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
