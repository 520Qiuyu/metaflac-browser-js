# 快速本地调试指南

## 在其他项目中边调试边使用

### 前置准备

1. **在库项目中创建链接**

   **如果使用 npm：**
   ```bash
   cd D:\Documents\GitHub\metaflac-browser-js
   npm link
   ```

   **如果使用 pnpm：**
   ```bash
   cd D:\Documents\GitHub\metaflac-browser-js
   pnpm link --global
   ```

2. **启动自动构建监听**（新开一个终端窗口）
   ```bash
   cd D:\Documents\GitHub\metaflac-browser-js
   npm run build:watch
   # 或
   pnpm run build:watch
   ```
   这样修改代码后会自动重新构建。

### 步骤 1：在你的项目中使用链接

**如果使用 npm：**
```bash
# 进入你的项目目录
cd D:\Documents\GitHub\your-project

# 链接到本地库
npm link metaflac-browser-js
```

**如果使用 pnpm：**
```bash
# 进入你的项目目录
cd D:\Documents\GitHub\your-project

# 链接到本地库
pnpm link --global metaflac-browser-js
```

**或者使用 pnpm 的直接链接方式（推荐）：**
```bash
# 直接链接到库目录（不需要先运行 pnpm link --global）
pnpm link D:\Documents\GitHub\metaflac-browser-js
```

### 步骤 2：在项目中使用

#### 如果使用打包工具（Webpack/Vite/Rollup）

```javascript
// 在你的项目代码中
import Metaflac from 'metaflac-browser-js';

// 使用
const flac = await Metaflac.fromFile(file);
```

#### 如果使用 Script 标签

```html
<!-- 直接引用链接后的文件 -->
<script src="./node_modules/metaflac-browser-js/dist/metaflac-browser-js.js"></script>

<script>
    // Metaflac 作为全局变量可用
    const flac = await Metaflac.fromFile(file);
</script>
```

### 步骤 3：调试流程

1. **修改库代码**（在 `metaflac-browser-js` 项目中）
   - 修改 `index.js` 或 `lib/` 中的文件
   - 添加 `console.log` 等调试代码

2. **自动重新构建**
   - 如果运行了 `npm run build:watch`，会自动重新构建
   - 或者手动运行 `npm run build`

3. **刷新项目页面**
   - 如果使用打包工具，可能需要重启开发服务器
   - 如果使用 script 标签，刷新浏览器即可

### 取消链接

**如果使用 npm：**
```bash
# 在你的项目中
cd D:\Documents\GitHub\your-project
npm unlink metaflac-browser-js

# 然后重新安装正式版本（如果需要）
npm install metaflac-browser-js
```

**如果使用 pnpm：**
```bash
# 在你的项目中
cd D:\Documents\GitHub\your-project
pnpm unlink metaflac-browser-js

# 然后重新安装正式版本（如果需要）
pnpm install metaflac-browser-js
```

---

## 方法二：使用 file: 协议（简单直接）

### 在你的项目的 package.json 中

```json
{
  "dependencies": {
    "metaflac-browser-js": "file:../metaflac-browser-js"
  }
}
```

### 然后安装

**如果使用 npm：**
```bash
cd D:\Documents\GitHub\your-project
npm install
```

**如果使用 pnpm：**
```bash
cd D:\Documents\GitHub\your-project
pnpm install
```

### 使用

和正常使用一样，但每次修改库代码后需要：
1. 运行 `npm run build` 重新构建
2. 在你的项目中重新安装：`npm install`

---

## 推荐工作流程

### 终端 1：库项目 - 监听构建
```bash
cd D:\Documents\GitHub\metaflac-browser-js
npm run build:watch
```

### 终端 2：你的项目 - 开发服务器
```bash
cd D:\Documents\GitHub\your-project
npm run dev  # 或 npm start
```

### 调试步骤
1. 修改 `metaflac-browser-js` 的代码
2. 自动构建（终端 1）
3. 刷新浏览器或重启开发服务器（终端 2）
4. 查看效果

---

## 常见问题

### Q: 修改代码后没有生效？

**解决方案：**
- 确保运行了 `npm run build:watch` 或手动运行 `npm run build`
- 如果使用打包工具，重启开发服务器
- 清除浏览器缓存（Ctrl+Shift+R）

### Q: 如何确认使用的是本地版本？

**解决方案：**
- 在库代码中添加明显的标识：
  ```javascript
  console.log('使用本地调试版本！');
  ```
- 检查 `node_modules/metaflac-browser-js` 是否是符号链接

### Q: 使用 Vite 时如何调试？

**重要提示：** Vite 现在会自动使用 ES 模块版本（`metaflac-browser-js.esm.js`），无需额外配置。

**如果遇到 "does not provide an export named 'default'" 错误：**

1. **确保已重新构建**：
   ```bash
   cd D:\Documents\GitHub\metaflac-browser-js
   npm run build
   # 或
   pnpm run build
   ```

2. **重新链接包**：
   ```bash
   # 在你的项目中
   pnpm unlink metaflac-browser-js
   pnpm link D:\Documents\GitHub\metaflac-browser-js
   ```

3. **重启 Vite 开发服务器**：
   ```bash
   # 停止当前服务器（Ctrl+C），然后重新启动
   pnpm run dev
   ```

4. **清除 Vite 缓存**（如果还有问题）：
   ```bash
   # 删除 .vite 目录
   rm -rf .vite
   # 或 Windows
   rmdir /s .vite
   ```

**Vite 配置（可选，通常不需要）：**
```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // 确保使用本地链接的版本
    dedupe: ['metaflac-browser-js'],
  },
  server: {
    watch: {
      // 监听 node_modules 中的变化
      ignored: ['!**/node_modules/metaflac-browser-js/**'],
    },
  },
});
```

### Q: 使用 Webpack 时如何调试？

**Webpack 配置（如果需要）：**
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    symlinks: true, // 允许符号链接
  },
  watchOptions: {
    // 监听链接的包
    followSymlinks: true,
  },
};
```

---

## 快速命令参考

### 使用 npm

```bash
# ===== 库项目 =====
# 创建链接
npm link

# 监听构建（推荐）
npm run build:watch

# 手动构建
npm run build

# ===== 你的项目 =====
# 链接到本地库
npm link metaflac-browser-js

# 取消链接
npm unlink metaflac-browser-js
```

### 使用 pnpm

```bash
# ===== 库项目 =====
# 创建全局链接
pnpm link --global

# 监听构建（推荐）
pnpm run build:watch

# 手动构建
pnpm run build

# ===== 你的项目 =====
# 方式 1: 链接全局链接的包
pnpm link --global metaflac-browser-js

# 方式 2: 直接链接目录（推荐，更简单）
pnpm link D:\Documents\GitHub\metaflac-browser-js

# 取消链接
pnpm unlink metaflac-browser-js
```

