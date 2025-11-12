# metaflac-browser-js

一个纯 JavaScript 实现的 metaflac（官方 FLAC 工具）浏览器版本。

> 这是一个专为浏览器设计的工具，用于操作 FLAC 元数据。完全在浏览器中运行，无需 Node.js 依赖。

## 安装

```bash
npm install metaflac-browser-js
```

## 使用方法

> **重要提示**：此包使用 CommonJS 模块格式，需要通过打包工具（webpack、rollup、vite 等）才能在浏览器中使用 ES6 `import` 语法。

### 方式一：使用 ES6 import（推荐，需要打包工具）

在使用 webpack、rollup、vite 等打包工具的项目中：

```javascript
import Metaflac from 'metaflac-browser-js';

// 从 File 对象创建（异步）
const fileInput = document.querySelector('#fileInput');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        // 从 File 创建 Metaflac 实例
        const flac = await Metaflac.fromFile(file);
        
        // 读取信息
        console.log('采样率:', flac.getSampleRate());
        console.log('声道数:', flac.getChannels());
        console.log('标题:', flac.getTag('TITLE'));
        
        // 设置标签
        flac.setTag('TITLE=我的音乐');
        flac.setTag('ARTIST=我的艺术家');
        
        // 保存为 Blob
        const modifiedBlob = flac.saveAsBlob();
        
        // 下载文件
        const url = URL.createObjectURL(modifiedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modified.flac';
        a.click();
    }
});
```

### 方式二：使用 require（需要打包工具支持 CommonJS）

```javascript
const Metaflac = require('metaflac-browser-js');

// 从 ArrayBuffer 创建
fetch('path/to/file.flac')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        const flac = Metaflac.fromArrayBuffer(arrayBuffer);
        
        // 使用 flac 对象
        console.log('采样率:', flac.getSampleRate());
        console.log('标题:', flac.getTag('TITLE'));
        
        // 设置标签
        flac.setTag('TITLE=新标题');
        
        // 保存修改
        const modifiedBuffer = flac.save();
        // modifiedBuffer 是一个 ArrayBuffer
    });
```

### 支持的打包工具

- ✅ **Webpack** - 自动支持 CommonJS 到 ES6 的转换
- ✅ **Rollup** - 自动支持 CommonJS 到 ES6 的转换
- ✅ **Vite** - 自动支持 CommonJS 到 ES6 的转换
- ✅ **Browserify** - 原生支持 CommonJS
- ✅ **Parcel** - 自动支持 CommonJS 到 ES6 的转换

### 使用示例（Vite 项目）

```bash
# 1. 创建 Vite 项目
npm create vite@latest my-app -- --template vanilla

# 2. 安装依赖
cd my-app
npm install
npm install metaflac-browser-js

# 3. 在代码中使用
```

```javascript
// main.js
import Metaflac from 'metaflac-browser-js';

const fileInput = document.querySelector('#fileInput');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const flac = await Metaflac.fromFile(file);
    console.log('采样率:', flac.getSampleRate());
});
```

### 使用示例（Webpack 项目）

```bash
# 1. 安装依赖
npm install metaflac-browser-js

# 2. 在代码中使用
```

```javascript
// app.js
import Metaflac from 'metaflac-browser-js';

// Webpack 会自动处理 CommonJS 模块
const flac = await Metaflac.fromFile(file);
```

## API

### 静态方法

- `Metaflac.fromFile(file)` - 从 File 对象创建（异步）
- `Metaflac.fromBlob(blob)` - 从 Blob 对象创建（异步）
- `Metaflac.fromArrayBuffer(arrayBuffer)` - 从 ArrayBuffer 创建
- `Metaflac.fromUint8Array(uint8Array)` - 从 Uint8Array 创建

### 构造函数

```javascript
// ArrayBuffer, Uint8Array 或 BrowserBuffer
const flac = new Metaflac(arrayBuffer);
```

### 实例方法

#### 文件信息

- `getMd5sum()` - 获取 MD5 签名
- `getMinBlocksize()` - 获取最小块大小
- `getMaxBlocksize()` - 获取最大块大小
- `getSampleRate()` - 获取采样率
- `getChannels()` - 获取声道数
- `getBps()` - 获取位深度
- `getTotalSamples()` - 获取总采样数
- `getVendorTag()` - 获取供应商标签
- `getTag(name)` - 根据名称获取标签
- `getAllTags()` - 获取所有标签

#### 标签管理

- `setTag(field)` - 设置标签（格式：'NAME=VALUE'）
- `removeTag(name)` - 删除所有指定名称的标签
- `removeFirstTag(name)` - 删除第一个指定名称的标签
- `removeAllTags()` - 删除所有标签
- `importTagsFromString(tagsString)` - 从字符串导入标签
- `exportTagsToString()` - 导出标签为字符串

#### 图片管理

- `importPictureFromBuffer(picture)` - 从缓冲区导入图片
- `importPictureFromFile(file)` - 从 File/Blob 导入图片（异步）
- `exportPictureToBlob(index)` - 导出图片为 Blob
- `exportPictureToArrayBuffer(index)` - 导出图片为 ArrayBuffer
- `getPicturesSpecs()` - 获取所有图片规格

#### 保存

- `save()` - 保存为 ArrayBuffer
- `saveAsBlob()` - 保存为 Blob
- `saveAsBuffer()` - 保存为 BrowserBuffer

## 浏览器兼容性

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- 支持 File API 的现代浏览器

## 完整示例

查看 [test/index.html](test/index.html) 获取完整的浏览器示例。

## 注意事项

1. **浏览器专用**：此包仅用于浏览器环境，不支持 Node.js
2. **打包工具必需**：必须使用 webpack、rollup、vite 等打包工具才能使用 `import` 语法
3. **CommonJS 格式**：代码使用 CommonJS 格式（`module.exports`），打包工具会自动转换为 ES6 模块
4. **异步操作**：从 File 或 Blob 创建实例是异步的，需要使用 `await` 或 `.then()`
5. **图片格式**：目前支持 JPEG 和 PNG 格式

## 常见问题

### Q: 可以直接在浏览器中使用 `import` 吗？

A: **不可以**。需要使用打包工具（webpack、rollup、vite 等）将 CommonJS 模块转换为浏览器可用的格式。

### Q: 支持 ES6 模块吗？

A: 代码使用 CommonJS 格式，但现代打包工具（webpack 4+、rollup、vite）可以自动处理 CommonJS 到 ES6 的转换，所以可以使用 `import` 语法。

### Q: 如何在项目中使用？

A: 1. 安装包：`npm install metaflac-browser-js`
   2. 在代码中使用：`import Metaflac from 'metaflac-browser-js'`
   3. 使用打包工具打包项目

### Q: 支持哪些打包工具？

A: 支持所有主流的打包工具：

- Webpack (4+)
- Rollup
- Vite
- Browserify
- Parcel
- 以及其他支持 CommonJS 的打包工具

## 许可证

ISC

## 贡献

欢迎贡献！请随时提交 Pull Request。

## 参考

- [FLAC 格式规范](https://xiph.org/flac/documentation_format_overview.html)
- [官方 metaflac 文档](https://xiph.org/flac/documentation_tools_metaflac.html)
