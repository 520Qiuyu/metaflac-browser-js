# 浏览器使用指南

这个工具已经改造为可以在浏览器中运行。以下是使用方法：

## 基本使用

### 从 File 对象创建（推荐）

```javascript
const Metaflac = require('./index');

// 从文件输入框获取文件
const fileInput = document.querySelector('#fileInput');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            // 从 File 对象创建 Metaflac 实例（异步）
            const flac = await Metaflac.fromFile(file);
            
            // 获取标签
            console.log('Title:', flac.getTag('TITLE'));
            console.log('Artist:', flac.getTag('ARTIST'));
            
            // 设置标签
            flac.setTag('TITLE=New Title');
            flac.setTag('ARTIST=New Artist');
            
            // 保存为 Blob
            const modifiedBlob = flac.saveAsBlob();
            
            // 创建下载链接
            const url = URL.createObjectURL(modifiedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'modified.flac';
            a.click();
        } catch (error) {
            console.error('Error:', error);
        }
    }
});
```

### 从 ArrayBuffer 创建

```javascript
// 使用 fetch 获取文件
fetch('path/to/file.flac')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        const flac = Metaflac.fromArrayBuffer(arrayBuffer);
        
        // 使用 flac 对象
        console.log('Sample Rate:', flac.getSampleRate());
        console.log('Channels:', flac.getChannels());
        
        // 保存修改
        const modifiedBuffer = flac.save();
        // modifiedBuffer 是一个 ArrayBuffer
    });
```

### 从 Uint8Array 创建

```javascript
const uint8Array = new Uint8Array(/* ... */);
const flac = Metaflac.fromUint8Array(uint8Array);
```

## API 方法

### 静态方法

- `Metaflac.fromFile(file)` - 从 File 对象创建（异步，返回 Promise）
- `Metaflac.fromBlob(blob)` - 从 Blob 对象创建（异步，返回 Promise）
- `Metaflac.fromArrayBuffer(arrayBuffer)` - 从 ArrayBuffer 创建
- `Metaflac.fromUint8Array(uint8Array)` - 从 Uint8Array 创建

### 实例方法

#### 获取信息

- `getMd5sum()` - 获取 MD5 签名
- `getMinBlocksize()` - 获取最小块大小
- `getMaxBlocksize()` - 获取最大块大小
- `getSampleRate()` - 获取采样率
- `getChannels()` - 获取声道数
- `getBps()` - 获取位深度
- `getTotalSamples()` - 获取总采样数
- `getVendorTag()` - 获取供应商标签
- `getTag(name)` - 获取指定标签
- `getAllTags()` - 获取所有标签

#### 修改标签

- `setTag(field)` - 设置标签（格式：'NAME=VALUE'）
- `removeTag(name)` - 移除所有指定名称的标签
- `removeFirstTag(name)` - 移除第一个指定名称的标签
- `removeAllTags()` - 移除所有标签
- `importTagsFromString(tagsString)` - 从字符串导入标签（每行一个标签）

#### 导出标签

- `exportTagsToString()` - 导出标签为字符串

#### 图片操作

- `importPictureFromBuffer(picture)` - 从 Buffer 导入图片
- `importPictureFromFile(file)` - 从 File 导入图片（异步）
- `exportPictureToBlob(index)` - 导出图片为 Blob
- `exportPictureToArrayBuffer(index)` - 导出图片为 ArrayBuffer
- `getPicturesSpecs()` - 获取所有图片规格
- `removePicture(index)` - 删除指定索引的图片
- `removeAllPictures()` - 删除所有图片

#### 保存

- `save()` - 保存为 ArrayBuffer
- `saveAsBlob()` - 保存为 Blob
- `saveAsBuffer()` - 保存为 BrowserBuffer

## 完整示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>Metaflac Browser Example</title>
</head>
<body>
    <input type="file" id="fileInput" accept=".flac">
    <button id="downloadBtn" disabled>下载修改后的文件</button>
    <div id="info"></div>

    <script type="module">
        import Metaflac from './index.js';

        let flacInstance = null;
        const fileInput = document.querySelector('#fileInput');
        const downloadBtn = document.querySelector('#downloadBtn');
        const infoDiv = document.querySelector('#info');

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    flacInstance = await Metaflac.fromFile(file);
                    
                    // 显示信息
                    infoDiv.innerHTML = `
                        <p>采样率: ${flacInstance.getSampleRate()} Hz</p>
                        <p>声道数: ${flacInstance.getChannels()}</p>
                        <p>位深度: ${flacInstance.getBps()} bit</p>
                        <p>标题: ${flacInstance.getTag('TITLE') || '无'}</p>
                        <p>艺术家: ${flacInstance.getTag('ARTIST') || '无'}</p>
                    `;
                    
                    downloadBtn.disabled = false;
                } catch (error) {
                    console.error('Error:', error);
                    infoDiv.innerHTML = `<p style="color: red;">错误: ${error.message}</p>`;
                }
            }
        });

        downloadBtn.addEventListener('click', () => {
            if (flacInstance) {
                // 修改标签
                flacInstance.setTag('TITLE=Modified Title');
                
                // 保存为 Blob
                const blob = flacInstance.saveAsBlob();
                
                // 创建下载链接
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'modified.flac';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    </script>
</body>
</html>
```

## 注意事项

1. **异步操作**：从 File 或 Blob 创建 Metaflac 实例是异步的，需要使用 `await` 或 `.then()`
2. **浏览器兼容性**：需要支持 File API、Blob API 和 ArrayBuffer
3. **内存使用**：大文件会占用较多内存，请谨慎处理
4. **文件类型**：目前只支持 JPEG 和 PNG 图片格式

## 与 Node.js 版本的差异

- 移除了文件系统操作（`setTagFromFile`, `importTagsFrom`, `exportTagsTo`, `importPictureFrom`, `exportPictureTo`）
- 添加了浏览器兼容的方法（`fromFile`, `fromBlob`, `saveAsBlob`）
- 所有文件操作都使用 Blob 或 ArrayBuffer
- 构造函数不再接受文件路径字符串

