// 简单的 CommonJS 模块加载器
const modules = {};
const cache = {};

function require(moduleName) {
    if (cache[moduleName]) {
        return cache[moduleName];
    }
    if (modules[moduleName]) {
        const module = { exports: {} };
        modules[moduleName](module, module.exports, require);
        cache[moduleName] = module.exports;
        return module.exports;
    }
    throw new Error(`Module ${moduleName} not found`);
}

// 加载单个模块
async function loadModule(moduleName, modulePath) {
    try {
        const code = await fetch(modulePath).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
            return r.text();
        });
        
        // 替换 require 路径
        let modifiedCode = code;
        const requireMap = {
            "'./buffer'": "'./lib/buffer'",
            "'./lib/buffer'": "'./lib/buffer'",
            "require('./buffer')": "require('./lib/buffer')",
            "require('./lib/buffer')": "require('./lib/buffer')",
            "require('./lib/imageUtils')": "require('./lib/imageUtils')",
            "require('./lib/formatVorbisComment')": "require('./lib/formatVorbisComment')",
            "'./lib/formatVorbisComment'": "'./lib/formatVorbisComment'",
            "'./lib/imageUtils'": "'./lib/imageUtils'"
        };
        
        // 替换路径映射
        for (const [oldPath, newPath] of Object.entries(requireMap)) {
            modifiedCode = modifiedCode.replace(new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
        }
        
        // 创建一个安全的执行环境
        const moduleWrapper = new Function('module', 'exports', 'require', modifiedCode);
        
        // 注册模块
        modules[moduleName] = function(module, exports, require) {
            try {
                moduleWrapper.call(this, module, exports, require);
            } catch (error) {
                console.error(`执行模块 ${moduleName} 时出错:`, error);
                throw error;
            }
        };
        
        return true;
    } catch (error) {
        console.error(`加载模块 ${moduleName} 失败:`, error);
        throw new Error(`加载模块 ${moduleName} 失败: ${error.message}`);
    }
}

