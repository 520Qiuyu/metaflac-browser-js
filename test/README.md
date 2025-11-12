# 测试页面使用说明

## 方法一：使用构建工具（推荐）

由于浏览器不支持直接加载 CommonJS 模块，需要使用构建工具（如 browserify 或 webpack）打包代码。

### 使用 Browserify

1. 安装 browserify：
```bash
npm install -g browserify
```

2. 打包代码：
```bash
browserify index.js -o test/bundle.js
```

3. 在 HTML 中引入：
```html
<script src="bundle.js"></script>
```

### 使用 Webpack

1. 安装 webpack：
```bash
npm install --save-dev webpack webpack-cli
```

2. 创建 webpack.config.js：
```javascript
module.exports = {
    entry: './index.js',
    output: {
        filename: 'test/bundle.js',
        library: 'Metaflac',
        libraryTarget: 'umd'
    },
    mode: 'production'
};
```

3. 打包：
```bash
npx webpack
```

4. 在 HTML 中引入：
```html
<script src="bundle.js"></script>
<script>
    // 使用 Metaflac
    const flac = await Metaflac.fromFile(file);
</script>
```

## 方法二：使用简单的模块加载器（实验性）

test/index.html 包含一个简单的 CommonJS 模块加载器，但可能不够稳定。如果遇到问题，请使用方法一。

## 方法三：使用 ES6 模块（需要修改代码）

将代码转换为 ES6 模块格式，然后直接在浏览器中使用。

## 测试步骤

1. 打开 test/index.html
2. 选择一个 FLAC 文件
3. 测试各种 API 功能：
   - 文件信息读取
   - 标签管理
   - 图片管理
   - 文件保存

## 注意事项

- 确保使用现代浏览器（支持 File API、Blob API、ArrayBuffer）
- 如果模块加载失败，请检查浏览器控制台的错误信息
- 建议使用本地服务器（如 http-server）而不是直接打开文件

## 启动本地服务器

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx http-server

# 使用 PHP
php -S localhost:8000
```

然后访问 http://localhost:8000/test/index.html

