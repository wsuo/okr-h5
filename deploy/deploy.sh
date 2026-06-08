#!/bin/bash

# OKR项目自动部署脚本
# 作者: Claude Code
# 日期: $(date +"%Y-%m-%d")

set -e  # 遇到错误立即退出

# 确保在项目根目录执行
cd "$(dirname "$0")/.."

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$SCRIPT_DIR/config"
DEFAULT_CONFIG="server1.conf"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo
    echo "====================== OKR 部署脚本 使用帮助 ======================"
    echo
    echo "用法:"
    echo "  $0 [OPTIONS] [COMMAND]"
    echo
    echo "命令:"
    echo "  deploy      执行部署操作（默认）"
    echo "  rollback    回滚到上一个版本"
    echo
    echo "选项:"
    echo "  -c, --config <config>   指定配置文件（相对于 config/ 目录）"
    echo "  -l, --list              列出所有可用的配置文件"
    echo "  -h, --help              显示此帮助信息"
    echo
    echo "示例:"
    echo "  部署到服务器1 (默认): $0 deploy"
    echo "  部署到服务器2:        $0 -c server2.conf deploy"
    echo "  列出所有配置:          $0 -l"
    echo "  回滚服务器2:          $0 -c server2.conf rollback"
    echo
    echo "可用的配置文件:"
    list_configs
    echo "===================================================================="
    echo
}

