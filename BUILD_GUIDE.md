# 构建指南

本指南说明如何构建可用于 `<script>` 标签的 UMD 格式文件。

## 安装依赖

首先安装构建所需的依赖：

```bash
npm install
# 或
pnpm install
```

## 构建命令

### 构建生产版本

```bash
npm run build
```

这会在 `dist/` 目录下生成：
- `metaflac-browser-js.js` - UMD 格式的构建文件
- `metaflac-browser-js.js.map` - Source map 文件（用于调试）

### 监听模式（开发时使用）

```bash
npm run build:watch
```

这会监听文件变化并自动重新构建。

## 构建输出

构建后的文件结构：

```
dist/
├── metaflac-browser-js.js      # UMD 格式，可直接在浏览器中使用
└── metaflac-browser-js.js.map  # Source map
```

## 使用构建文件

### 方式一：本地文件

```html
<script src="./node_modules/metaflac-browser-js/dist/metaflac-browser-js.js"></script>
```

### 方式二：CDN (unpkg)

```html
<script src="https://unpkg.com/metaflac-browser-js@latest/dist/metaflac-browser-js.js"></script>
```

### 方式三：CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/metaflac-browser-js@latest/dist/metaflac-browser-js.js"></script>
```

## 全局变量

构建后的文件会将 `Metaflac` 暴露为全局变量：

```javascript
// 直接使用全局变量
const flac = await Metaflac.fromFile(file);
```

## 发布前构建

在发布到 npm 之前，构建会自动执行（通过 `prepublishOnly` 脚本）：

```bash
npm publish
```

这会自动：
1. 运行 `npm run build` 构建文件
2. 运行 `npm pack --dry-run` 检查发布内容
3. 然后执行发布

## 注意事项

1. **构建文件需要提交到 Git**：虽然 `dist/` 在 `.gitignore` 中，但对于 npm 包，建议将构建文件也包含在发布中，这样用户可以直接使用 CDN。

2. **版本控制**：每次发布新版本前，确保构建文件是最新的。

3. **Source Maps**：Source maps 文件有助于调试，但会增加包大小。生产环境可以移除。

## 故障排除

### 构建失败

如果构建失败，检查：
1. 是否安装了所有依赖：`npm install`
2. Node.js 版本是否满足要求（建议 14+）
3. 检查 `rollup.config.js` 配置是否正确

### 全局变量未定义

如果 `Metaflac` 未定义：
1. 检查脚本标签是否正确引入
2. 检查脚本是否在 DOM 加载后执行
3. 查看浏览器控制台是否有错误

### 模块找不到错误

如果出现模块找不到的错误：
1. 确保 `lib/` 目录下的所有文件都存在
2. 检查 `index.js` 中的 require 路径是否正确

