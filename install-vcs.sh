#!/bin/bash
# AdSlot VCS 安装脚本

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                   AdSlot VCS 安装脚本                            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 检查是否在 Flarum 根目录
if [ ! -f "flarum" ]; then
    echo "❌ 错误: 请在 Flarum 根目录运行此脚本"
    exit 1
fi

echo "✅ 检测到 Flarum 安装"
echo ""

# 备份 composer.json
echo "📋 备份 composer.json..."
cp composer.json composer.json.backup
echo "✅ 备份完成: composer.json.backup"
echo ""

# 检查是否已有 repositories 配置
if grep -q "github.com/gungun88/adslot" composer.json; then
    echo "ℹ️  AdSlot 仓库配置已存在"
else
    echo "📝 添加 VCS 仓库配置到 composer.json..."
    # 这里需要手动添加，因为自动修改 JSON 比较复杂
    echo ""
    echo "请手动编辑 composer.json，在 'repositories' 数组中添加："
    echo ""
    echo '{
    "type": "vcs",
    "url": "https://github.com/gungun88/adslot"
}'
    echo ""
    read -p "添加完成后按 Enter 继续..."
fi

echo ""
echo "🔧 安装 AdSlot 扩展..."
composer clear-cache
composer require doingfb/adslot:dev-main

if [ $? -eq 0 ]; then
    echo "✅ AdSlot 安装成功"
else
    echo "❌ 安装失败"
    echo "正在恢复 composer.json..."
    mv composer.json.backup composer.json
    exit 1
fi

echo ""
echo "🗄️  运行数据库迁移..."
php flarum migrate

echo ""
echo "🧹 清除缓存..."
php flarum cache:clear

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ 安装完成！                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "下一步："
echo "1. 访问 Flarum 管理后台"
echo "2. 进入 '扩展' 页面"
echo "3. 找到 'AdSlot' 并点击 '启用'"
echo ""
echo "配置："
echo "• 在管理后台 -> AdSlot 设置 中配置广告费用和支付方式"
echo ""
echo "文档："
echo "• 查看 vendor/doingfb/adslot/README.md"
echo "• 测试指南: vendor/doingfb/adslot/TESTING_GUIDE.md"
echo ""
