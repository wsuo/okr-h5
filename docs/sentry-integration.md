# Sentry错误监控集成文档

## 概述

本文档描述了OKR绩效评估系统中Sentry错误监控和性能追踪的集成方案。通过Sentry，我们可以实时监控系统错误、性能问题和用户行为，提升系统稳定性和用户体验。

## 配置信息

### 项目配置
- **组织**: `bma-ct`
- **项目**: `gerenuk_okr`
- **DSN**: `https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232`

### 环境变量

#### 开发环境 (.env.development.local)
```bash
SENTRY_DSN=https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232
NEXT_PUBLIC_SENTRY_DSN=https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232
SENTRY_ORG=bma-ct
SENTRY_PROJECT=gerenuk_okr
NEXT_PUBLIC_APP_VERSION=1.0.0-dev
```

#### 生产环境 (.env.production.local)
```bash
SENTRY_DSN=https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232
NEXT_PUBLIC_SENTRY_DSN=https://8ff890fd6f181775126e83eb8adbf845@o4509721309216768.ingest.us.sentry.io/4509721980895232
SENTRY_ORG=bma-ct
SENTRY_PROJECT=gerenuk_okr
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 核心组件

### 1. Sentry配置文件

#### sentry.client.config.ts
客户端Sentry初始化配置，包含：
- 错误采样率配置
- Session Replay集成
- 客户端错误过滤
- 组件标签设置

#### sentry.server.config.ts
服务端Sentry初始化配置，包含：
- 服务端错误过滤
- 敏感信息过滤
- 服务端标签设置

#### sentry.edge.config.ts
边缘运行时Sentry配置，用于Edge Runtime环境。

### 2. SentryOKRService工具类 (lib/sentry.ts)

统一的Sentry集成工具类，提供以下功能：

#### 用户上下文管理
```typescript
// 设置用户上下文
sentryOKR.setUserContext({
  id: user.id,
  username: user.username,
  name: user.name,
  role: user.role,
  department: user.department
})

// 清除用户上下文
sentryOKR.clearUserContext()
```

#### 评估业务上下文
```typescript
// 设置评估上下文
sentryOKR.setEvaluationContext({
  assessmentId: 'assessment-123',
  evaluateeId: 'user-456',
  evaluationType: 'boss',
  templateId: 'template-789'
})
```

#### 错误捕获
```typescript
// 业务错误捕获
sentryOKR.captureBusinessError(
  error,
  'evaluation_submit',
  { userId: 'user-123', assessmentId: 'assessment-456' }
)

// API错误捕获
sentryOKR.captureAPIError(
  error,
  '/api/v1/evaluations',
  'POST',
  500,
  responseData
)
```

#### 性能监控
```typescript
// 性能测量
await sentryOKR.measurePerformance('evaluation_submit', async () => {
  // 业务逻辑
  return await submitEvaluation(data)
})
```

#### 用户行为追踪
```typescript
// 面包屑记录
sentryOKR.addBreadcrumb('login', '用户尝试登录', { username })

