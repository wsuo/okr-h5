# 部署脚本使用说明

本目录包含 OKR 项目的自动部署脚本，支持一键部署到多个生产服务器。采用配置化设计，支持通过参数选择不同的部署目标。

## 📁 文件结构

```
deploy/
├── README.md              # 本文件 - 使用说明
├── deploy.sh             # 完整版部署脚本（包含备份、回滚功能）
├── quick-deploy.sh        # 快速部署脚本（日常更新使用）
├── config.sh             # 旧配置文件（保留，已弃用）
└── config/               # 配置文件目录（新）
    ├── server1.conf      # 生产环境主服务器配置 (47.239.124.157)
    └── server2.conf      # 测试/备用服务器配置 (47.243.127.167)
```

## 🚀 快速开始

### 1. 列出所有可用配置

```bash
./deploy/deploy.sh -l
```

输出示例：
```
server1.conf             服务器: 47.239.124.157 (生产环境主服务器)
server2.conf             服务器: 47.243.127.167 (测试/备用服务器)
```

### 2. 部署到服务器1（默认，生产环境主服务器）

```bash
# 方式1: 使用默认配置（server1.conf）
./deploy/deploy.sh deploy

# 方式2: 显式指定配置文件
./deploy/deploy.sh -c server1.conf deploy
```

### 3. 部署到服务器2（测试/备用服务器）

```bash
./deploy/deploy.sh -c server2.conf deploy
```

### 4. 日常快速部署（推荐）

```bash
# 快速部署脚本使用默认配置
./deploy/quick-deploy.sh
```

适用场景：
- 日常代码更新
- 小功能修复
- UI 优化等轻量级更改

### 5. 回滚操作

```bash
# 回滚到上一个版本（服务器1）
./deploy/deploy.sh rollback

# 回滚指定服务器（服务器2）
./deploy/deploy.sh -c server2.conf rollback
```

## 📋 命令参数说明

```
用法: ./deploy/deploy.sh [OPTIONS] [COMMAND]

命令:
  deploy              执行部署操作（默认）
  rollback            回滚到上一个版本

选项:
  -c, --config FILE   指定配置文件（相对于 config/ 目录）
  -l, --list          列出所有可用的配置文件
  -h, --help          显示帮助信息
```

## 🔧 常见使用示例

### 示例1: 标准部署流程

```bash
# 部署到生产环境主服务器
cd /Users/wshuo/Developer/my/okr/okr-h5
./deploy/deploy.sh deploy

# 或显式指定配置
./deploy/deploy.sh -c server1.conf deploy
```

### 示例2: 部署到备用服务器进行测试

```bash
# 部署到测试服务器
./deploy/deploy.sh -c server2.conf deploy
```

### 示例3: 出现问题需要回滚

```bash
# 生产环境回滚
./deploy/deploy.sh rollback

# 或指定服务器回滚
./deploy/deploy.sh -c server2.conf rollback
```

### 示例4: 快速部署日常更新

```bash
# 仅同步文件和重启服务，不做完整备份
./deploy/quick-deploy.sh
```

## 📊 部署配置说明

### 服务器1配置 (server1.conf)

| 配置项 | 值 |
|--------|-----|
| 服务器IP | 47.239.124.157 |
| SSH端口 | 22（标准端口）|
| 前端目录 | /www/wwwroot/okr.gerenukagro.com |
| 域名 | okr.gerenukagro.com |
| 服务端口 | 3020 |
| 说明 | **生产环境主服务器** |

### 服务器2配置 (server2.conf)

| 配置项 | 值 |
|--------|-----|
| 服务器IP | 47.243.127.167 |
| SSH端口 | 29722（自定义端口）|
| 前端目录 | /www/wwwroot/okr-frontend |
| 域名 | 47.243.127.167 |
| 服务端口 | 3020 |
| 说明 | **测试/备用服务器** |

## 📝 部署前检查清单

在执行部署前，请确保：

