# VCS 安装指南

## 方法：通过 GitHub 仓库直接安装

### 步骤 1: 修改 Flarum 的 composer.json

在你的 Flarum 安装根目录，编辑 `composer.json`，添加 `repositories` 配置：

```json
{
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/gungun88/adslot"
        }
    ],
    "require": {
        "doingfb/adslot": "dev-main"
    }
}
```

**完整示例**：

```json
{
    "name": "flarum/flarum",
    "description": "Delightfully simple forum software.",
    "type": "project",
    "keywords": ["forum", "discussion"],
    "homepage": "https://flarum.org/",
    "license": "MIT",
    "repositories": [
        {
            "type": "vcs",
            "url": "https://github.com/gungun88/adslot"
        }
    ],
    "require": {
        "flarum/core": "^1.8.0",
        "doingfb/adslot": "dev-main"
    },
    ...
}
```

### 步骤 2: 安装扩展

```bash
# 进入 Flarum 根目录
cd /path/to/your/flarum

# 清除 Composer 缓存
composer clear-cache

# 安装扩展
composer require doingfb/adslot:dev-main

# 运行数据库迁移
php flarum migrate

# 清除 Flarum 缓存
php flarum cache:clear
```

### 步骤 3: 启用扩展

在 Flarum 管理后台：
1. 进入 "扩展" 页面
2. 找到 "AdSlot"
3. 点击 "启用"

## 更新扩展

当你推送新代码到 GitHub 后，更新扩展：

```bash
# 进入 Flarum 根目录
cd /path/to/your/flarum

# 更新扩展
composer update doingfb/adslot --with-dependencies

# 运行迁移（如果有新的）
php flarum migrate

# 清除缓存
php flarum cache:clear
```

## 使用特定分支或标签

```bash
# 使用特定分支
composer require doingfb/adslot:dev-feature-branch

# 使用特定标签（需要先在 GitHub 创建 tag）
composer require doingfb/adslot:v1.0.0

# 使用特定 commit
composer require doingfb/adslot:dev-main#abc1234
```

## 创建版本标签（可选）

如果你想使用版本号而不是 `dev-main`，可以在 GitHub 创建标签：

```bash
# 在扩展目录
cd /path/to/adslot

# 创建标签
git tag v1.0.0
git push origin v1.0.0
```

然后就可以：

```bash
composer require doingfb/adslot:^1.0
```

## 常见问题

### 问题 1: Composer 找不到包

**解决**：检查 `composer.json` 中：
- `repositories` 的 URL 正确
- `require` 中的包名与扩展的 `composer.json` 中的 `name` 一致

### 问题 2: 权限问题（私有仓库）

如果仓库是私有的，需要配置 GitHub token：

```bash
composer config github-oauth.github.com YOUR_GITHUB_TOKEN
```

### 问题 3: 缓存问题

```bash
# 清除所有缓存
composer clear-cache
rm -rf vendor/doingfb
composer install
```

## 验证安装

```bash
# 查看已安装的扩展
composer show doingfb/adslot

# 检查版本
php flarum info
```

## 生产环境部署检查清单

- [ ] 备份数据库
- [ ] 备份文件
- [ ] 在测试环境先验证
- [ ] 检查 PHP 和 Flarum 版本要求
- [ ] 确认数据库使用 InnoDB 引擎
- [ ] 在低峰期部署
- [ ] 部署后监控日志
- [ ] 准备回滚方案

参考完整部署指南：DEPLOYMENT_CHECKLIST.md
