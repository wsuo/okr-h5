# 环境配置说明

## 文件说明

### `.env.local` - 通用配置
包含所有环境都需要的通用配置，如应用名称、版本等。

### `.env.development.local` - 本地开发环境
用于本地开发时的配置：
- 前端端口：3020
- 后端 API：http://localhost:3010
- NODE_ENV=development

### `.env.production.local` - 生产环境
用于生产部署时的配置：
- API 使用相对路径（由 Nginx 代理）
- NODE_ENV=production
- 生产域名配置

## 使用方式

### 本地开发
```bash
# Next.js 会自动根据 NODE_ENV 加载对应的环境文件
npm run dev  # 自动使用 .env.development.local
```

### 生产部署
```bash
npm run build  # 自动使用 .env.production.local
npm run start
```

## 环境文件优先级
Next.js 按以下优先级加载环境文件：
1. `.env.${NODE_ENV}.local` (最高优先级)
2. `.env.local` 
3. `.env.${NODE_ENV}`
4. `.env` (最低优先级)

## 注意事项
- 所有 `.env*` 文件都被 .gitignore 忽略，不会提交到代码库
- 生产环境部署时需要手动创建 `.env.production.local` 文件
- 环境变量名以 `NEXT_PUBLIC_` 开头的会暴露给客户端