- [ ] 代码已提交到 Git 仓库
- [ ] 本地测试通过（`npm run dev`）
- [ ] 构建成功（`npm run build`）
- [ ] 服务器 SSH 连接正常
- [ ] 确认部署的功能变更
- [ ] 已选择正确的部署目标服务器

## 📊 完整部署流程说明

```
deploy.sh 完整部署流程:
1. 检查本地环境和 Git 状态
2. 构建项目（npm run build）
3. 备份服务器当前版本（自动保留最近5个备份）
4. 上传文件到服务器（rsync）
5. 服务器端构建和部署
6. 重启 PM2 服务
7. 健康检查
8. 显示部署结果

quick-deploy.sh 快速部署流程:
1. 本地构建项目
2. 同步文件到服务器
3. 重启 PM2 服务
4. 检查服务状态
```

## 🔧 常用运维命令

### 查看服务状态

```bash
# 服务器1
ssh root@47.239.124.157 "pm2 status"

# 服务器2
ssh -p 29722 root@47.243.127.167 "pm2 status"
```

### 查看应用日志

```bash
# 服务器1 - 查看前端日志
ssh root@47.239.124.157 "pm2 logs okr-frontend"

# 服务器2 - 查看前端日志
ssh -p 29722 root@47.243.127.167 "pm2 logs okr-frontend"
```

### 重启服务

```bash
# 服务器1
ssh root@47.239.124.157 "pm2 restart okr-frontend"

# 服务器2
ssh -p 29722 root@47.243.127.167 "pm2 restart okr-frontend"
```

## 🚨 故障排查

### 部署失败处理

1. **检查构建错误**
   ```bash
   npm run build
   ```

2. **检查服务器连接**
   ```bash
   ssh -p 22 root@47.239.124.157 "echo 'Connection OK'"
   ssh -p 29722 root@47.243.127.167 "echo 'Connection OK'"
   ```

3. **检查磁盘空间**
   ```bash
   ssh root@47.239.124.157 "df -h"
   ```

4. **查看部署日志**
   ```bash
   ssh root@47.239.124.157 "pm2 logs okr-frontend --lines 50"
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
# 本地修复
npm install --legacy-peer-deps

# 或服务器端手动修复
ssh -p 22 root@47.239.124.157 "cd /www/wwwroot/okr.gerenukagro.com && npm install --legacy-peer-deps"
```

**问题3: 部署到错误的服务器**
```bash
# 查看配置确保选择正确的服务器
./deploy/deploy.sh -l

# 使用正确的配置重新部署
./deploy/deploy.sh -c server1.conf deploy
```

**问题4: SSH 连接失败**
```bash
# 检查 SSH 密钥和权限
ssh -p 29722 -v root@47.243.127.167 "echo 'test'"

# 如需配置密钥，编辑相应的配置文件
# 在 config/server2.conf 中的 SERVER_SSH_KEY 字段指定密钥路径
```

## 📝 添加新的服务器配置

1. 在 `config/` 目录下创建新的配置文件，如 `server3.conf`
2. 复制并修改现有配置文件的内容，更新服务器信息
3. 执行 `./deploy/deploy.sh -l` 验证新配置是否被识别
4. 使用 `./deploy/deploy.sh -c server3.conf deploy` 部署到新服务器

## ⚠️ 注意事项

1. **生产环境操作**：部署脚本直接操作生产环境，请谨慎使用
2. **备份重要性**：重要更新前建议使用完整部署脚本（自动备份）
3. **回滚准备**：如遇问题可及时回滚，避免长时间服务中断
4. **权限要求**：需要服务器 root 权限和项目目录写入权限
5. **网络要求**：确保本地到服务器网络连接稳定
6. **配置选择**：确保选择了正确的部署目标，避免部署到错误的服务器

## 🔄 维护配置文件

配置文件存储在 `deploy/config/` 目录下，采用 `.conf` 格式：

- 每个配置文件对应一个部署目标（服务器）
- 配置文件可独立修改，不影响脚本本身
- 建议在配置文件中添加注释说明服务器用途
- 定期审查配置文件，确保信息最新准确