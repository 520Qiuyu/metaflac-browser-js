/**
 * 浏览器兼容的 Buffer 工具类
 * 使用 Uint8Array 和 DataView 来模拟 Node.js Buffer API
 */

type BufferEncoding = 'utf8' | 'ascii' | 'hex';

type BufferInput = number | string | Uint8Array | ArrayBuffer | BrowserBuffer | ArrayLike<number>;

/**
 * 将字符串转换为 Uint8Array
 */
function stringToBytes(str: string, encoding: BufferEncoding = 'utf8'): Uint8Array {
  if (encoding === 'utf8') {
    const utf8 = unescape(encodeURIComponent(str));
    const bytes = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
      bytes[i] = utf8.charCodeAt(i);
    }
    return bytes;
  } else if (encoding === 'ascii') {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  } else if (encoding === 'hex') {
    const bytes = new Uint8Array(str.length / 2);
    for (let i = 0; i < str.length; i += 2) {
      bytes[i / 2] = parseInt(str.substr(i, 2), 16);
    }
    return bytes;
  }
  throw new Error(`Unsupported encoding: ${encoding}`);
}

/**
 * 将 Uint8Array 转换为字符串
 */
function bytesToString(bytes: Uint8Array, encoding: BufferEncoding = 'utf8'): string {
  if (encoding === 'utf8') {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    try {
      return decodeURIComponent(escape(str));
    } catch (e) {
      return str;
    }
  } else if (encoding === 'ascii') {
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      str += String.fromCharCode(bytes[i] & 0xff);
    }
    return str;
  } else if (encoding === 'hex') {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      const h = bytes[i].toString(16);
      hex += h.length === 1 ? '0' + h : h;
    }
    return hex;
  }
  throw new Error(`Unsupported encoding: ${encoding}`);
}

/**
 * 浏览器兼容的 Buffer 类
 */
export class BrowserBuffer {
  private _data: Uint8Array;
  private _view: DataView;

  constructor(data?: BufferInput, byteOffset?: number | BufferEncoding, length?: number) {
    if (typeof data === 'number') {
      // Buffer.alloc(size)
      this._data = new Uint8Array(data);
      this._view = new DataView(this._data.buffer);
    } else if (data instanceof Uint8Array) {
      // Buffer.from(Uint8Array)
      this._data = data;
      this._view = new DataView(this._data.buffer, data.byteOffset, data.byteLength);
    } else if (typeof data === 'string') {
      // Buffer.from(string, encoding)
      const encoding = (byteOffset as BufferEncoding) || 'utf8';
      this._data = stringToBytes(data, encoding);
      this._view = new DataView(this._data.buffer);
    } else if (data instanceof ArrayBuffer) {
      // Buffer.from(ArrayBuffer)
      const offset = (byteOffset as number) || 0;
      const len = length !== undefined ? length : data.byteLength - offset;
      this._data = new Uint8Array(data, offset, len);
      this._view = new DataView(data, offset, len);
    } else if (data instanceof BrowserBuffer) {
      this._data = data._data;
      this._view = data._view;
    } else if (Array.isArray(data)) {
      this._data = new Uint8Array(data);
      this._view = new DataView(this._data.buffer);
    } else if (data === undefined) {
      this._data = new Uint8Array(0);
      this._view = new DataView(this._data.buffer);
    } else {
      this._data = new Uint8Array(data as ArrayLike<number>);
      this._view = new DataView(this._data.buffer);
    }
  }

  /**
   * 读取无符号 8 位整数
   */
  readUInt8(offset: number): number {
    return this._view.getUint8(offset);
  }

  /**
   * 读取无符号 16 位整数（大端序）
   */
  readUInt16BE(offset: number): number {
    return this._view.getUint16(offset, false);
  }

  /**
   * 读取无符号 16 位整数（小端序）
   */
  readUInt16LE(offset: number): number {
    return this._view.getUint16(offset, true);
  }

  /**
   * 读取无符号 32 位整数（大端序）
   */
  readUInt32BE(offset: number): number {
    return this._view.getUint32(offset, false);
  }

  /**
   * 读取无符号 32 位整数（小端序）
   */
  readUInt32LE(offset: number): number {
    return this._view.getUint32(offset, true);
  }

