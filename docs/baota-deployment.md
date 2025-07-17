# OKR 绩效考核系统 - 宝塔部署文档

## 项目概述

本项目是一个基于 Next.js 15.2.4 的企业级 OKR 绩效考核系统，支持多角色管理，包含前端应用和后端 API。

- **前端技术栈**: Next.js 15.2.4 + TypeScript + Tailwind CSS + shadcn/ui
- **端口配置**: 前端默认运行在 3001 端口，后端 API 运行在 3000 端口
- **Node.js 版本**: 建议使用 Node.js 18+ 版本

## 环境要求

### 服务器环境
- **操作系统**: CentOS 7+ / Ubuntu 18+ / Debian 9+
- **内存**: 建议 4GB 以上
- **硬盘**: 建议 20GB 以上可用空间
- **宝塔面板**: 7.0+ 版本

### 软件要求
- **Node.js**: 18.0+ 版本
- **npm**: 9.0+ 版本（或 yarn/pnpm）
- **PM2**: 进程管理工具
- **Nginx**: 反向代理服务器
- **数据库**: MySQL 5.7+ 或 PostgreSQL 12+（根据后端 API 需求）

## 部署步骤

### 1. 宝塔面板初始化

#### 1.1 安装宝塔面板
```bash
# CentOS 系统
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu/Debian 系统
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

#### 1.2 登录宝塔面板并安装必要软件
1. 登录宝塔面板
2. 安装以下软件：
   - **Nginx** (推荐 1.20+)
   - **MySQL** (5.7+) 或 **PostgreSQL** (12+)
   - **Node.js** (18.0+)
   - **PM2** (进程管理器)

### 2. 项目文件部署

#### 2.1 上传项目文件
```bash
# 创建项目目录
mkdir -p /www/wwwroot/okr-system
cd /www/wwwroot/okr-system

# 上传项目文件（可通过 FTP、Git 或宝塔文件管理器）
# 方式1：使用 Git 克隆
git clone https://github.com/wsuo/okr-h5.git .

# 方式2：直接上传压缩包并解压
# 将项目文件上传到 /www/wwwroot/okr-system/

# 设置目录权限
chown -R www:www /www/wwwroot/okr-system
chmod -R 755 /www/wwwroot/okr-system
```

#### 2.2 安装项目依赖
```bash
cd /www/wwwroot/okr-system

# 安装依赖（选择一种方式）
npm install
# 或者使用 yarn/pnpm（如果已安装）
# yarn install
# pnpm install
```

### 3. 环境配置

#### 3.1 创建环境变量文件
```bash
# 创建环境配置文件
touch /www/wwwroot/okr-system/.env.local
```

#### 3.2 配置环境变量
在 `.env.local` 文件中添加以下配置：

```env
# 应用配置
NODE_ENV=production
PORT=3020

# API 配置
NEXT_PUBLIC_API_URL=http://localhost:3010/api/v1
API_BASE_URL=http://localhost:3010/api/v1

# JWT 配置（如果前端需要验证）
# JWT_SECRET=your-super-secret-jwt-key
# JWT_EXPIRES_IN=7d

# 其他配置
NEXTAUTH_URL=http://okr.gerenukagro.com
NEXTAUTH_SECRET=your-nextauth-secret
```

### 4. 构建和启动项目

#### 4.1 构建生产版本
```bash
cd /www/wwwroot/okr-system

# 构建项目
npm run build

# 检查构建结果
ls -la .next/
```

#### 4.2 使用 PM2 启动项目
```bash
# 全局安装 PM2（如果未安装）
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'okr-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/www/wwwroot/okr.gerenukagro.com',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3020
      },
      error_file: '/www/wwwroot/okr.gerenukagro.com/logs/err.log',
      out_file: '/www/wwwroot/okr.gerenukagro.com/logs/out.log',
      log_file: '/www/wwwroot/okr.gerenukagro.com/logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G'
    }
  ]
}
EOF

# 创建日志目录
mkdir -p /www/wwwroot/okr.gerenukagro.com/logs

# 启动项目
pm2 start ecosystem.config.js