// 用户操作追踪
sentryOKR.trackUserAction('button_click', {
  button_name: 'submit_evaluation',
  page: 'evaluation-form'
})
```

### 3. React Hooks集成 (hooks/use-sentry.tsx)

#### 页面追踪Hook
```typescript
// 自动设置页面上下文
useSentryPageTracking('evaluation-form', { assessmentId })
```

#### 评估追踪Hook
```typescript
// 自动设置评估上下文
useSentryEvaluationTracking({
  assessmentId,
  evaluateeId,
  evaluationType: 'boss'
})
```

#### 错误边界Hook
```typescript
// 全局错误捕获
useSentryErrorBoundary()
```

## 系统集成点

### 1. 认证系统集成 (contexts/auth-context.tsx)

#### 登录时
- 自动设置用户上下文到Sentry
- 记录登录成功/失败事件
- 捕获登录相关错误

#### 登出时
- 清除Sentry用户上下文
- 记录登出事件
- 捕获登出错误

### 2. API客户端集成 (lib/api.ts)

#### 自动错误捕获
- 所有API调用错误自动发送到Sentry
- 包含请求方法、端点、状态码等信息
- 过滤敏感的响应数据

#### 错误分类
- 网络错误
- HTTP状态码错误
- 解析错误
- 超时错误

### 3. 全局错误处理 (app/global-error.tsx)

#### React渲染错误
- 捕获所有React组件渲染错误
- 提供用户友好的错误页面
- 自动发送错误报告到Sentry

#### 功能特性
- 重试机制
- 返回首页选项
- 开发环境下显示详细错误信息

## 监控覆盖

### 错误监控
1. **JavaScript运行时错误**
   - 语法错误
   - 类型错误
   - 引用错误
   - 自定义业务错误

2. **API调用错误**
   - 网络超时
   - HTTP状态码错误
   - 响应解析错误
   - 认证失败

3. **React组件错误**
   - 渲染错误
   - 生命周期错误
   - Hook使用错误

4. **Promise Rejection**
   - 未处理的Promise rejection
   - async/await错误

### 性能监控
1. **业务操作性能**
   - 评估提交耗时
   - 数据加载时间
   - 用户操作响应时间

2. **页面加载性能**
   - 首次内容绘制(FCP)
   - 最大内容绘制(LCP)
   - 交互延迟(FID)

### 用户行为追踪
1. **用户操作路径**
   - 登录/登出行为
   - 页面访问路径
   - 功能使用情况

2. **业务流程追踪**
   - 评估创建流程
   - 评分提交流程
   - 结果查看流程

## 隐私和安全

### 数据过滤
1. **敏感信息过滤**
   - 自动过滤Authorization headers
   - 过滤Cookie信息
   - 移除用户评估具体内容

2. **评估数据保护**
   - 评估内容不发送到Sentry
   - 只记录操作类型和结果
   - 保护用户隐私

### 访问控制
1. **开发环境**
   - 详细错误信息
   - 完整堆栈跟踪
   - 调试信息

2. **生产环境**
   - 过滤敏感信息
   - 最小化数据传输
   - 符合数据保护要求

## 测试功能

### 测试页面 (/sentry-test)
专门的测试页面，包含：

1. **错误测试**
   - JavaScript错误测试
   - API错误测试

2. **性能测试**
   - 性能监控测试

3. **上下文测试**
   - 用户上下文设置
   - 评估上下文设置

4. **行为追踪测试**
   - 面包屑记录测试
   - 用户操作追踪测试

### 测试方法
1. 访问 `http://localhost:3020/sentry-test`
2. 点击不同测试按钮
3. 在Sentry控制台查看数据

## 部署注意事项

### 1. 环境变量配置
确保生产环境正确配置所有Sentry相关环境变量。

### 2. Source Maps
生产环境中：
- Source maps会自动上传到Sentry
- 客户端bundle中会隐藏source maps
- 确保`SENTRY_AUTH_TOKEN`配置正确

### 3. 性能影响
- Sentry集成对性能影响最小
- 采样率可以根据需要调整
- 生产环境建议降低采样率

### 4. 告警配置
在Sentry控制台配置：
- 错误告警规则
- 性能阈值告警
- 邮件/Slack通知

## 常见问题

### 1. 错误没有上报到Sentry
- 检查DSN配置是否正确
- 验证网络连接
- 确认采样率设置

### 2. 用户上下文丢失
- 确保在登录时调用`setUserContext`
- 检查登出时是否调用`clearUserContext`

### 3. 性能数据缺失
- 检查`tracesSampleRate`配置
- 确认性能监控代码正确包装业务逻辑

### 4. 敏感数据泄漏
- 检查`beforeSend`过滤规则
- 确认敏感字段已正确过滤

## 维护建议

1. **定期检查Sentry控制台**
   - 监控错误趋势
   - 分析性能问题
   - 及时处理告警

2. **优化监控策略**
   - 调整采样率
   - 完善错误分类
   - 优化告警规则

3. **数据清理**
   - 定期清理测试数据
   - 移除无用的错误事件
   - 优化存储配额使用

4. **更新维护**
   - 定期更新Sentry SDK
   - 跟进新功能特性
   - 优化配置参数