import BrowserBuffer from './buffer';

/**
 * 图片类型检测结果
 */
export interface ImageTypeResult {
  mime: string;
}

/**
 * 图片尺寸信息
 */
export interface ImageSize {
  width: number;
  height: number;
}

/**
 * 检测图片 MIME 类型
 * @param data - 图片数据
 * @returns 包含 mime 属性的对象
 */
export function detectImageType(
  data: Uint8Array | ArrayBuffer | BrowserBuffer
): ImageTypeResult {
  let bytes: Uint8Array;
  if (data instanceof Uint8Array) {
    bytes = data;
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else if (data instanceof BrowserBuffer) {
    bytes = data.toUint8Array();
  } else {
    bytes = new Uint8Array(data);
  }

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: 'image/png' };
  }

  // GIF: 47 49 46 38
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: 'image/gif' };
  }

  // WebP: RIFF...WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: 'image/webp' };
  }

  throw new Error('Unsupported image type');
}

/**
 * 解析 JPEG 图片尺寸
 * @param bytes - JPEG 图片数据
 * @returns 包含 width 和 height 的对象
 */
function parseJpegSize(bytes: Uint8Array): ImageSize {
  let offset = 2; // 跳过 FF D8

  while (offset < bytes.length) {
    // 查找标记
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];

    // SOF 标记 (Start of Frame)
    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return { width, height };
    }

    // 跳过数据段
    if (marker === 0xd8 || marker === 0xd9) {
      // SOI 或 EOI
      offset += 2;
    } else if (marker >= 0xd0 && marker <= 0xd7) {
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
 * @param bytes - PNG 图片数据
 * @returns 包含 width 和 height 的对象
 */
function parsePngSize(bytes: Uint8Array): ImageSize {
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
 * @param data - 图片数据
 * @returns 包含 width 和 height 的对象
 */
export function getImageSize(
  data: Uint8Array | ArrayBuffer | BrowserBuffer
): ImageSize {
  let bytes: Uint8Array;
  if (data instanceof Uint8Array) {
    bytes = data;
  } else if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else if (data instanceof BrowserBuffer) {
    bytes = data.toUint8Array();
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
 * @param file - 文件对象
 * @returns Promise<Uint8Array>
 */
export function readFileAsArrayBuffer(file: File | Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(e.target.result));
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

