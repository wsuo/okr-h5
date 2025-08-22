# 部署脚本使用说明

本目录包含 OKR 项目的自动部署脚本，支持一键部署到生产服务器。

## 📁 文件结构

```
deploy/
├── README.md           # 本文件 - 使用说明
├── deploy.sh          # 完整版部署脚本（包含备份、回滚功能）
├── quick-deploy.sh     # 快速部署脚本（日常更新使用）
└── config.sh          # 部署配置文件
```

## 🚀 快速开始

### 1. 日常部署（推荐）

```bash
# 在项目根目录执行
./deploy/quick-deploy.sh
```

适用场景：
- 日常代码更新
- 小功能修复
- UI优化等轻量级更改

### 2. 完整部署

```bash
# 在项目根目录执行
./deploy/deploy.sh
```

适用场景：
- 首次部署
- 重大版本更新
- 需要备份的重要更新

### 3. 回滚操作

```bash
# 回滚到上一个版本
./deploy/deploy.sh rollback
```

## 📋 部署前检查清单

在执行部署前，请确保：

- [ ] 代码已提交到 Git 仓库
- [ ] 本地测试通过（`npm run dev`）
- [ ] 构建成功（`npm run build`）
- [ ] 服务器 SSH 连接正常
- [ ] 确认部署的功能变更

## 🛠️ 服务器配置信息

| 配置项 | 值 |
|--------|-----|
| 服务器IP | 47.239.124.157 |
| 前端目录 | /www/wwwroot/okr.gerenukagro.com |
| 后端目录 | /www/wwwroot/okr-server |
| 前端端口 | 3020 |
| 后端端口 | 3010 |
| 域名 | okr.gerenukagro.com |
| PM2应用名 | okr-frontend, okr-server |

## 📊 部署流程说明

### 快速部署流程
1. 本地构建项目（`npm run build`）
2. 同步文件到服务器（rsync）
3. 安装生产依赖
4. 重启 PM2 服务
5. 检查服务状态

### 完整部署流程
1. 检查本地环境和 Git 状态
2. 构建项目
3. 备份服务器当前版本
4. 上传文件到服务器
5. 服务器端构建和部署
6. 健康检查
7. 显示部署结果

## 🔧 常用运维命令

### 查看服务状态
```bash
ssh root@47.239.124.157 "pm2 status"
```

### 查看应用日志
```bash
# 查看前端日志
ssh root@47.239.124.157 "pm2 logs okr-frontend"

# 查看后端日志  
ssh root@47.239.124.157 "pm2 logs okr-server"

# 查看 nginx 日志
ssh root@47.239.124.157 "tail -f /www/wwwroot/okr.gerenukagro.com/logs/nginx_*.log"
```

### 重启服务
```bash
# 重启前端
ssh root@47.239.124.157 "pm2 restart okr-frontend"

# 重启后端
ssh root@47.239.124.157 "pm2 restart okr-server"

# 重启 nginx
ssh root@47.239.124.157 "/etc/init.d/nginx restart"
```

### 进入服务器
```bash
ssh root@47.239.124.157
```

## 🚨 故障排查

### 部署失败处理

1. **检查构建错误**
   ```bash
   npm run build
   ```

2. **检查服务器连接**
   ```bash
   ssh root@47.239.124.157 "echo 'Connection OK'"
   ```

3. **检查磁盘空间**
   ```bash
   ssh root@47.239.124.157 "df -h"
   ```

4. **检查 PM2 进程**
   ```bash
   ssh root@47.239.124.157 "pm2 list"
   ```

### 常见问题解决

**问题1: 构建失败**
```bash
# 清理缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

**问题2: npm 依赖冲突 (ERESOLVE)**
```bash
# 服务器端手动修复
ssh root@47.239.124.157 "cd /www/wwwroot/okr.gerenukagro.com && npm install --legacy-peer-deps"
```
> 📝 **说明**: 项目使用 `date-fns@4.1.0` 与 `react-day-picker@8.10.1` 存在版本冲突，部署脚本已配置使用 `--legacy-peer-deps` 参数自动解决。

**问题3: 服务启动失败**
```bash
# 检查端口占用
ssh root@47.239.124.157 "netstat -tulpn | grep :3020"

# 强制重启
ssh root@47.239.124.157 "pm2 delete okr-frontend && pm2 start ecosystem.config.js"
```

**问题4: 页面访问异常**
```bash
# 检查 nginx 配置
ssh root@47.239.124.157 "nginx -t"

# 重载 nginx 配置
ssh root@47.239.124.157 "/etc/init.d/nginx reload"
```

## 📝 部署日志

部署脚本会在以下位置记录日志：
- 服务器应用日志：`/www/wwwroot/okr.gerenukagro.com/logs/`
- PM2 日志：`~/.pm2/logs/`
- Nginx 日志：`/www/wwwroot/okr.gerenukagro.com/logs/nginx_*.log`

## ⚠️ 注意事项

1. **生产环境操作**：部署脚本直接操作生产环境，请谨慎使用
2. **备份重要性**：重要更新前建议使用完整部署脚本（自动备份）
3. **回滚准备**：如遇问题可及时回滚，避免长时间服务中断
4. **权限要求**：需要服务器 root 权限和项目目录写入权限
5. **网络要求**：确保本地到服务器网络连接稳定

## 🔄 更新此文档

如果部署配置发生变化，请及时更新本文档和配置文件，确保团队成员使用最新的部署信息。