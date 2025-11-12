/**
 * 浏览器版本的图片检测工具
 * 用于检测图片类型和尺寸，替代 file-type 和 image-size
 */

/**
 * 检测图片 MIME 类型
 * @param {Uint8Array|ArrayBuffer|BrowserBuffer} data - 图片数据
 * @returns {Object} 包含 mime 属性的对象
 */
function detectImageType(data) {
    let bytes;
    if (data instanceof Uint8Array) {
        bytes = data;
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    } else if (data.buffer) {
        bytes = new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength || data.length);
    } else {
        bytes = new Uint8Array(data);
    }

    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return { mime: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes.length >= 8 &&
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
        bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
        return { mime: 'image/png' };
    }

    // GIF: 47 49 46 38
    if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return { mime: 'image/gif' };
    }

    // WebP: RIFF...WEBP
    if (bytes.length >= 12 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return { mime: 'image/webp' };
    }

    throw new Error('Unsupported image type');
}

/**
 * 解析 JPEG 图片尺寸
 * @param {Uint8Array} bytes - JPEG 图片数据
 * @returns {Object} 包含 width 和 height 的对象
 */
function parseJpegSize(bytes) {
    let offset = 2; // 跳过 FF D8

    while (offset < bytes.length) {
        // 查找标记
        if (bytes[offset] !== 0xFF) {
            offset++;
            continue;
        }

        const marker = bytes[offset + 1];

        // SOF 标记 (Start of Frame)
        if (marker >= 0xC0 && marker <= 0xC3) {
            const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
            const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
            return { width, height };
        }

        // 跳过数据段
        if (marker === 0xD8 || marker === 0xD9) {
            // SOI 或 EOI
            offset += 2;
        } else if (marker >= 0xD0 && marker <= 0xD7) {
            // RST 标记（无数据）
            offset += 2;
        } else {
            // 其他标记，读取长度
            const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
            offset += 2 + length;
        }
    }

    throw new Error('Could not determine JPEG dimensions');
}

/**
 * 解析 PNG 图片尺寸
 * @param {Uint8Array} bytes - PNG 图片数据
 * @returns {Object} 包含 width 和 height 的对象
 */
function parsePngSize(bytes) {
    // PNG 尺寸信息在 IHDR chunk 中（偏移 16-24）
    if (bytes.length < 24) {
        throw new Error('Invalid PNG file');
    }

    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];

    return { width, height };
}

/**
 * 获取图片尺寸
 * @param {Uint8Array|ArrayBuffer|BrowserBuffer|File|Blob} data - 图片数据
 * @returns {Object} 包含 width 和 height 的对象
 */
function getImageSize(data) {
    let bytes;
    if (data instanceof Uint8Array) {
        bytes = data;
    } else if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
    } else if (data.buffer) {
        bytes = new Uint8Array(data.buffer, data.byteOffset || 0, data.byteLength || data.length);
    } else {
        bytes = new Uint8Array(data);
    }

    const type = detectImageType(bytes);

    if (type.mime === 'image/jpeg') {
        return parseJpegSize(bytes);
    } else if (type.mime === 'image/png') {
        return parsePngSize(bytes);
    } else {
        throw new Error(`Unsupported image type: ${type.mime}`);
    }
}

/**
 * 使用 Promise 从 File/Blob 读取数据
 * @param {File|Blob} file - 文件对象
 * @returns {Promise<Uint8Array>}
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(new Uint8Array(e.target.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

module.exports = {
    detectImageType,
    getImageSize,
    readFileAsArrayBuffer,
};

