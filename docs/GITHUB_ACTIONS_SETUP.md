# GitHub Actions 自动发布设置指南

本指南说明如何设置 GitHub Actions 自动发布 npm 包。

## 前置条件

1. **npm 账号**：确保你有一个 npm 账号
2. **npm Token**：需要创建一个 npm Access Token

## 步骤

### 1. 创建 npm Access Token

1. 登录 [npmjs.com](https://www.npmjs.com/)
2. 点击右上角头像，选择 **Access Tokens**
3. 点击 **Generate New Token**
4. 选择 **Automation** 类型（推荐）或 **Publish** 类型
5. 复制生成的 token（**注意**：token 只显示一次，请妥善保存）

### 2. 在 GitHub 仓库中添加 Secret

1. 打开你的 GitHub 仓库
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 输入以下信息：
   - **Name**: `NPM_TOKEN`
   - **Value**: 粘贴你的 npm Access Token
5. 点击 **Add secret**

### 3. 工作流说明

GitHub Actions 工作流文件位于 `.github/workflows/publish.yml`，工作流程如下：

#### 触发条件

- 当代码推送到 `master` 分支时触发
- 忽略以下文件的更改：
  - `**.md` - Markdown 文件
  - `.gitignore` - Git 忽略文件
  - `.prettierrc` - Prettier 配置
  - `.prettierignore` - Prettier 忽略文件
  - `.markdownlint.json` - Markdown Lint 配置
  - `docs/**` - 文档目录

#### 工作流程

1. **Checkout code** - 检出代码
2. **Setup Node.js** - 设置 Node.js 20 环境
3. **Install dependencies** - 安装依赖（使用 `npm ci`）
4. **Run type check** - 运行 TypeScript 类型检查
5. **Run lint** - 运行代码检查
6. **Get package version** - 获取 package.json 中的版本号
7. **Check if version changed** - 检查版本是否变化
8. **Check if version already published** - 检查版本是否已发布
9. **Build project** - 构建项目
10. **Publish to npm** - 发布到 npm
11. **Create Git tag** - 创建 Git 标签
12. **Create GitHub Release** - 创建 GitHub Release

#### 智能发布

工作流包含以下智能功能：

- **版本检查**：只有当 `package.json` 中的版本号发生变化时才会发布
- **重复发布保护**：如果版本已发布，会跳过发布步骤
- **自动标签**：发布成功后自动创建 Git 标签
- **自动 Release**：发布成功后自动创建 GitHub Release

## 使用方法

### 发布新版本

1. 更新 `package.json` 中的版本号（例如：`1.0.1` → `1.0.2`）
2. 提交更改到 `master` 分支：
   ```bash
   git add package.json
   git commit -m "chore: bump version to 1.0.2"
   git push origin master
   ```
3. GitHub Actions 会自动：
   - 检测版本变化
   - 运行测试和检查
   - 构建项目
   - 发布到 npm
   - 创建 Git 标签
   - 创建 GitHub Release

### 版本号规范

遵循 [语义化版本](https://semver.org/) 规范：

- **主版本号（Major）**：不兼容的 API 修改（例如：`1.0.0` → `2.0.0`）
- **次版本号（Minor）**：向下兼容的功能性新增（例如：`1.0.0` → `1.1.0`）
- **修订号（Patch）**：向下兼容的问题修正（例如：`1.0.0` → `1.0.1`）

### 手动触发

如果需要手动触发工作流：

1. 打开 GitHub 仓库的 **Actions** 页面
2. 选择 **Publish to npm** 工作流
3. 点击 **Run workflow**
4. 选择分支（通常是 `master`）
5. 点击 **Run workflow**

## 故障排除

### 发布失败

如果发布失败，检查以下事项：

1. **npm Token 是否正确**：
   - 检查 GitHub Secrets 中的 `NPM_TOKEN` 是否正确
   - 检查 token 是否过期
   - 检查 token 是否有发布权限

2. **版本号是否变化**：
   - 确保 `package.json` 中的版本号已更新
   - 检查版本号是否符合语义化版本规范

3. **构建是否成功**：
   - 检查构建步骤是否成功
   - 检查 `dist` 目录是否包含构建文件

4. **npm 包名是否冲突**：
   - 检查 npm 上是否已存在同名包
   - 检查包名是否符合 npm 命名规范

### 重复发布

如果版本已发布，工作流会跳过发布步骤。这是正常行为，防止重复发布。

如果需要重新发布：

1. 更新版本号
2. 再次提交到 `master` 分支

### 标签创建失败

如果标签创建失败，检查以下事项：

1. **权限设置**：
   - 确保 GitHub Actions 有 `contents: write` 权限
   - 检查 `GITHUB_TOKEN` 是否正确设置

2. **标签是否已存在**：
   - 如果标签已存在，工作流会跳过标签创建
   - 这是正常行为，防止重复创建标签

## 安全建议

1. **不要将 npm Token 提交到代码仓库**
2. **使用 Automation Token**：推荐使用 npm Automation Token，而不是 Publish Token
3. **定期轮换 Token**：定期更换 npm Token
4. **限制 Token 权限**：只授予必要的权限

## 参考

- [npm Access Tokens](https://docs.npmjs.com/about-access-tokens)
- [GitHub Actions](https://docs.github.com/en/actions)
- [语义化版本](https://semver.org/)
- [npm 发布指南](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

