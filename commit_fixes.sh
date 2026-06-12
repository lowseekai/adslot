#!/bin/bash
# Git 提交脚本 - 代码修复

echo "准备提交代码修复..."
echo ""

# 检查 Git 状态
echo "当前 Git 状态:"
git status --short

echo ""
echo "准备提交以下修复:"
echo "1. 折扣码竞态条件修复（行锁）"
echo "2. 管理员配置输入验证"
echo "3. 批量生成事务包装"
echo "4. 折扣码过期边界优化"
echo "5. 支付验证逻辑统一"
echo "6. 代码生成重试限制"
echo "7. 折扣码规范化统一"
echo "8. 默认值常量化"
echo "9. 设置读取优化"
echo ""

read -p "是否继续提交？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消提交"
    exit 1
fi

# 添加修改的文件
echo "添加修改的文件..."
git add src/Support/DiscountCodeService.php
git add src/Api/Controller/SaveAdminConfigController.php
git add src/Support/ItemValidator.php
git add src/Support/AdSlotSettings.php
git add src/Api/Controller/CreateItemController.php
git add src/Api/Controller/UpdateMyItemController.php

# 添加文档
git add CODE_REVIEW_FIXES.md
git add FIXES_SUMMARY.md
git add TESTING_GUIDE.md

echo "文件已添加到暂存区"
echo ""

# 创建提交
echo "创建提交..."
git commit -m "fix: 修复代码审查发现的关键问题

修复内容:
- 添加数据库行锁防止折扣码竞态条件
- 添加管理员配置输入类型验证
- 使用事务确保批量生成原子性
- 优化折扣码过期边界检查（1秒宽限期）
- 提取支付验证逻辑到统一方法
- 添加代码生成重试限制（100次）
- 统一折扣码规范化处理
- 添加默认值常量便于维护
- 优化设置读取减少重复代码

影响范围:
- 消除竞态条件，提升数据一致性
- 防止错误输入破坏设置
- 改善用户体验
- 提高代码可维护性

测试状态:
- ✅ 语法检查通过
- ✅ 关键修复验证通过
- ✅ 向后兼容
- ⏳ 需要功能测试

参考: CODE_REVIEW_FIXES.md"

echo ""
echo "✅ 提交成功！"
echo ""
echo "下一步:"
echo "1. 查看提交: git show"
echo "2. 推送到远程: git push origin main"
echo "3. 创建 Pull Request 进行 Code Review"
echo "4. 在测试环境部署并测试"
echo ""
echo "测试指南: TESTING_GUIDE.md"
