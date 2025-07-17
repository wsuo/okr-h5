#!/bin/bash

set -e

# 使用说明
show_usage() {
    echo "用法: ./sh/rollback.sh <backup_directory>"
    echo ""
    echo "参数:"
    echo "  backup_directory  备份目录的完整路径"
    echo ""
    echo "示例:"
    echo "  ./sh/rollback.sh /www/backup/okr-20250717_103045"
    echo ""
    echo "可用备份目录:"
    if [ -d "/www/backup" ]; then
        ls -la /www/backup/ | grep "okr-" | tail -10
    else
        echo "  未找到备份目录 /www/backup"
    fi
}

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 错误: 未指定备份目录"
    echo ""
    show_usage
    exit 1
fi

BACKUP_DIR="$1"

# 检查备份目录是否存在
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ 错误: 备份目录不存在: $BACKUP_DIR"
    echo ""
    show_usage
    exit 1
fi

echo "=== 开始回滚 OKR 项目 ==="

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "项目目录: $PROJECT_ROOT"
echo "备份目录: $BACKUP_DIR"

# 确认回滚操作
echo ""
echo "⚠️  即将从以下备份恢复项目:"
echo "   备份时间: $(basename $BACKUP_DIR | sed 's/okr-//' | sed 's/_/ /')"
echo "   备份路径: $BACKUP_DIR"
echo ""
echo "此操作将覆盖当前的构建文件和环境配置！"
echo ""
read -p "确认继续？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消回滚操作"
    exit 0
fi

# 1. 停止服务
echo "停止 PM2 服务..."
if pm2 list | grep -q "okr-frontend"; then
    pm2 stop okr-frontend
    echo "已停止 okr-frontend 服务"
else
    echo "okr-frontend 服务未运行"
fi

# 2. 备份当前状态（以防回滚出错）
CURRENT_BACKUP="/www/backup/okr-before-rollback-$(date +%Y%m%d_%H%M%S)"
echo "备份当前状态到: $CURRENT_BACKUP"
mkdir -p "$CURRENT_BACKUP"

if [ -d ".next" ]; then
    cp -r .next "$CURRENT_BACKUP/"
fi
if [ -f ".env.local" ]; then
    cp .env.local "$CURRENT_BACKUP/"
fi

# 3. 恢复文件
echo "恢复构建文件..."
if [ -d "$BACKUP_DIR/.next" ]; then
    rm -rf .next
    cp -r "$BACKUP_DIR/.next" ./
    echo "✅ 已恢复 .next 目录"
else
    echo "⚠️  备份中没有找到 .next 目录"
fi

echo "恢复环境配置..."
if [ -f "$BACKUP_DIR/.env.local" ]; then
    cp "$BACKUP_DIR/.env.local" ./
    echo "✅ 已恢复 .env.local 文件"
else
    echo "⚠️  备份中没有找到 .env.local 文件"
fi

# 4. 检查依赖版本是否一致
if [ -f "$BACKUP_DIR/package.json" ]; then
    if ! diff -q package.json "$BACKUP_DIR/package.json" > /dev/null; then
        echo "⚠️  检测到 package.json 有变化，可能需要重新安装依赖"
        echo "当前版本与备份版本的依赖可能不一致"
        echo ""
        read -p "是否重新安装依赖？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "重新安装依赖..."
            npm install --legacy-peer-deps
        fi
    fi
fi

# 5. 重启服务
echo "重启服务..."
pm2 start okr-frontend

# 6. 验证服务状态
echo "验证服务状态..."
sleep 3

if pm2 list | grep -q "okr-frontend.*online"; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败"
    echo "查看错误日志:"
    pm2 logs okr-frontend --lines 20
    
    echo ""
    echo "如果服务无法启动，可能需要:"
    echo "1. 检查 Node.js 版本兼容性"
    echo "2. 重新安装依赖: npm install --legacy-peer-deps"
    echo "3. 重新构建: npm run build"
    exit 1
fi

# 7. 显示状态信息
echo ""
echo "=== 回滚完成 ==="
echo "已从备份恢复: $BACKUP_DIR"
echo "当前状态备份: $CURRENT_BACKUP"
echo ""
echo "项目状态:"
pm2 status okr-frontend

echo ""
echo "如果回滚后仍有问题，可以:"
echo "1. 查看日志: pm2 logs okr-frontend"
echo "2. 重新构建: npm run build && pm2 restart okr-frontend"
echo "3. 恢复到回滚前状态: ./sh/rollback.sh $CURRENT_BACKUP"