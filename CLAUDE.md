# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个企业级 OKR 绩效考核系统，基于 Next.js 15.2.4 + TypeScript + Tailwind CSS + shadcn/ui 构建。系统支持多角色管理（管理员、老板、部门领导、员工），提供完整的绩效评估和目标管理功能。

## 开发命令

```bash
# 开发环境
npm run dev        # 启动开发服务器 (localhost:3001)

# 构建与生产
npm run build      # 构建生产版本
npm run start      # 启动生产服务器
npm run lint       # 代码检查
```

## 后端 API 配置

- **API 基础地址**: `http://localhost:3000/api/v1`（后端）
- **前端地址**: `http://localhost:3001`
- **认证方式**: Bearer Token (存储在 localStorage)
- **API 客户端**: 统一使用 `lib/api.ts` 中的 `apiClient`

## 核心架构

### 1. 认证系统
- **Context**: `contexts/auth-context.tsx` - 全局认证状态管理
- **Service**: `lib/auth.ts` - 认证服务（登录、登出、权限检查）
- **守卫**: `components/auth-guard.tsx` - 路由权限守卫
- **Token 管理**: 自动刷新机制，localStorage 存储

### 2. 角色权限体系
系统支持 4 种角色，每种角色有对应的路由和权限：

- **admin**: 系统管理员 (`/admin`) - 用户管理、模板管理、系统配置
- **boss**: 公司老板 (`/boss`) - 查看全公司绩效数据
- **lead**: 部门领导 (`/lead`) - 团队成员管理、绩效评估
- **employee**: 员工 (`/employee`) - 个人绩效查看、历史记录

### 3. 数据服务层
所有 API 服务都位于 `lib/` 目录下，采用统一的服务类模式：

- `lib/api.ts` - 统一 API 客户端
- `lib/auth.ts` - 认证服务
- `lib/user.ts` - 用户管理服务
- `lib/template.ts` - 模板管理服务
- `lib/department.ts` - 部门管理服务
- `lib/role.ts` - 角色管理服务

### 4. 组件结构

#### 页面组件
- `app/` - Next.js App Router 页面
- 每个角色有独立的页面目录和布局

#### 业务组件
- `components/` - 业务组件
- `components/ui/` - shadcn/ui 基础组件
- `components/*-management.tsx` - 各种管理功能组件

#### 头部组件
不同角色使用不同的头部导航组件：
- `admin-header.tsx` - 管理员导航
- `boss-header.tsx` - 老板导航  
- `lead-header.tsx` - 部门领导导航
- `employee-header.tsx` - 员工导航

### 5. 模板管理系统

模板管理是系统的核心功能，支持：

- **公共评分标准**: `scoring_criteria` 从各个子项抽离为模板级别的共享配置
- **评分规则**: `scoring_rules` 配置员工自评和领导评分的权重分配
- **权重验证**: 确保评分权重总和为 100%
- **内联编辑**: 支持模板的实时编辑和预览

#### 模板配置结构
```typescript
interface TemplateConfig {
  version: string
  categories: EvaluationCategory[]
  description: string
  total_score: number
  scoring_rules: ScoringRules  // 评分规则配置
  scoring_method: string
  usage_instructions: UsageInstructions
  scoring_criteria: ScoringCriteria  // 公共评分标准
}
```

### 6. 状态管理

- **全局状态**: React Context (`auth-context.tsx`)
- **本地状态**: React useState/useReducer
- **服务状态**: 各服务类内部状态管理
- **持久化**: localStorage 存储认证信息

### 7. UI 组件系统

使用 shadcn/ui 组件库，包含：
- **基础组件**: Button, Input, Select, Dialog, AlertDialog 等
- **布局组件**: Card, Table, Tabs, Badge 等
- **交互组件**: Switch, Alert, Progress 等

### 8. 工具函数

- `lib/utils.ts` - 通用工具函数
- 各服务文件中的 utils 对象 - 特定业务工具函数

## 开发约定

### 1. 代码风格
- 使用 TypeScript 严格模式
- 组件使用 "use client" 标识客户端组件
- 统一使用 interface 定义类型

### 2. 文件命名
- 组件文件：kebab-case (`template-management.tsx`)
- 服务文件：kebab-case (`auth.ts`)
- 页面文件：按 Next.js 约定

### 3. API 集成
- 统一使用 `apiClient` 进行 API 调用
- 错误处理统一在服务层处理
- 使用 `ApiResponse<T>` 类型包装响应

### 4. 权限控制
- 使用 `usePermission()` Hook 进行权限检查
- 路由级别使用 `AuthGuard` 组件保护
- 组件级别使用 `hasRole()` 和 `hasPermission()` 方法

### 5. 表单处理
- 使用 React Hook Form + Zod 进行表单验证
- 统一错误提示使用 Alert 组件
- 加载状态使用 Loader2 图标

### 6. 数据获取
- 使用 async/await 处理异步操作
- 统一的加载状态管理
- 错误边界处理

## 关键技术点

1. **Next.js App Router**: 使用最新的 App Router 路由系统
2. **TypeScript**: 全面的类型支持和定义
3. **Tailwind CSS**: 原子化 CSS 框架
4. **shadcn/ui**: 现代化 UI 组件库
5. **JWT 认证**: 基于 Token 的认证机制
6. **权限控制**: 基于角色的访问控制 (RBAC)
7. **响应式设计**: 支持移动端和桌面端

## 测试账号

开发测试时可以使用以下账号（密码均为 123456）：

- **admin** - 系统管理员
- **boss** - 公司老板
- **lisi** - 部门领导（技术部）
- **zhangsan** - 员工（技术部）