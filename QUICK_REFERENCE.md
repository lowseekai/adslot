# 快速参考卡片 - 代码修复

## 🚀 一分钟快速开始

```bash
# 1. 运行自动化测试
php test_fixes.php

# 2. 查看修改
git diff --stat

# 3. 查看完整文档
ls -la *.md
```

## 📋 核心修复清单

| # | 问题 | 修复 | 优先级 | 文件 |
|---|------|------|--------|------|
| 1 | 折扣码竞态 | 行锁 `lockForUpdate()` | 🔴 高 | DiscountCodeService.php:162 |
| 2 | 输入验证 | 类型检查 | 🔴 高 | SaveAdminConfigController.php:170 |
| 3 | 批量事务 | `transaction()` | 🔴 高 | DiscountCodeService.php:73 |
| 4 | 过期边界 | `lessThan()` | 🟡 中 | DiscountCodeService.php:185 |
| 5 | 支付验证 | 统一方法 | 🟡 中 | ItemValidator.php:247 |
| 6 | 重试限制 | 100次上限 | 🟡 中 | DiscountCodeService.php:409 |
| 7 | 规范化 | `normalizeDiscountCode()` | 🟡 中 | DiscountCodeService.php:88 |
| 8 | 默认值 | 常量 | 🟢 低 | AdSlotSettings.php:24 |
| 9 | 设置优化 | 辅助类 | 🟢 低 | SaveAdminConfigController.php:17 |

## 🧪 必做测试 (Top 3)

```
1️⃣ 并发折扣码测试
   两个用户同时使用 usage_limit=1 的码
   预期: 只有一个成功

2️⃣ 批量生成测试
   生成 5 个折扣码
   预期: 全部成功或全部失败

3️⃣ 配置输入测试
   发送数组类型到文本字段
   预期: 返回 422 错误
```

## 📄 关键文件位置

```
修复代码:
├── src/Support/DiscountCodeService.php     (核心修复)
├── src/Api/Controller/SaveAdminConfigController.php
├── src/Support/ItemValidator.php
├── src/Support/AdSlotSettings.php
└── src/Api/Controller/*.php                (2个控制器)

文档:
├── CODE_REVIEW_FIXES.md                    (详细说明)
├── TESTING_GUIDE.md                        (测试步骤)
└── LOCAL_TEST_SUMMARY.md                   (测试总结)

工具:
├── test_fixes.php                          (自动化测试)
└── commit_fixes.sh                         (提交脚本)
```

## ⚡ 快速命令

```bash
# 测试
php test_fixes.php                   # 自动化测试
php -l src/**/*.php                  # 语法检查

# 查看
git status                           # Git 状态
git diff src/Support/DiscountCodeService.php  # 查看具体修改

# 提交
bash commit_fixes.sh                 # 提交所有修复
# 或
git add . && git commit -m "fix: ..."

# 清理
rm test_fixes.php                    # 删除测试脚本（可选）
```

## 🎯 测试环境部署步骤

```bash
# 1. 部署代码
git pull

# 2. 清除缓存
php flarum cache:clear

# 3. 检查数据库
php flarum migrate:check

# 4. 执行功能测试（见 TESTING_GUIDE.md）

# 5. 监控日志
tail -f storage/logs/flarum.log
```

## ⚠️ 重要提示

```
✅ 所有修复向后兼容
✅ 无需修改前端代码
✅ 无需数据库迁移

⚠️ 确保数据库使用 InnoDB
⚠️ 部署前备份数据库
⚠️ 低峰期部署（推荐）
```

## 📞 问题排查

| 问题 | 检查 | 解决 |
|------|------|------|
| 语法错误 | `php -l 文件名` | 查看错误行号 |
| 功能异常 | Flarum 日志 | 查看错误堆栈 |
| 性能问题 | 数据库日志 | 检查慢查询 |
| 锁超时 | `innodb_lock_wait_timeout` | 增加超时时间 |

## 📊 成功指标

```
✅ 自动化测试: 8/8 通过
✅ 语法检查: 无错误
✅ 功能测试: 通过率 > 90%
✅ 性能测试: 无明显下降
✅ 无新增错误日志
```

## 🔗 相关链接

- 详细文档: CODE_REVIEW_FIXES.md
- 测试指南: TESTING_GUIDE.md
- 测试总结: LOCAL_TEST_SUMMARY.md

---

**版本**: 1.0  
**最后更新**: 2026-06-13  
**状态**: ✅ 准备好进行 Flarum 测试