// 加载所有模块
async function loadModules() {
    try {
        log('开始加载模块...', 'info');
        
        // 1. 加载 buffer.js
        await loadModule('./lib/buffer', '../lib/buffer.js');
        log('✓ 加载 buffer.js', 'success');
        
        // 2. 加载 imageUtils.js
        await loadModule('./lib/imageUtils', '../lib/imageUtils.js');
        log('✓ 加载 imageUtils.js', 'success');
        
        // 3. 加载 formatVorbisComment.js (需要 buffer)
        await loadModule('./lib/formatVorbisComment', '../lib/formatVorbisComment.js');
        log('✓ 加载 formatVorbisComment.js', 'success');
        
        // 4. 加载 index.js (需要所有依赖)
        await loadModule('../index', '../index.js');
        log('✓ 加载 index.js', 'success');
        
        // 5. 导出 Metaflac
        window.Metaflac = require('../index');
        log('✓ 所有模块加载成功', 'success');
        updateFileStatus('ready', '模块加载成功，请选择 FLAC 文件');
    } catch (error) {
        log('✗ 模块加载失败: ' + error.message, 'error');
        updateFileStatus('error', '模块加载失败: ' + error.message);
        console.error('模块加载错误:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 全局变量
let flacInstance = null;
let currentFile = null;

// 日志函数
function log(message, type = 'info') {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    entry.textContent = `[${timestamp}] ${message}`;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function clearLog() {
    document.getElementById('log').innerHTML = '';
}

// 更新文件状态
function updateFileStatus(status, message) {
    const statusEl = document.getElementById('fileStatus');
    const alertEl = document.getElementById('fileAlert');
    statusEl.className = `status ${status}`;
    statusEl.textContent = message;
    
    if (message) {
        alertEl.innerHTML = `<div class="alert alert-${status === 'error' ? 'error' : status === 'ready' ? 'success' : 'info'}">${message}</div>`;
    } else {
        alertEl.innerHTML = '';
    }
}

// 加载文件
document.getElementById('flacFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    currentFile = file;
    document.getElementById('fileName').textContent = file.name;
    updateFileStatus('loading', '正在加载文件...');
    log(`正在加载文件: ${file.name}`, 'info');

    try {
        flacInstance = await window.Metaflac.fromFile(file);
        updateFileStatus('ready', '文件加载成功');
        log('文件加载成功', 'success');
        
        // 显示文件信息
        displayFileInfo();
        displayTags();
        displayPictures();
        
        // 显示各个区域
        document.getElementById('fileInfoSection').style.display = 'block';
        document.getElementById('tagsSection').style.display = 'block';
        document.getElementById('picturesSection').style.display = 'block';
        document.getElementById('saveSection').style.display = 'block';
    } catch (error) {
        updateFileStatus('error', '文件加载失败: ' + error.message);
        log('文件加载失败: ' + error.message, 'error');
        console.error(error);
    }
});

// 显示文件信息
function displayFileInfo() {
    if (!flacInstance) return;

    const grid = document.getElementById('fileInfoGrid');
    grid.innerHTML = `
        <div class="info-item">
            <label>采样率</label>
            <value>${flacInstance.getSampleRate()} Hz</value>
        </div>
        <div class="info-item">
            <label>声道数</label>
            <value>${flacInstance.getChannels()}</value>
        </div>
        <div class="info-item">
            <label>位深度</label>
            <value>${flacInstance.getBps()} bit</value>
        </div>
        <div class="info-item">
            <label>总采样数</label>
            <value>${flacInstance.getTotalSamples()}</value>
        </div>
        <div class="info-item">
            <label>最小块大小</label>
            <value>${flacInstance.getMinBlocksize()}</value>
        </div>
        <div class="info-item">
            <label>最大块大小</label>
            <value>${flacInstance.getMaxBlocksize()}</value>
        </div>
        <div class="info-item">
            <label>最小帧大小</label>
            <value>${flacInstance.getMinFramesize()}</value>
        </div>
        <div class="info-item">
            <label>最大帧大小</label>
            <value>${flacInstance.getMaxFramesize()}</value>
        </div>
        <div class="info-item">
            <label>MD5</label>
            <value style="font-size: 12px; word-break: break-all;">${flacInstance.getMd5sum()}</value>
        </div>
        <div class="info-item">
            <label>供应商标签</label>
            <value style="font-size: 12px;">${flacInstance.getVendorTag()}</value>
        </div>
    `;
}

// 显示标签
function displayTags() {
    if (!flacInstance) return;

    const tags = flacInstance.getAllTags();
    const tagsList = document.getElementById('tagsList');
    
    if (tags.length === 0) {
        tagsList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无标签</div>';
        return;
    }

    tagsList.innerHTML = tags.map((tag, index) => {
        const [name, ...valueParts] = tag.split('=');
        const value = valueParts.join('=');
        return `
            <div class="tag-item">
                <div>
                    <span class="tag-name">${name}</span>
                    <span class="tag-value">${value}</span>
                </div>
                <div class="tag-actions">
                    <button class="btn btn-danger" onclick="removeTagByIndex(${index})" style="padding: 4px 8px; font-size: 12px;">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

// 显示图片
function displayPictures() {
    if (!flacInstance) return;

    const specs = flacInstance.getPicturesSpecs();
    const picturesList = document.getElementById('picturesList');
    
    if (specs.length === 0) {
        picturesList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px; grid-column: 1 / -1;">暂无图片</div>';
        return;
    }

    picturesList.innerHTML = specs.map((spec, index) => {
        try {
            const pictureData = flacInstance.exportPictureToBlob(index);
            const url = URL.createObjectURL(pictureData);
            return `
                <div class="picture-item">
                    <img src="${url}" alt="Picture ${index + 1}" />
                    <div class="picture-info">
                        <div>类型: ${spec.mime}</div>
                        <div>尺寸: ${spec.width} x ${spec.height}</div>
                        <div>描述: ${spec.description || '无'}</div>
                    </div>
                    <button class="btn btn-success" onclick="testExportPicture(${index})">导出</button>
                </div>
            `;
        } catch (error) {
            return `
                <div class="picture-item">
                    <div class="picture-info">
                        <div>类型: ${spec.mime}</div>
                        <div>尺寸: ${spec.width} x ${spec.height}</div>
                        <div>描述: ${spec.description || '无'}</div>
                    </div>
                    <div style="color: red; font-size: 12px;">无法显示图片</div>
                </div>
            `;
        }
    }).join('');
}

// 测试函数 - 文件信息
window.testGetMd5sum = function() {
    try {
        const md5 = flacInstance.getMd5sum();
        log(`MD5: ${md5}`, 'success');
        alert(`MD5: ${md5}`);
    } catch (error) {
        log(`获取 MD5 失败: ${error.message}`, 'error');
    }
};

window.testGetMinBlocksize = function() {
    try {
        const size = flacInstance.getMinBlocksize();
        log(`最小块大小: ${size}`, 'success');
        alert(`最小块大小: ${size}`);
    } catch (error) {
        log(`获取最小块大小失败: ${error.message}`, 'error');
    }
};

window.testGetMaxBlocksize = function() {
    try {
        const size = flacInstance.getMaxBlocksize();
        log(`最大块大小: ${size}`, 'success');
        alert(`最大块大小: ${size}`);
    } catch (error) {
        log(`获取最大块大小失败: ${error.message}`, 'error');
    }
};

window.testGetMinFramesize = function() {
    try {
        const size = flacInstance.getMinFramesize();
        log(`最小帧大小: ${size}`, 'success');
        alert(`最小帧大小: ${size}`);
    } catch (error) {
        log(`获取最小帧大小失败: ${error.message}`, 'error');
    }
};

window.testGetMaxFramesize = function() {
    try {
        const size = flacInstance.getMaxFramesize();
        log(`最大帧大小: ${size}`, 'success');
        alert(`最大帧大小: ${size}`);
    } catch (error) {
        log(`获取最大帧大小失败: ${error.message}`, 'error');
    }
};

window.testGetSampleRate = function() {
    try {
        const rate = flacInstance.getSampleRate();
        log(`采样率: ${rate} Hz`, 'success');
        alert(`采样率: ${rate} Hz`);
    } catch (error) {
        log(`获取采样率失败: ${error.message}`, 'error');
    }
};

window.testGetChannels = function() {
    try {
        const channels = flacInstance.getChannels();
        log(`声道数: ${channels}`, 'success');
        alert(`声道数: ${channels}`);
    } catch (error) {
        log(`获取声道数失败: ${error.message}`, 'error');
    }
};

window.testGetBps = function() {
    try {
        const bps = flacInstance.getBps();
        log(`位深度: ${bps} bit`, 'success');
        alert(`位深度: ${bps} bit`);
    } catch (error) {
        log(`获取位深度失败: ${error.message}`, 'error');
    }
};

window.testGetTotalSamples = function() {
    try {
        const samples = flacInstance.getTotalSamples();
        log(`总采样数: ${samples}`, 'success');
        alert(`总采样数: ${samples}`);
    } catch (error) {
        log(`获取总采样数失败: ${error.message}`, 'error');
    }
};

window.testGetVendorTag = function() {
    try {
        const vendor = flacInstance.getVendorTag();
        log(`供应商标签: ${vendor}`, 'success');
        alert(`供应商标签: ${vendor}`);
    } catch (error) {
        log(`获取供应商标签失败: ${error.message}`, 'error');
    }
};

// 测试函数 - 标签管理
window.testSetTag = function() {
    try {
        const tagInput = document.getElementById('tagInput');
        const tag = tagInput.value.trim();
        if (!tag) {
            alert('请输入标签 (格式: NAME=VALUE)');
            return;
        }
        flacInstance.setTag(tag);
        log(`设置标签: ${tag}`, 'success');
        tagInput.value = '';
        displayTags();
    } catch (error) {
        log(`设置标签失败: ${error.message}`, 'error');
        alert(`设置标签失败: ${error.message}`);
    }
};

window.testGetTag = function() {
    try {
        const tagName = document.getElementById('tagNameInput').value.trim();
        if (!tagName) {
            alert('请输入标签名称');
            return;
        }
        const tag = flacInstance.getTag(tagName);
        log(`获取标签 ${tagName}: ${tag || '未找到'}`, tag ? 'success' : 'info');
        alert(tag || '未找到该标签');
    } catch (error) {
        log(`获取标签失败: ${error.message}`, 'error');
    }
};

window.testRemoveTag = function() {
    try {
        const tagName = document.getElementById('tagNameInput').value.trim();
        if (!tagName) {
            alert('请输入标签名称');
            return;
        }
        flacInstance.removeTag(tagName);
        log(`删除所有 ${tagName} 标签`, 'success');
        displayTags();
    } catch (error) {
        log(`删除标签失败: ${error.message}`, 'error');
    }
};

window.testRemoveFirstTag = function() {
    try {
        const tagName = document.getElementById('tagNameInput').value.trim();
        if (!tagName) {
            alert('请输入标签名称');
            return;
        }
        flacInstance.removeFirstTag(tagName);
        log(`删除第一个 ${tagName} 标签`, 'success');
        displayTags();
    } catch (error) {
        log(`删除标签失败: ${error.message}`, 'error');
    }
};

window.testRemoveAllTags = function() {
    if (!confirm('确定要删除所有标签吗？')) return;
    try {
        flacInstance.removeAllTags();
        log('删除所有标签', 'success');
        displayTags();
    } catch (error) {
        log(`删除所有标签失败: ${error.message}`, 'error');
    }
};

window.testGetAllTags = function() {
    try {
        const tags = flacInstance.getAllTags();
        log(`获取所有标签: ${tags.length} 个`, 'success');
        console.log('所有标签:', tags);
    } catch (error) {
        log(`获取所有标签失败: ${error.message}`, 'error');
    }
};

window.testImportTags = function() {
    try {
        const tagsText = document.getElementById('tagsTextarea').value.trim();
        if (!tagsText) {
            alert('请输入标签 (每行一个，格式: NAME=VALUE)');
            return;
        }
        flacInstance.importTagsFromString(tagsText);
        log(`导入标签: ${tagsText.split('\n').length} 个`, 'success');
        document.getElementById('tagsTextarea').value = '';
        displayTags();
    } catch (error) {
        log(`导入标签失败: ${error.message}`, 'error');
        alert(`导入标签失败: ${error.message}`);
    }
};

window.testExportTags = function() {
    try {
        const tags = flacInstance.exportTagsToString();
        log('导出标签', 'success');
        alert(tags || '暂无标签');
    } catch (error) {
        log(`导出标签失败: ${error.message}`, 'error');
    }
};

window.removeTagByIndex = function(index) {
    try {
        const tags = flacInstance.getAllTags();
        const tag = tags[index];
        const tagName = tag.split('=')[0];
        flacInstance.removeFirstTag(tagName);
        log(`删除标签: ${tag}`, 'success');
        displayTags();
    } catch (error) {
        log(`删除标签失败: ${error.message}`, 'error');
    }
};

// 测试函数 - 图片管理
document.getElementById('pictureFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        await flacInstance.importPictureFromFile(file);
        log(`导入图片: ${file.name}`, 'success');
        displayPictures();
    } catch (error) {
        log(`导入图片失败: ${error.message}`, 'error');
        alert(`导入图片失败: ${error.message}`);
    }
});

window.testGetPicturesSpecs = function() {
    try {
        const specs = flacInstance.getPicturesSpecs();
        log(`获取图片规格: ${specs.length} 张`, 'success');
        console.log('图片规格:', specs);
    } catch (error) {
        log(`获取图片规格失败: ${error.message}`, 'error');
    }
};

window.testExportPicture = function(index) {
    try {
        const blob = flacInstance.exportPictureToBlob(index);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `picture-${index + 1}.${blob.type.split('/')[1]}`;
        a.click();
        URL.revokeObjectURL(url);
        log(`导出图片 ${index + 1}`, 'success');
    } catch (error) {
        log(`导出图片失败: ${error.message}`, 'error');
        alert(`导出图片失败: ${error.message}`);
    }
};

// 测试函数 - 保存
window.testSaveAsBlob = function() {
    try {
        const blob = flacInstance.saveAsBlob();
        log(`保存为 Blob: ${blob.size} 字节`, 'success');
        console.log('Blob:', blob);
    } catch (error) {
        log(`保存为 Blob 失败: ${error.message}`, 'error');
    }
};

window.testSaveAsArrayBuffer = function() {
    try {
        const arrayBuffer = flacInstance.save();
        log(`保存为 ArrayBuffer: ${arrayBuffer.byteLength} 字节`, 'success');
        console.log('ArrayBuffer:', arrayBuffer);
    } catch (error) {
        log(`保存为 ArrayBuffer 失败: ${error.message}`, 'error');
    }
};

window.testSaveAsBuffer = function() {
    try {
        const buffer = flacInstance.saveAsBuffer();
        log(`保存为 Buffer: ${buffer.length} 字节`, 'success');
        console.log('Buffer:', buffer);
    } catch (error) {
        log(`保存为 Buffer 失败: ${error.message}`, 'error');
    }
};

window.testDownload = function() {
    try {
        const blob = flacInstance.saveAsBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile ? `modified-${currentFile.name}` : 'modified.flac';
        a.click();
        URL.revokeObjectURL(url);
        log('下载文件', 'success');
    } catch (error) {
        log(`下载文件失败: ${error.message}`, 'error');
        alert(`下载文件失败: ${error.message}`);
    }
};

// 初始化
loadModules();

