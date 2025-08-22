#!/bin/bash

# OKR 项目部署配置文件
# 修改此文件来调整部署参数

# 服务器配置
export SERVER_IP="47.239.124.157"
export SERVER_USER="root"
export SERVER_SSH_KEY="" # 如果使用密钥认证，在这里指定密钥路径

# 目录配置
export FRONTEND_DIR="/www/wwwroot/okr.gerenukagro.com"
export BACKEND_DIR="/www/wwwroot/okr-server"
export BACKUP_DIR="/www/backup/okr"

# PM2 应用名称
export FRONTEND_PM2_NAME="okr-frontend"
export BACKEND_PM2_NAME="okr-server"

# 端口配置
export FRONTEND_PORT="3020"
export BACKEND_PORT="3010"

# 域名配置
export DOMAIN="okr.gerenukagro.com"

# 备份保留数量
export BACKUP_KEEP_COUNT="5"

# 健康检查配置
export HEALTH_CHECK_URL="http://${DOMAIN}/"
export HEALTH_CHECK_TIMEOUT="30"

# 构建配置
export NODE_ENV="production"
export BUILD_COMMAND="npm run build"
export INSTALL_COMMAND="npm install --legacy-peer-deps"

# rsync 排除文件列表
export RSYNC_EXCLUDES=(
    'node_modules'
    '.git'
    '.next'
    'logs'
    '.env.local'
    'deploy'
    'pnpm-lock.yaml'
    '*.log'
    '.DS_Store'
    'Thumbs.db'
)

# 日志配置
export LOG_DIR="/www/wwwroot/okr.gerenukagro.com/logs"
export LOG_LEVEL="info"

# 可选：Slack/企业微信通知配置（如需要）
export NOTIFICATION_WEBHOOK=""
export NOTIFICATION_ENABLED="false"