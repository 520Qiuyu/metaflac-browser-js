# 发布 npm 包指南

## 准备工作

### 1. 检查 package.json

确保以下配置正确：
- ✅ 包名：`metaflac-browser-js`
- ✅ 版本号：`1.0.0`
- ✅ 描述：浏览器专用
- ✅ 文件列表：`index.js`, `lib/`, `README.md`
- ✅ 无 Node.js 依赖（已移除 commander）

### 2. 检查 .npmignore

确保以下文件被排除：
- ✅ 测试文件（test/）
- ✅ 开发文件（cli.js, PUBLISH_GUIDE.md 等）
- ✅ 依赖文件（node_modules/）

### 3. 检查代码

确保代码为浏览器版本：
- ✅ 无 Node.js 特定 API（fs, path 等）
- ✅ 支持浏览器 API（File, Blob, ArrayBuffer）
- ✅ 所有依赖都在 lib/ 目录中

## 发布步骤

### 步骤 1：登录 npm

```bash
npm login
```

如果没有账号，先注册：
```bash
npm adduser
```

### 步骤 2：检查发布内容

```bash
# 查看将要发布哪些文件
npm pack --dry-run
```

应该只包含：
- `package.json`
- `index.js`
- `lib/` 目录（buffer.js, formatVorbisComment.js, imageUtils.js）
- `README.md`

### 步骤 3：发布到 npm

```bash
# 发布到 npm
npm publish
```

如果是首次发布且包名包含 scope（如 @username/package-name），需要添加 `--access public`：

```bash
npm publish --access public
```

### 步骤 4：验证发布

```bash
# 检查包是否已发布
npm view metaflac-browser-js

# 测试安装（在新目录中）
mkdir test-install
cd test-install
npm install metaflac-browser-js
```

## 更新版本

发布后如果需要更新，使用以下命令：

```bash
# 更新补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 更新次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 更新主要版本 (1.0.0 -> 2.0.0)
npm version major

# 然后发布
npm publish
```

## 使用说明

发布后，用户可以通过以下方式安装和使用：

### 安装

```bash
npm install metaflac-browser-js
```

### 使用（需要打包工具）

由于代码使用 CommonJS 模块，需要使用打包工具（webpack, rollup, vite 等）才能在浏览器中使用：

```javascript
// 使用 webpack, rollup, vite 等
import Metaflac from 'metaflac-browser-js';

// 或
const Metaflac = require('metaflac-browser-js');
```

### 示例

```javascript
// 从 File 对象创建
const fileInput = document.querySelector('#fileInput');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const flac = await Metaflac.fromFile(file);
    
    // 读取信息
    console.log('采样率:', flac.getSampleRate());
    
    // 设置标签
    flac.setTag('TITLE=我的音乐');
    
    // 保存
    const blob = flac.saveAsBlob();
});
```

## 注意事项

1. **浏览器专用**
   - 此包仅用于浏览器环境
   - 不包含 Node.js 支持
   - 不包含 CLI 工具

2. **打包工具**
   - 需要使用打包工具（webpack, rollup, vite 等）
   - 直接使用 CommonJS 需要模块加载器

3. **无依赖**
   - 完全使用浏览器原生 API
   - 无外部依赖

4. **版本管理**
   - 遵循语义化版本规范
   - 不要降低版本号

## 发布清单

发布前请确认：

- [ ] package.json 已更新
- [ ] README.md 已更新（中文）
- [ ] .npmignore 已配置
- [ ] 代码已测试
- [ ] 版本号已更新
- [ ] 已登录 npm
- [ ] 已检查发布内容（npm pack --dry-run）
- [ ] 已发布到 npm
- [ ] 已创建 Git Tag
- [ ] 已更新 GitHub Release（可选）

## 常见问题

### 1. 发布失败：包名已存在

如果包名已被占用，需要：
- 更改包名
- 或使用 scope（如 @yourname/metaflac-browser-js）

### 2. 发布失败：需要登录

```bash
npm login
```

### 3. 如何撤销发布

24 小时内可以撤销：
```bash
npm unpublish metaflac-browser-js@1.0.0
```

### 4. 如何在浏览器中使用

需要使用打包工具：
- Webpack
- Rollup
- Vite
- Browserify
- 或其他支持 CommonJS 的打包工具

## 发布命令汇总

```bash
# 1. 登录
npm login

# 2. 检查发布内容
npm pack --dry-run

# 3. 发布
npm publish

# 4. 验证
npm view metaflac-browser-js
```

## 更新版本命令

```bash
# 更新版本号并发布
npm version patch && npm publish
npm version minor && npm publish
npm version major && npm publish
```
