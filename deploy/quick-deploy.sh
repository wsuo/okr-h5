#!/bin/bash

# 快速部署脚本 - OKR前端项目
# 使用方法: ./deploy/quick-deploy.sh

# 确保在项目根目录执行
cd "$(dirname "$0")/.."

# 加载配置文件
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

SERVER="${SERVER_USER}@${SERVER_IP}"
REMOTE_DIR="${FRONTEND_DIR}"
PM2_APP="${FRONTEND_PM2_NAME}"

echo "🚀 开始快速部署..."
echo "📂 当前目录: $(pwd)"

# 检查是否在正确的项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请确保在项目根目录执行"
    exit 1
fi

# 1. 本地构建
echo "📦 构建项目..."
npm run build

# 2. 同步文件（排除不必要的文件）
echo "📤 同步文件到服务器..."

# 构建 rsync 排除参数
EXCLUDE_ARGS=""
for exclude in "${RSYNC_EXCLUDES[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude '$exclude'"
done

eval "rsync -avz --delete $EXCLUDE_ARGS ./ $SERVER:$REMOTE_DIR/"

# 3. 远程操作
echo "🔄 在服务器上更新和构建..."
ssh $SERVER "
  cd $REMOTE_DIR && \
  echo '🧹 清理锁定文件...' && \
  rm -f pnpm-lock.yaml && \
  echo '📦 安装依赖...' && \
  $INSTALL_COMMAND && \
  npm install react-is --legacy-peer-deps && \
  if [ \$? -eq 0 ]; then
    echo '✅ 依赖安装成功'
    echo '🔨 构建项目...'
    npm run build && \
    echo '🔄 重启PM2服务...'
    pm2 restart $PM2_APP && \
    sleep 3 && \
    echo '📊 服务状态:'
    pm2 list | grep $PM2_APP
  else
    echo '❌ 依赖安装失败'
    exit 1
  fi
"

echo "✅ 部署完成！访问: http://${DOMAIN}/"