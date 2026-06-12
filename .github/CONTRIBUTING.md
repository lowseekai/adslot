# Contributing to AdSlot

感谢你对 AdSlot 项目的关注！

## 贡献方式

### 报告 Bug

如果你发现了 bug，请：

1. 在 [Issues](https://github.com/gungun88/adslot/issues) 中搜索是否已有相关报告
2. 如果没有，创建一个新的 Issue，使用 Bug Report 模板
3. 提供尽可能详细的信息，包括：
   - 重现步骤
   - 期望行为 vs 实际行为
   - Flarum 和 PHP 版本
   - 相关错误日志

### 功能建议

如果你有新功能的想法：

1. 先在 Issues 中搜索是否有类似建议
2. 创建一个新的 Issue，使用 Feature Request 模板
3. 清晰描述你的需求和建议的解决方案

### 提交代码

1. Fork 这个仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建一个 Pull Request

### 代码规范

- 遵循 PSR-12 代码风格
- 为新功能编写测试
- 更新相关文档
- 提交信息使用清晰的描述

### Pull Request 检查清单

在提交 PR 前，请确保：

- [ ] 代码通过所有测试
- [ ] 添加了必要的测试
- [ ] 更新了文档
- [ ] 遵循代码规范
- [ ] 提交信息清晰

## 开发设置

```bash
# 克隆仓库
git clone https://github.com/gungun88/adslot.git
cd adslot

# 安装依赖
composer install
cd js && npm install

# 运行测试
php test_fixes.php  # 如果存在

# 构建前端资源
cd js && npm run build
```

## 问题和帮助

如果你有任何问题：

- 查看 [文档](README_FIXES.md)
- 在 [Issues](https://github.com/gungun88/adslot/issues) 中提问
- 参考 [Testing Guide](TESTING_GUIDE.md)

感谢你的贡献！🎉
