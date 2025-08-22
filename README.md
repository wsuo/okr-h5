# OKR绩效考核系统

## 项目简介

OKR绩效考核系统是一个企业级目标与关键结果管理平台，提供全面的绩效考核和目标管理解决方案。系统支持多角色管理，包括系统管理员、公司老板、部门领导和员工。

## 技术栈

- **框架**: Next.js 15.2.4
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **图标**: Lucide React
- **包管理**: pnpm

## 功能特性

### 多角色支持
- **系统管理员**: 用户管理、评估模板管理、系统配置
- **公司老板**: 查看全公司绩效数据、员工评估
- **部门领导**: 管理团队成员、进行绩效评估
- **员工**: 查看个人绩效、历史记录

### 核心功能
- 用户认证与授权
- 角色权限管理
- 绩效评估管理
- 目标设定与追踪
- 数据统计与分析
- 响应式设计

## 快速开始

### 环境要求
- Node.js 18.0+
- pnpm 8.0+

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
pnpm build
```

### 启动生产服务器
```bash
pnpm start
```

## 测试账号

系统提供以下测试账号（密码均为：123456）：

| 角色 | 用户名 | 姓名 | 说明 |
|------|--------|------|------|
| 管理员 | admin | 系统管理员 | 拥有系统最高权限 |
| 老板 | boss | 公司老板 | 可查看全公司数据 |
| 部门领导 | lisi | 李四 | 技术部负责人 |
| 部门领导 | zhaoliu | 赵六 | 市场部负责人 |
| 员工 | zhangsan | 张三 | 技术部员工 |
| 员工 | wangwu | 王五 | 技术部员工 |

## 项目结构

```
okr-h5/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理员页面
│   ├── boss/              # 老板页面
│   ├── employee/          # 员工页面
│   ├── lead/              # 部门领导页面
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 登录页面
├── components/            # 组件
│   ├── ui/               # shadcn/ui组件
│   └── ...               # 业务组件
├── hooks/                 # 自定义Hook
├── lib/                   # 工具函数
├── public/                # 静态资源
└── styles/                # 样式文件
```

## 开发助手提示词

- Claude Code 提示词: 见 `CLAUDE.md`
- Codex CLI 提示词: 见 `CODEX.md`

## 开发计划

- [ ] 后端API集成
- [ ] 数据库设计与实现
- [ ] 用户权限细化
- [ ] 报表系统
- [ ] 移动端优化
- [ ] 国际化支持

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

- 作者: wsuo
- 项目地址: [https://github.com/wsuo/okr-h5](https://github.com/wsuo/okr-h5)
