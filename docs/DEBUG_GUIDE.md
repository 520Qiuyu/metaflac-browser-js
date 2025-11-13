# 开发调试指南

## 如何在 index.html 中调试 TypeScript 源文件

现在项目已经转换为 TypeScript，使用 Vite 作为开发服务器，可以直接在浏览器中调试 TypeScript 源文件。

## 快速开始

### 1. 启动开发服务器

```bash
npm run dev
```

这将启动 Vite 开发服务器，默认在 `http://localhost:3000` 打开。

### 2. 调试 TypeScript 源文件

- Vite 会自动处理 TypeScript 文件的转换
- 在浏览器中可以直接调试 TypeScript 源文件（通过 sourcemap）
- 支持热模块替换（HMR），修改代码后自动刷新

## 文件结构

```
项目根目录/
├── index.html          # 主 HTML 文件
├── test/
│   └── main.ts         # 测试文件（TypeScript），直接导入 src/index.ts
├── src/
│   ├── index.ts        # 主入口文件（TypeScript）
│   └── lib/            # 库文件（TypeScript）
│       ├── buffer.ts
│       ├── formatVorbisComment.ts
│       └── imageUtils.ts
└── vite.config.ts      # Vite 配置文件
```

## 工作原理

### 开发模式（`npm run dev`）

1. Vite 启动开发服务器
2. `index.html` 加载 `test/main.ts`
3. `test/main.ts` 直接导入 `src/index.ts`
4. Vite 自动转换 TypeScript 为 JavaScript
5. 浏览器加载转换后的代码，支持 sourcemap 调试

### 构建模式（`npm run build`）

1. Vite 使用库模式构建
2. 从 `src/index.ts` 构建 ES 模块和 UMD 格式
3. 输出到 `dist/` 目录

## 调试技巧

### 1. 浏览器 DevTools

- 打开浏览器 DevTools（F12）
- 在 Sources 面板中可以看到 TypeScript 源文件
- 可以直接在 TypeScript 源文件中设置断点
- 支持 TypeScript 的类型检查和错误提示

### 2. 控制台调试

- 在 `test/main.ts` 中使用 `console.log()` 输出调试信息
- 在 `src/index.ts` 中使用 `console.log()` 输出调试信息
- 所有日志都会显示在浏览器控制台中

### 3. 热模块替换（HMR）

- 修改 TypeScript 源文件后，Vite 会自动更新
- 无需手动刷新页面
- 保持应用状态（在某些情况下）

## 测试 API

### 文件加载

1. 点击"选择 FLAC 文件"按钮
2. 选择要测试的 FLAC 文件
3. 文件加载后，会自动显示文件信息、标签和图片

### 标签管理

- **设置标签**：在输入框中输入 `NAME=VALUE` 格式的标签，点击"设置标签"
- **获取标签**：输入标签名称，点击"获取标签"
- **删除标签**：输入标签名称，点击"删除所有匹配标签"或"删除第一个匹配标签"
- **导入标签**：在文本框中输入多个标签（每行一个），点击"导入标签"
- **导出标签**：点击"导出标签"按钮

### 图片管理

- **添加图片**：点击"添加图片"按钮，选择 JPEG 或 PNG 图片
- **查看图片**：图片会自动显示在图片列表中
- **导出图片**：点击图片下方的"导出"按钮

### 保存文件

- **保存为 Blob**：点击"保存为 Blob"按钮
- **保存为 ArrayBuffer**：点击"保存为 ArrayBuffer"按钮
- **保存为 Buffer**：点击"保存为 Buffer"按钮
- **下载文件**：点击"下载修改后的文件"按钮

## 常见问题

### 1. 模块加载失败

如果遇到模块加载失败的错误：

1. 确保已运行 `npm install` 安装依赖
2. 确保开发服务器正在运行（`npm run dev`）
3. 检查浏览器控制台的错误信息

### 2. TypeScript 类型错误

如果遇到 TypeScript 类型错误：

1. 运行 `npm run type-check` 检查类型错误
2. 检查 `tsconfig.json` 配置
3. 确保所有导入路径正确

### 3. 热模块替换不工作

如果热模块替换不工作：

1. 检查浏览器是否支持 HMR
2. 尝试手动刷新页面
3. 检查 Vite 开发服务器的日志

## 与之前版本的区别

### 之前（CommonJS）

- 使用 `test/main.js` 加载 CommonJS 模块
- 需要手动实现 CommonJS 模块加载器
- 不支持 TypeScript 源文件调试
- 需要手动处理模块依赖

### 现在（TypeScript + Vite）

- 使用 `test/main.ts` 直接导入 TypeScript 源文件
- Vite 自动处理 TypeScript 转换
- 支持 TypeScript 源文件调试
- 自动处理模块依赖
- 支持热模块替换（HMR）
- 更好的开发体验

## 下一步

1. 修改 `src/index.ts` 中的代码
2. 在浏览器中查看更改
3. 使用浏览器 DevTools 调试代码
4. 测试所有 API 功能

