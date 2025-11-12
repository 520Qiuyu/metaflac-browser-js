# 本地调试指南

当你在其他项目中使用 `metaflac-browser-js` 时，如果遇到问题需要本地调试，可以使用以下几种方法。

## 方法一：使用 npm link（推荐）

这是最常用的本地调试方法，适合频繁修改和测试。

### 步骤 1：在库项目（metaflac-browser-js）中创建链接

```bash
# 进入 metaflac-browser-js 项目目录
cd D:\Documents\GitHub\metaflac-browser-js

# 创建全局链接
npm link
```

### 步骤 2：在使用该库的项目中链接

```bash
# 进入你的项目目录（例如：my-app）
cd D:\Documents\GitHub\my-app

# 链接到本地库
npm link metaflac-browser-js
```

### 步骤 3：使用和调试

现在你可以在项目中使用该库，并且修改 `metaflac-browser-js` 的代码会立即生效（可能需要重启开发服务器）。

```javascript
// 在你的项目中使用
import Metaflac from 'metaflac-browser-js';

// 现在可以添加 console.log 等调试代码
const flac = await Metaflac.fromFile(file);
```

### 取消链接

```bash
# 在使用库的项目中
cd D:\Documents\GitHub\my-app
npm unlink metaflac-browser-js

# 在库项目中（可选）
cd D:\Documents\GitHub\metaflac-browser-js
npm unlink
```

### 注意事项

- 如果使用 Vite，可能需要重启开发服务器才能看到更改
- 某些打包工具可能需要配置 `resolve.symlinks = false`
- 如果遇到模块找不到的问题，尝试删除 `node_modules` 和重新安装

---

## 方法二：使用 file: 协议（简单直接）

直接在项目的 `package.json` 中引用本地路径。

### 步骤 1：修改项目的 package.json

```json
{
  "dependencies": {
    "metaflac-browser-js": "file:../metaflac-browser-js"
  }
}
```

或者使用绝对路径：

```json
{
  "dependencies": {
    "metaflac-browser-js": "file:D:/Documents/GitHub/metaflac-browser-js"
  }
}
```

### 步骤 2：安装依赖

```bash
cd D:\Documents\GitHub\my-app
npm install
```

### 步骤 3：使用和调试

修改 `metaflac-browser-js` 的代码后，可能需要重新安装：

```bash
# 每次修改后重新安装
npm install
```

### 优点

- 简单直接，不需要额外的命令
- 适合偶尔调试

### 缺点

- 每次修改后可能需要重新安装
- 路径是硬编码的，不够灵活

---

## 方法三：使用 npm pack（模拟发布环境）

创建一个本地包文件，然后安装它。这样可以模拟真实的 npm 安装环境。

### 步骤 1：在库项目中打包

```bash
cd D:\Documents\GitHub\metaflac-browser-js
npm pack
```

这会创建一个 `.tgz` 文件，例如：`metaflac-browser-js-1.0.0.tgz`

### 步骤 2：在项目中使用本地包

```bash
cd D:\Documents\GitHub\my-app

# 安装本地包
npm install ../metaflac-browser-js/metaflac-browser-js-1.0.0.tgz
```

或者在 `package.json` 中：

```json
{
  "dependencies": {
    "metaflac-browser-js": "file:../metaflac-browser-js/metaflac-browser-js-1.0.0.tgz"
  }
}
```

### 步骤 3：更新包

每次修改后需要重新打包和安装：

```bash
# 在库项目中
cd D:\Documents\GitHub\metaflac-browser-js
npm pack

# 在项目中使用新版本
cd D:\Documents\GitHub\my-app
npm install ../metaflac-browser-js/metaflac-browser-js-1.0.0.tgz --force
```

### 优点

- 完全模拟 npm 发布环境
- 可以测试打包后的文件

### 缺点

- 每次修改都需要重新打包
- 步骤较多

---

## 方法四：使用 pnpm workspace（如果使用 pnpm）

如果你使用 pnpm，可以使用 workspace 功能。

### 步骤 1：创建 pnpm-workspace.yaml

在项目根目录创建：

```yaml
packages:
  - 'packages/*'
  - '../metaflac-browser-js'
```

### 步骤 2：在项目中使用

```json
{
  "dependencies": {
    "metaflac-browser-js": "workspace:*"
  }
}
```

---

## 调试技巧

### 1. 添加调试日志

在 `metaflac-browser-js/index.js` 中添加 `console.log`：

```javascript
// 在需要调试的地方添加
console.log('调试信息:', someVariable);
```

### 2. 使用浏览器开发者工具

- 在浏览器中打开开发者工具
- 在 Sources 面板中找到 `metaflac-browser-js` 的代码
- 设置断点进行调试

### 3. 使用 source maps（如果支持）

某些打包工具会自动生成 source maps，可以直接调试源码。

### 4. 检查模块是否正确加载

```javascript
// 在项目中使用
import Metaflac from 'metaflac-browser-js';

console.log('Metaflac:', Metaflac);
console.log('fromFile:', Metaflac.fromFile);
```

---

## 常见问题

### Q1: 修改代码后没有生效？

**解决方案：**
- 重启开发服务器（Vite、Webpack 等）
- 清除浏览器缓存
- 删除 `node_modules` 和重新安装
- 检查是否正确链接

### Q2: 模块找不到错误？

**解决方案：**
- 检查路径是否正确
- 确认 `package.json` 中的 `main` 字段指向正确的文件
- 检查 `files` 字段是否包含需要的文件

### Q3: 打包工具无法解析模块？

**解决方案：**
- 检查打包工具的配置（webpack.config.js、vite.config.js 等）
- 可能需要配置 `resolve.symlinks`
- 确认模块格式（CommonJS/ES6）是否匹配

### Q4: 如何确认使用的是本地版本？

**解决方案：**
- 在库代码中添加明显的标识（如版本号、特殊日志）
- 检查 `node_modules/metaflac-browser-js` 的路径是否是符号链接
- 使用 `npm list metaflac-browser-js` 查看安装路径

---

## 推荐工作流程

1. **开发阶段**：使用 `npm link`（方法一）
   - 修改代码立即生效
   - 适合频繁调试

2. **测试阶段**：使用 `npm pack`（方法三）
   - 模拟真实发布环境
   - 确保打包后的文件正常

3. **发布前**：使用 npm 正式版本
   - 确保从 npm 安装的版本正常工作

---

## 快速参考命令

```bash
# ===== 方法一：npm link =====
# 在库项目中
cd metaflac-browser-js
npm link

# 在项目中使用
cd my-app
npm link metaflac-browser-js

# ===== 方法二：file: 协议 =====
# 在项目的 package.json 中
"metaflac-browser-js": "file:../metaflac-browser-js"

# ===== 方法三：npm pack =====
# 在库项目中
cd metaflac-browser-js
npm pack

# 在项目中使用
cd my-app
npm install ../metaflac-browser-js/metaflac-browser-js-1.0.0.tgz
```

---

## 示例：在 Vite 项目中使用

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // 如果需要，可以配置别名
    alias: {
      'metaflac-browser-js': path.resolve(__dirname, '../metaflac-browser-js')
    }
  }
});
```

---

## 示例：在 Webpack 项目中使用

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    symlinks: true, // 允许符号链接
    alias: {
      'metaflac-browser-js': path.resolve(__dirname, '../metaflac-browser-js')
    }
  }
};
```