# 列出所有配置文件
list_configs() {
    if [ ! -d "$CONFIG_DIR" ]; then
        echo "  [未找到配置目录]"
        return
    fi

    for config in "$CONFIG_DIR"/*.conf; do
        if [ -f "$config" ]; then
            config_name=$(basename "$config")
            config_desc=$(grep "^# 服务器:" "$config" | head -1 | sed 's/^# //')
            printf "  %-20s %s\n" "$config_name" "$config_desc"
        fi
    done
}

# 加载配置文件的函数
load_config() {
    local config_file="$1"

    if [ ! -f "$config_file" ]; then
        log_error "配置文件不存在: $config_file"
        show_help
        exit 1
    fi

    source "$config_file"
}

# 检查本地环境
check_local_environment() {
    log_info "检查本地环境..."

    # 检查是否在正确的目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录执行此脚本"
        exit 1
    fi

    # 检查git状态
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "工作目录有未提交的更改，建议先提交或储藏"
        read -p "是否继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    log_success "本地环境检查完成"
}

# 构建项目
build_project() {
    log_info "构建前端项目..."

    # 安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装依赖..."
        eval "$INSTALL_COMMAND"
    fi

    # 构建项目
    log_info "构建生产版本..."
    eval "$BUILD_COMMAND"

    if [ $? -eq 0 ]; then
        log_success "项目构建成功"
    else
        log_error "项目构建失败"
        exit 1
    fi
}

# 备份服务器当前版本
backup_server() {
    log_info "备份服务器当前版本..."

    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        # 创建备份目录
        mkdir -p $BACKUP_DIR/\$(date +%Y%m%d_%H%M%S)

        # 备份前端
        if [ -d '$FRONTEND_DIR' ]; then
            cp -r $FRONTEND_DIR $BACKUP_DIR/\$(date +%Y%m%d_%H%M%S)/frontend
            echo '前端备份完成'
        fi

        # 保留最近5个备份
        cd $BACKUP_DIR && ls -t | tail -n +6 | xargs -r rm -rf
    "

    log_success "服务器备份完成"
}

# 上传文件到服务器
upload_files() {
    log_info "上传文件到服务器..."

    # 排除不需要上传的文件和目录
    rsync -avz --delete -e "ssh -p $SERVER_PORT" \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.next' \
        --exclude 'logs' \
        --exclude '.env.local' \
        --exclude 'deploy.sh' \
        ./ $SERVER_USER@$SERVER_IP:$FRONTEND_DIR/

    log_success "文件上传完成"
}

# 服务器端部署操作
deploy_on_server() {
    log_info "在服务器上执行部署操作..."

    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        cd $FRONTEND_DIR

        # 安装依赖
        echo '[INFO] 安装/更新依赖...'
        eval \"$INSTALL_COMMAND\"

        # 构建项目
        echo '[INFO] 构建项目...'
        npm run build

        # 重启PM2服务
        echo '[INFO] 重启前端服务...'
        pm2 restart $FRONTEND_PM2_NAME || pm2 start ecosystem.config.js

        # 检查服务状态
        sleep 5
        pm2 show $FRONTEND_PM2_NAME

        echo '[INFO] 部署完成，正在检查服务状态...'

        # 检查服务是否正常运行
        if pm2 list | grep -q '$FRONTEND_PM2_NAME.*online'; then
            echo '✅ 前端服务运行正常'
        else
            echo '❌ 前端服务异常，请检查日志'
            pm2 logs $FRONTEND_PM2_NAME --lines 20
            exit 1
        fi
    "

    log_success "服务器部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 等待服务启动
    sleep 10

    # 检查前端服务
    log_info "检查前端服务..."
    response=$(curl -s -o /dev/null -w "%{http_code}" http://${DOMAIN}/ || echo "000")

    if [ "$response" = "200" ]; then
        log_success "前端服务健康检查通过"
    else
        log_warning "前端服务健康检查失败，HTTP状态码: $response"
        log_info "请检查服务器日志"
        ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "pm2 logs $FRONTEND_PM2_NAME --lines 20"
    fi
}

# 回滚函数
rollback() {
    log_warning "开始回滚到上一个版本..."

    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP "
        cd $BACKUP_DIR
        latest_backup=\$(ls -t | head -n 1)

        if [ -n \"\$latest_backup\" ] && [ -d \"\$latest_backup/frontend\" ]; then
            # 停止服务
            pm2 stop $FRONTEND_PM2_NAME

            # 恢复备份
            rm -rf $FRONTEND_DIR
            cp -r \$latest_backup/frontend $FRONTEND_DIR

            # 重启服务
            cd $FRONTEND_DIR
            pm2 start ecosystem.config.js

            echo '[SUCCESS] 回滚完成'
        else
            echo '[ERROR] 未找到备份文件，无法回滚'
            exit 1
        fi
    "
}

# 显示部署信息
show_deploy_info() {
    echo
    log_success "部署完成！"
    echo "=================== 部署信息 ==================="
    echo "配置文件: $(basename $CONFIG_FILE)"
    echo "服务器描述: $SERVER_DESC"
    echo "前端地址: http://${DOMAIN}/"
    echo "服务器IP: $SERVER_IP:$SERVER_PORT"
    echo "部署目录: $FRONTEND_DIR"
    echo "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Git提交: $(git rev-parse --short HEAD)"
    echo "=============================================="
    echo
    echo "常用命令："
    echo "查看日志: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'pm2 logs $FRONTEND_PM2_NAME'"
    echo "查看状态: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'pm2 status'"
    echo "重启服务: ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP 'pm2 restart $FRONTEND_PM2_NAME'"
    echo
}

# 主函数
main() {
    echo "=================== OKR 自动部署脚本 ==================="
    echo "配置文件: $(basename $CONFIG_FILE)"
    echo "服务器描述: $SERVER_DESC"
    echo "目标服务器: $SERVER_IP:$SERVER_PORT"
    echo "前端目录: $FRONTEND_DIR"
    echo "======================================================"
    echo

    # 确认部署
    read -p "确认开始部署? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi

    # 执行部署步骤
    check_local_environment
    build_project
    backup_server
    upload_files
    deploy_on_server
    health_check
    show_deploy_info

    log_success "🎉 部署完成！"
}

# 解析命令行参数
config_name="$DEFAULT_CONFIG"
command="deploy"

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            config_name="$2"
            shift 2
            ;;
        -l|--list)
            list_configs
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        deploy|rollback)
            command="$1"
            shift
            ;;
        *)
            log_error "未知的参数: $1"
            show_help
            exit 1
            ;;
    esac
done

CONFIG_FILE="$CONFIG_DIR/$config_name"

# 加载配置文件
load_config "$CONFIG_FILE"

# 错误处理
trap 'log_error "部署过程中发生错误，如需回滚请运行: $0 -c $(basename $CONFIG_FILE) rollback"' ERR

# 执行相应命令
case "$command" in
    "rollback")
        rollback
        ;;
    "deploy"|*)
        main
        ;;
esac
