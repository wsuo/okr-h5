#!/bin/bash

set -e

echo "=== 开始更新 OKR 项目 ==="

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "项目目录: $PROJECT_ROOT"

# 1. 备份当前版本
BACKUP_DIR="/www/backup/okr-$(date +%Y%m%d_%H%M%S)"
echo "创建备份目录: $BACKUP_DIR"
mkdir -p $BACKUP_DIR

# 备份关键文件
if [ -d ".next" ]; then
    cp -r .next $BACKUP_DIR/
    echo "已备份 .next 目录"
else
    echo "没有找到 .next 目录，跳过备份"
fi

if [ -f ".env.local" ]; then
    cp .env.local $BACKUP_DIR/
    echo "已备份 .env.local 文件"
else
    echo "没有找到 .env.local 文件，跳过备份"
fi

# 备份 package.json 和 package-lock.json
cp package.json $BACKUP_DIR/
[ -f "package-lock.json" ] && cp package-lock.json $BACKUP_DIR/

# 2. 停止服务
echo "停止 PM2 服务..."
if pm2 list | grep -q "okr-frontend"; then
    pm2 stop okr-frontend
    echo "已停止 okr-frontend 服务"
else
    echo "okr-frontend 服务未运行，跳过停止操作"
fi

# 3. 保存本地修改（主要是 .env.local）
echo "保存本地修改..."
if [ -f ".env.local" ]; then
    git add .env.local 2>/dev/null || true
    git stash push -m "backup-env-$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
fi

# 4. 拉取最新代码
echo "拉取最新代码..."
git fetch origin
git pull origin main

# 5. 恢复本地修改
echo "恢复本地修改..."
if git stash list | head -1 | grep -q "backup-env"; then
    git stash pop 2>/dev/null || true
fi

# 6. 检查并安装依赖
echo "检查并安装依赖..."
if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps
else
    npm install --legacy-peer-deps
fi

# 7. 清理并重新构建
echo "清理旧构建文件..."
rm -rf .next

echo "重新构建项目..."
npm run build

# 8. 输出访问提示
echo "构建完成，如果浏览器缓存导致无法访问，请："
echo "1. 按 Ctrl+Shift+R 强制刷新"
echo "2. 或者使用版本号访问：http://okr.gerenukagro.com/?v=$(date +%Y%m%d%H%M%S)"
echo "3. 或者使用无痕模式访问"

# 8. 重启服务
echo "重启服务..."
pm2 start okr-frontend

# 9. 验证服务状态
echo "验证服务状态..."
sleep 5
if pm2 list | grep -q "okr-frontend.*online"; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败，请检查日志"
    pm2 logs okr-frontend --lines 10
    exit 1
fi

# 10. 显示状态信息
echo ""
echo "=== 更新完成 ==="
echo "备份位置: $BACKUP_DIR"
echo "项目状态:"
pm2 status okr-frontend

echo ""
echo "如果服务有问题，可以使用以下命令回滚："
echo "  ./sh/rollback.sh $BACKUP_DIR"
echo ""
echo "查看服务日志："
echo "  pm2 logs okr-frontend"