  /**
   * 读取无符号整数（大端序，可变长度）
   */
  readUIntBE(offset: number, byteLength: number): number {
    let value = 0;
    for (let i = 0; i < byteLength; i++) {
      value = (value << 8) + this._view.getUint8(offset + i);
    }
    return value;
  }

  /**
   * 写入无符号 8 位整数
   */
  writeUInt8(value: number, offset: number): void {
    this._view.setUint8(offset, value);
  }

  /**
   * 写入无符号 16 位整数（大端序）
   */
  writeUInt16BE(value: number, offset: number): void {
    this._view.setUint16(offset, value, false);
  }

  /**
   * 写入无符号 32 位整数（大端序）
   */
  writeUInt32BE(value: number, offset: number): void {
    this._view.setUint32(offset, value, false);
  }

  /**
   * 写入无符号 32 位整数（小端序）
   */
  writeUInt32LE(value: number, offset: number): void {
    this._view.setUint32(offset, value, true);
  }

  /**
   * 写入无符号整数（大端序，可变长度）
   */
  writeUIntBE(value: number, offset: number, byteLength: number): void {
    for (let i = byteLength - 1; i >= 0; i--) {
      this._view.setUint8(offset + i, value & 0xff);
      value = value >> 8;
    }
  }

  /**
   * 转换为字符串
   */
  toString(encoding: BufferEncoding = 'utf8'): string {
    return bytesToString(this._data, encoding);
  }

  /**
   * 切片
   */
  slice(start?: number, end?: number): BrowserBuffer {
    const sliced = this._data.slice(start, end);
    return new BrowserBuffer(sliced);
  }

  /**
   * 获取长度
   */
  get length(): number {
    return this._data.length;
  }

  /**
   * 获取底层 ArrayBuffer
   */
  get buffer(): ArrayBufferLike {
    return this._data.buffer;
  }

  /**
   * 转换为 Uint8Array
   */
  toUint8Array(): Uint8Array {
    return new Uint8Array(this._data);
  }

  /**
   * 转换为 ArrayBuffer
   */
  toArrayBuffer(): ArrayBuffer {
    const buf = this.buffer;
    // 检查 SharedArrayBuffer 是否存在，并且 buf 是 SharedArrayBuffer 的实例
    // 在浏览器环境中，Uint8Array.buffer 总是 ArrayBuffer，所以这个检查主要是为了类型安全
    if (typeof SharedArrayBuffer !== 'undefined' && buf instanceof SharedArrayBuffer) {
      throw new Error('Cannot convert SharedArrayBuffer to ArrayBuffer');
    }
    // 在浏览器环境中，Uint8Array.buffer 总是 ArrayBuffer
    // 所以我们可以安全地将其转换为 ArrayBuffer
    return (buf as ArrayBuffer).slice(
      this._data.byteOffset,
      this._data.byteOffset + this._data.byteLength
    );
  }

  /**
   * 创建指定大小的 Buffer
   */
  static alloc(size: number): BrowserBuffer {
    return new BrowserBuffer(size);
  }

  /**
   * 从数据创建 Buffer
   */
  static from(data: BufferInput, encoding?: BufferEncoding): BrowserBuffer {
    if (data instanceof BrowserBuffer) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return new BrowserBuffer(data);
    }
    if (data instanceof ArrayBuffer) {
      return new BrowserBuffer(data);
    }
    if (typeof data === 'string') {
      return new BrowserBuffer(data, encoding);
    }
    if (Array.isArray(data)) {
      return new BrowserBuffer(new Uint8Array(data));
    }
    throw new Error('Unsupported data type');
  }

  /**
   * 连接多个 Buffer
   */
  static concat(buffers: Array<BrowserBuffer | Uint8Array>): BrowserBuffer {
    let totalLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length;
    }
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buf = buffers[i];
      if (buf instanceof BrowserBuffer) {
        result.set(buf._data, offset);
        offset += buf.length;
      } else if (buf instanceof Uint8Array) {
        result.set(buf, offset);
        offset += buf.length;
      }
    }
    return new BrowserBuffer(result);
  }
}

// 始终使用 BrowserBuffer 以确保浏览器兼容性
// 在 Node.js 环境中，BrowserBuffer 也提供了与 Buffer 兼容的 API
export default BrowserBuffer;
