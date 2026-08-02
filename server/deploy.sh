#!/bin/bash
# FlipinBeat 服务器 CentOS 部署脚本
# 使用方法：chmod +x deploy.sh && ./deploy.sh

set -e

echo "========================================"
echo "  FlipinBeat 服务器部署脚本"
echo "========================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[1/4] 安装 Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
else
    echo "[1/4] Node.js 已安装: $(node -v)"
fi

# 创建项目目录
APP_DIR="/opt/flipinbeat-server"
echo "[2/4] 创建项目目录 $APP_DIR..."
sudo mkdir -p "$APP_DIR/data/scores"

# 复制文件
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
sudo cp "$SCRIPT_DIR/server.js" "$APP_DIR/" 2>/dev/null || sudo cp "$(pwd)/server.js" "$APP_DIR/"
sudo cp "$SCRIPT_DIR/package.json" "$APP_DIR/" 2>/dev/null || sudo cp "$(pwd)/package.json" "$APP_DIR/"

# 安装依赖
echo "[3/4] 安装依赖..."
cd "$APP_DIR"
sudo npm install --production

# 用 screen 启动
echo "[4/4] 启动服务..."
screen -S flipinbeat -X quit 2>/dev/null || true
screen -dmS flipinbeat bash -c 'cd /opt/flipinbeat-server && FLIPINBEAT_KEY="FlipinBeat2026SecretKey32Bytes!!" node server.js'

sleep 1

# 北京时间
START_TIME=$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S')

# 写入信息文件（每次覆盖，保持最新）
INFO_FILE="$APP_DIR/information.txt"
sudo tee "$INFO_FILE" > /dev/null << EOF
========================================
  FlipinBeat 服务器信息
========================================

最后启动时间: $START_TIME (北京时间)

健康检查: curl http://localhost:1092/api/health

常用命令:
  进入后台:  screen -r flipinbeat
  退出后台:  Ctrl+A 然后按 D
  查看日志:  screen -r flipinbeat
  重启服务:  screen -S flipinbeat -X quit && screen -dmS flipinbeat bash -c 'cd /opt/flipinbeat-server && FLIPINBEAT_KEY="FlipinBeat2026SecretKey32Bytes!!" node server.js'
  停止服务:  screen -S flipinbeat -X quit

数据目录: $APP_DIR/data/scores/
加密方式: AES-256-GCM
加密密钥: FlipinBeat2026SecretKey32Bytes!!
服务器地址: http://0.0.0.0:1092
========================================
EOF

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
cat "$INFO_FILE"
echo ""
echo "  信息已保存到: $INFO_FILE"
echo "========================================"