# 查看运行状态
pm2 status
pm2 logs okr-frontend
```

### 5. Nginx 配置

#### 5.1 在宝塔面板中创建站点
1. 登录宝塔面板
2. 点击 "网站" -> "添加站点"
3. 输入域名：`your-domain.com`
4. 选择 "不创建 FTP 和数据库"
5. 创建站点

#### 5.2 配置 Nginx 反向代理
在宝塔面板中，点击站点设置 -> 配置文件，替换为以下配置：

```nginx
server {
    listen 80;
    server_name okr.gerenukagro.com;
    
    # 日志文件
    access_log /www/wwwroot/okr.gerenukagro.com/logs/nginx_access.log;
    error_log /www/wwwroot/okr.gerenukagro.com/logs/nginx_error.log;
    
    # 静态文件处理
    location /_next/static/ {
        alias /www/wwwroot/okr.gerenukagro.com/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /static/ {
        alias /www/wwwroot/okr.gerenukagro.com/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理（如果后端 API 在同一服务器）
    location /api/ {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # 前端应用代理
    location / {
        proxy_pass http://localhost:3020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 错误页面
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /www/wwwroot/okr-system/public;
    }
}
```

#### 5.3 重载 Nginx 配置
```bash
# 测试配置文件
nginx -t

# 重载配置
nginx -s reload
```

### 6. 域名和 SSL 配置

#### 6.1 域名解析
在域名管理后台添加 A 记录：
- 主机记录：`@` 或 `www`
- 记录类型：`A`
- 记录值：服务器公网 IP

#### 6.2 SSL 证书配置（推荐）
1. 在宝塔面板中，点击站点设置 -> SSL
2. 选择 "Let's Encrypt" 免费证书或上传自有证书
3. 开启 "强制 HTTPS"

### 7. 数据库配置

#### 7.1 创建数据库
```sql
-- MySQL 示例
CREATE DATABASE okr_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'okr_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON okr_database.* TO 'okr_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 7.2 导入数据结构
```bash
# 如果有数据库备份文件
mysql -u okr_user -p okr_database < /path/to/database.sql
```

### 8. 防火墙配置

#### 8.1 宝塔面板防火墙设置
1. 进入宝塔面板 -> 安全
2. 添加端口规则：
   - 端口：`3001`（前端）
   - 端口：`3000`（后端 API）
   - 协议：`TCP`
   - 策略：`放行`

#### 8.2 系统防火墙设置
```bash
# CentOS 7+ (firewall-cmd)
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# Ubuntu (ufw)
ufw allow 3001/tcp
ufw allow 3000/tcp
ufw reload
```

## 运维管理

### 1. 进程管理

#### 1.1 PM2 常用命令
```bash
# 查看进程状态
pm2 status

# 重启应用
pm2 restart okr-frontend

# 停止应用
pm2 stop okr-frontend

# 查看日志
pm2 logs okr-frontend

# 监控应用
pm2 monit

# 设置开机自启
pm2 startup
pm2 save
```

#### 1.2 日志管理
```bash
# 查看实时日志
pm2 logs okr-frontend --lines 100

# 清空日志
pm2 flush

# 日志轮转
pm2 install pm2-logrotate
```

### 2. 更新部署

#### 2.1 代码更新流程
```bash
# 停止应用
pm2 stop okr-frontend

# 更新代码
cd /www/wwwroot/okr-system
git pull origin main

# 安装新依赖
npm install

# 重新构建
npm run build

# 启动应用
pm2 start okr-frontend
```

#### 2.2 自动化部署脚本
```bash
# 创建部署脚本
cat > /www/wwwroot/okr-system/deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "开始部署..."

# 备份当前版本
backup_dir="/www/backup/okr-system-$(date +%Y%m%d_%H%M%S)"
mkdir -p $backup_dir
cp -r .next $backup_dir/

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建项目
npm run build

# 重启应用
pm2 restart okr-frontend

echo "部署完成！"
EOF

# 设置执行权限
chmod +x /www/wwwroot/okr-system/deploy.sh
```

### 3. 监控和性能优化

#### 3.1 性能监控
```bash
# 安装监控工具
npm install -g pm2-web

# 启动 Web 监控界面
pm2-web
```

#### 3.2 资源优化
- 启用 Gzip 压缩
- 配置浏览器缓存
- 使用 CDN 加速静态资源
- 定期清理日志文件

## 测试验证

### 1. 功能测试
1. 访问 `http://your-domain.com` 确认网站正常加载
2. 测试登录功能（账号：admin，密码：123456）
3. 测试各个角色页面访问权限
4. 测试 API 接口响应

### 2. 性能测试
```bash
# 使用 ab 工具测试
ab -n 1000 -c 10 http://your-domain.com/

# 使用 curl 测试 API
curl -X GET http://your-domain.com/api/v1/health
```

## 故障排除

### 1. 常见问题

#### 1.1 应用启动失败
```bash
# 检查 PM2 日志
pm2 logs okr-frontend

# 检查端口占用
netstat -tlnp | grep :3001

# 检查 Node.js 版本
node --version
```

#### 1.2 构建失败
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 检查磁盘空间
df -h
```

#### 1.3 Nginx 配置问题
```bash
# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /www/wwwroot/okr-system/logs/nginx_error.log
```

### 2. 性能问题

#### 2.1 内存不足
```bash
# 增加 swap 分区
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

#### 2.2 CPU 使用率过高
```bash
# 减少 PM2 实例数量
pm2 scale okr-frontend 2

# 启用 PM2 集群模式
pm2 start ecosystem.config.js --env production
```

## 安全建议

1. **定期更新**：定期更新 Node.js、npm 和项目依赖
2. **强密码策略**：使用强密码保护数据库和宝塔面板
3. **定期备份**：定期备份代码和数据库
4. **监控日志**：定期检查访问日志和错误日志
5. **防火墙配置**：只开放必要的端口
6. **SSL 证书**：启用 HTTPS 加密传输

## 联系支持

如果在部署过程中遇到问题，请：
1. 检查相关日志文件
2. 参考故障排除章节
3. 联系技术支持团队

---

**注意**: 本文档基于项目当前配置编写，实际部署时请根据具体环境进行调整。