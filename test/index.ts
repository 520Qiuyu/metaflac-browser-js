import Metaflac from '../src/index.ts';

// 声明全局变量类型
declare global {
  interface Window {
    Metaflac: typeof Metaflac;
    flacInstance: Metaflac | null;
    currentFile: File | null;
  }
}

// 将 Metaflac 暴露到全局
window.Metaflac = Metaflac;

// 全局变量
let flacInstance: Metaflac | null = null;
let currentFile: File | null = null;
// 存储图片 URL，用于后续清理
let pictureUrls: string[] = [];

window.flacInstance = flacInstance;
window.currentFile = currentFile;

/**
 * 日志函数
 */
function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const logElement = document.getElementById('log');
  if (!logElement) return;

  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logElement.appendChild(logEntry);
  logElement.scrollTop = logElement.scrollHeight;
}

/**
 * 更新文件状态
 */
function updateFileStatus(status: 'ready' | 'loading' | 'error', message: string): void {
  const statusElement = document.getElementById('fileStatus');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = `status status-${status}`;
  }
}

/**
 * 清空日志
 */
(window as any).clearLog = function (): void {
  const logElement = document.getElementById('log');
  if (logElement) {
    logElement.innerHTML = '';
  }
};

// 文件加载
document.addEventListener('DOMContentLoaded', () => {
  log('页面加载完成', 'info');
  log('Metaflac 模块已加载', 'success');
  updateFileStatus('ready', '请选择 FLAC 文件');

  const fileInput = document.getElementById('flacFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      currentFile = file;
      window.currentFile = currentFile;

      const fileNameElement = document.getElementById('fileName');
      if (fileNameElement) {
        fileNameElement.textContent = file.name;
      }

      updateFileStatus('loading', '正在加载文件...');
      log(`正在加载文件: ${file.name}`, 'info');

      try {
        flacInstance = await Metaflac.fromFile(file);
        window.flacInstance = flacInstance;

        log('文件加载成功', 'success');
        updateFileStatus('ready', '文件已加载');

        // 显示文件信息
        displayFileInfo();
        displayTags();
        displayPictures();

        // 显示所有区域
        const fileInfoSection = document.getElementById('fileInfoSection');
        const tagsSection = document.getElementById('tagsSection');
        const picturesSection = document.getElementById('picturesSection');
        const saveSection = document.getElementById('saveSection');

        if (fileInfoSection) fileInfoSection.style.display = 'block';
        if (tagsSection) tagsSection.style.display = 'block';
        if (picturesSection) picturesSection.style.display = 'block';
        if (saveSection) saveSection.style.display = 'block';
      } catch (error) {
        log(`文件加载失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        updateFileStatus('error', '文件加载失败');
        console.error('文件加载错误:', error);
      }
    });
  }

  // 图片文件输入
  const pictureFileInput = document.getElementById('pictureFileInput') as HTMLInputElement;
  if (pictureFileInput) {
    pictureFileInput.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file || !flacInstance) return;

      try {
        await flacInstance.importPictureFromFile(file);
        log(`图片导入成功: ${file.name}`, 'success');
        displayPictures();
      } catch (error) {
        log(`图片导入失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
        console.error('图片导入错误:', error);
      }
    });
  }

  // 页面卸载时清理图片 URL，避免内存泄漏
  window.addEventListener('beforeunload', () => {
    pictureUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    pictureUrls = [];
  });
});

/**
 * 显示文件信息
 */
function displayFileInfo(): void {
  if (!flacInstance) return;

  const fileInfoGrid = document.getElementById('fileInfoGrid');
  if (!fileInfoGrid) return;

  try {
    const info = [
      { label: '采样率', value: `${flacInstance.getSampleRate()} Hz` },
      { label: '声道数', value: `${flacInstance.getChannels()}` },
      { label: '位深度', value: `${flacInstance.getBps()} bit` },
      { label: '总采样数', value: `${flacInstance.getTotalSamples().toLocaleString()}` },
      { label: '最小块大小', value: `${flacInstance.getMinBlocksize()}` },
      { label: '最大块大小', value: `${flacInstance.getMaxBlocksize()}` },
      { label: '最小帧大小', value: `${flacInstance.getMinFramesize()}` },
      { label: '最大帧大小', value: `${flacInstance.getMaxFramesize()}` },
      { label: 'MD5', value: flacInstance.getMd5sum() },
      { label: '供应商', value: flacInstance.getVendorTag() },
    ];

    fileInfoGrid.innerHTML = info
      .map((item) => `<div class="info-item"><span class="info-label">${item.label}:</span><span class="info-value">${item.value}</span></div>`)
      .join('');
  } catch (error) {
    log(`获取文件信息失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

/**
 * 显示标签
 */
function displayTags(): void {
  if (!flacInstance) return;

  const tagsList = document.getElementById('tagsList');
  if (!tagsList) return;

  try {
    const tags = flacInstance.getAllTags();
    if (tags.length === 0) {
      tagsList.innerHTML = '<p class="empty">暂无标签</p>';
      return;
    }

    tagsList.innerHTML = tags
      .map((tag) => {
        const [name, value] = tag.split('=');
        return `<div class="tag-item"><span class="tag-name">${name}:</span><span class="tag-value">${value}</span></div>`;
      })
      .join('');
  } catch (error) {
    log(`获取标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

/**
 * 显示图片
 */
function displayPictures(): void {
  if (!flacInstance) return;

  const picturesList = document.getElementById('picturesList');
  if (!picturesList) return;

  try {
    // 清理之前创建的 URL
    pictureUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    pictureUrls = [];

    const specs = flacInstance.getPicturesSpecs();
    if (specs.length === 0) {
      picturesList.innerHTML = '<p class="empty">暂无图片</p>';
      return;
    }

    // 为每张图片创建 Blob URL 并显示
    picturesList.innerHTML = specs
      .map((spec, index) => {
        try {
          // 获取图片 Blob
          const blob = flacInstance!.exportPictureToBlob(index);
          // 创建 Blob URL
          const url = URL.createObjectURL(blob);
          // 存储 URL 以便后续清理
          pictureUrls.push(url);
          // 返回 HTML 字符串
          return `<div class="picture-item">
            <img src="${url}" alt="图片 ${index + 1}" />
            <div class="picture-info">
              <span class="picture-index">图片 ${index + 1}</span>
              <span class="picture-type">${spec.mime}</span>
              <span class="picture-size">${spec.width}x${spec.height}</span>
            </div>
          </div>`;
        } catch (error) {
          // 如果获取图片失败，只显示信息
          return `<div class="picture-item">
            <div class="picture-info">
              <span class="picture-index">图片 ${index + 1}</span>
              <span class="picture-type">${spec.mime}</span>
              <span class="picture-size">${spec.width}x${spec.height}</span>
              <span class="picture-error">加载失败</span>
            </div>
          </div>`;
        }
      })
      .join('');
  } catch (error) {
    log(`获取图片信息失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

// 测试函数
(window as any).testGetMd5sum = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const md5 = flacInstance.getMd5sum();
    log(`MD5: ${md5}`, 'success');
  } catch (error) {
    log(`获取 MD5 失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetMinBlocksize = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const size = flacInstance.getMinBlocksize();
    log(`最小块大小: ${size}`, 'success');
  } catch (error) {
    log(`获取最小块大小失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetMaxBlocksize = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const size = flacInstance.getMaxBlocksize();
    log(`最大块大小: ${size}`, 'success');
  } catch (error) {
    log(`获取最大块大小失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetMinFramesize = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const size = flacInstance.getMinFramesize();
    log(`最小帧大小: ${size}`, 'success');
  } catch (error) {
    log(`获取最小帧大小失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetMaxFramesize = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const size = flacInstance.getMaxFramesize();
    log(`最大帧大小: ${size}`, 'success');
  } catch (error) {
    log(`获取最大帧大小失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetSampleRate = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const rate = flacInstance.getSampleRate();
    log(`采样率: ${rate} Hz`, 'success');
  } catch (error) {
    log(`获取采样率失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetChannels = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const channels = flacInstance.getChannels();
    log(`声道数: ${channels}`, 'success');
  } catch (error) {
    log(`获取声道数失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetBps = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const bps = flacInstance.getBps();
    log(`位深度: ${bps} bit`, 'success');
  } catch (error) {
    log(`获取位深度失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetTotalSamples = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const samples = flacInstance.getTotalSamples();
    log(`总采样数: ${samples.toLocaleString()}`, 'success');
  } catch (error) {
    log(`获取总采样数失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetVendorTag = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const vendor = flacInstance.getVendorTag();
    log(`供应商标签: ${vendor}`, 'success');
  } catch (error) {
    log(`获取供应商标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testSetTag = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  const tagInput = document.getElementById('tagInput') as HTMLInputElement;
  if (!tagInput || !tagInput.value) {
    log('请输入标签（格式: NAME=VALUE）', 'warning');
    return;
  }
  try {
    flacInstance.setTag(tagInput.value);
    log(`设置标签成功: ${tagInput.value}`, 'success');
    tagInput.value = '';
    displayTags();
  } catch (error) {
    log(`设置标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetTag = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  const tagNameInput = document.getElementById('tagNameInput') as HTMLInputElement;
  if (!tagNameInput || !tagNameInput.value) {
    log('请输入标签名称', 'warning');
    return;
  }
  try {
    const tag = flacInstance.getTag(tagNameInput.value);
    if (tag) {
      log(`标签 ${tagNameInput.value}: ${tag}`, 'success');
    } else {
      log(`未找到标签: ${tagNameInput.value}`, 'warning');
    }
  } catch (error) {
    log(`获取标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testRemoveTag = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  const tagNameInput = document.getElementById('tagNameInput') as HTMLInputElement;
  if (!tagNameInput || !tagNameInput.value) {
    log('请输入标签名称', 'warning');
    return;
  }
  try {
    flacInstance.removeTag(tagNameInput.value);
    log(`删除标签成功: ${tagNameInput.value}`, 'success');
    displayTags();
  } catch (error) {
    log(`删除标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testRemoveFirstTag = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  const tagNameInput = document.getElementById('tagNameInput') as HTMLInputElement;
  if (!tagNameInput || !tagNameInput.value) {
    log('请输入标签名称', 'warning');
    return;
  }
  try {
    flacInstance.removeFirstTag(tagNameInput.value);
    log(`删除第一个标签成功: ${tagNameInput.value}`, 'success');
    displayTags();
  } catch (error) {
    log(`删除标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testRemoveAllTags = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    flacInstance.removeAllTags();
    log('删除所有标签成功', 'success');
    displayTags();
  } catch (error) {
    log(`删除所有标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testImportTags = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  const tagsTextarea = document.getElementById('tagsTextarea') as HTMLTextAreaElement;
  if (!tagsTextarea || !tagsTextarea.value) {
    log('请输入标签（每行一个，格式: NAME=VALUE）', 'warning');
    return;
  }
  try {
    flacInstance.importTagsFromString(tagsTextarea.value);
    log('导入标签成功', 'success');
    displayTags();
  } catch (error) {
    log(`导入标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetAllTags = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const tags = flacInstance.getAllTags();
    log(`所有标签: ${tags.join(', ')}`, 'success');
    displayTags();
  } catch (error) {
    log(`获取所有标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testExportTags = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const tags = flacInstance.exportTagsToString();
    log(`导出标签:\n${tags}`, 'success');
    const tagsTextarea = document.getElementById('tagsTextarea') as HTMLTextAreaElement;
    if (tagsTextarea) {
      tagsTextarea.value = tags;
    }
  } catch (error) {
    log(`导出标签失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testGetPicturesSpecs = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const specs = flacInstance.getPicturesSpecs();
    log(`图片规格: ${JSON.stringify(specs, null, 2)}`, 'success');
    displayPictures();
  } catch (error) {
    log(`获取图片规格失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testExportPicture = function (index: number = 0): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const blob = flacInstance.exportPictureToBlob(index);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `picture-${index}.${blob.type.includes('jpeg') ? 'jpg' : 'png'}`;
    a.click();
    URL.revokeObjectURL(url);
    log(`导出图片成功: picture-${index}`, 'success');
  } catch (error) {
    log(`导出图片失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testSaveAsBlob = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const blob = flacInstance.saveAsBlob();
    log(`保存为 Blob 成功: ${blob.size} bytes`, 'success');
  } catch (error) {
    log(`保存为 Blob 失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testSaveAsArrayBuffer = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const arrayBuffer = flacInstance.save();
    log(`保存为 ArrayBuffer 成功: ${arrayBuffer.byteLength} bytes`, 'success');
  } catch (error) {
    log(`保存为 ArrayBuffer 失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testSaveAsBuffer = function (): void {
  if (!flacInstance) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const buffer = flacInstance.saveAsBuffer();
    log(`保存为 Buffer 成功: ${buffer.length} bytes`, 'success');
  } catch (error) {
    log(`保存为 Buffer 失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

(window as any).testDownload = function (): void {
  if (!flacInstance || !currentFile) {
    log('请先加载 FLAC 文件', 'warning');
    return;
  }
  try {
    const blob = flacInstance.saveAsBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name.replace('.flac', '_modified.flac');
    a.click();
    URL.revokeObjectURL(url);
    log('下载文件成功', 'success');
  } catch (error) {
    log(`下载文件失败: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

