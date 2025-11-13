import BrowserBuffer from './lib/buffer';
import { detectImageType, getImageSize } from './lib/imageUtils';
import formatVorbisComment from './lib/formatVorbisComment';

const STREAMINFO = 0;
const PADDING = 1;
const APPLICATION = 2;
const SEEKTABLE = 3;
const VORBIS_COMMENT = 4;
const CUESHEET = 5;
const PICTURE = 6;

/**
 * 图片规格接口
 */
export interface PictureSpec {
  type: number;
  mime: string;
  description: string;
  width: number;
  height: number;
  depth: number;
  colors: number;
}

/**
 * FLAC 数据输入类型
 */
type FlacInput = ArrayBuffer | Uint8Array | BrowserBuffer;

/**
 * 图片数据输入类型
 */
type PictureInput = Uint8Array | ArrayBuffer | BrowserBuffer;

/**
 * 将各种数据格式转换为 BrowserBuffer
 */
async function toBrowserBuffer(
  data: ArrayBuffer | Uint8Array | File | Blob | BrowserBuffer
): Promise<BrowserBuffer> {
  if (data instanceof BrowserBuffer) {
    return data;
  }
  if (data instanceof Uint8Array) {
    return new BrowserBuffer(data);
  }
  if (data instanceof ArrayBuffer) {
    return new BrowserBuffer(data);
  }
  if (data instanceof File || data instanceof Blob) {
    const arrayBuffer = await data.arrayBuffer();
    return new BrowserBuffer(arrayBuffer);
  }
  throw new Error(
    'Unsupported data type. Expected ArrayBuffer, Uint8Array, File, Blob, or BrowserBuffer.'
  );
}

/**
 * Metaflac 类 - 用于处理 FLAC 文件的元数据
 */
export default class Metaflac {
  private flac: FlacInput;
  private buffer: BrowserBuffer | null = null;
  private streamInfo: BrowserBuffer | null = null;
  private blocks: Array<[number, BrowserBuffer]> = [];
  private padding: BrowserBuffer | null = null;
  private vorbisComment: BrowserBuffer | null = null;
  private vendorString: string = '';
  private tags: string[] = [];
  private pictures: BrowserBuffer[] = [];
  private picturesSpecs: PictureSpec[] = [];
  private picturesDatas: BrowserBuffer[] = [];
  private framesOffset: number = 0;

  /**
   * 创建 Metaflac 实例
   * @param flac - FLAC 文件数据
   */
  constructor(flac: FlacInput | File | Blob) {
    if (flac instanceof File || flac instanceof Blob) {
      throw new Error(
        'File and Blob objects must be loaded asynchronously. Use Metaflac.fromFile() or Metaflac.fromBlob() instead.'
      );
    }
    this.flac = flac;
    this.init();
  }

  /**
   * 从 File 对象创建 Metaflac 实例（异步）
   * @param file - File 对象
   * @returns Promise<Metaflac>
   */
  static async fromFile(file: File): Promise<Metaflac> {
    const buffer = await toBrowserBuffer(file);
    return new Metaflac(buffer);
  }

  /**
   * 从 Blob 对象创建 Metaflac 实例（异步）
   * @param blob - Blob 对象
   * @returns Promise<Metaflac>
   */
  static async fromBlob(blob: Blob): Promise<Metaflac> {
    const buffer = await toBrowserBuffer(blob);
    return new Metaflac(buffer);
  }

  /**
   * 从 ArrayBuffer 创建 Metaflac 实例
   * @param arrayBuffer - ArrayBuffer 对象
   * @returns Metaflac
   */
  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Metaflac {
    return new Metaflac(arrayBuffer);
  }

  /**
   * 从 Uint8Array 创建 Metaflac 实例
   * @param uint8Array - Uint8Array 对象
   * @returns Metaflac
   */
  static fromUint8Array(uint8Array: Uint8Array): Metaflac {
    return new Metaflac(uint8Array);
  }

  private init(): void {
    if (this.flac instanceof BrowserBuffer) {
      this.buffer = this.flac;
    } else if (this.flac instanceof Uint8Array) {
      this.buffer = new BrowserBuffer(this.flac);
    } else if (this.flac instanceof ArrayBuffer) {
      this.buffer = new BrowserBuffer(this.flac);
    } else {
      throw new Error('Metaflac(flac) flac must be ArrayBuffer, Uint8Array, or BrowserBuffer.');
    }

    let offset = 0;
    // FLAC 文件格式规范：文件必须以 4 字节的签名 "fLaC" 开始
    // 字节序列：'f' (0x66) 'L' (0x4C) 'a' (0x61) 'C' (0x43)
    // 这是 FLAC 格式的官方 magic number，大小写必须完全匹配
    const marker = this.buffer.slice(0, (offset += 4)).toString('ascii');
    if (marker !== 'fLaC') {
      throw new Error('The file does not appear to be a FLAC file.');
    }

    let blockType = 0;
    let isLastBlock = false;
    while (!isLastBlock) {
      blockType = this.buffer.readUInt8(offset++);
      isLastBlock = blockType > 128;
      blockType = blockType % 128;

      const blockLength = this.buffer.readUIntBE(offset, 3);
      offset += 3;

      if (blockType === STREAMINFO) {
        this.streamInfo = this.buffer.slice(offset, offset + blockLength);
      }

      if (blockType === PADDING) {
        this.padding = this.buffer.slice(offset, offset + blockLength);
      }

      if (blockType === VORBIS_COMMENT) {
        this.vorbisComment = this.buffer.slice(offset, offset + blockLength);
        this.parseVorbisComment();
      }

      if (blockType === PICTURE) {
        this.pictures.push(this.buffer.slice(offset, offset + blockLength));
        this.parsePictureBlock();
      }

      if ([APPLICATION, SEEKTABLE, CUESHEET].includes(blockType)) {
        this.blocks.push([blockType, this.buffer.slice(offset, offset + blockLength)]);
      }
      offset += blockLength;
    }
    this.framesOffset = offset;
  }

  private parseVorbisComment(): void {
    if (!this.vorbisComment) {
      return;
    }
    const vendorLength = this.vorbisComment.readUInt32LE(0);
    this.vendorString = this.vorbisComment.slice(4, vendorLength + 4).toString('utf8');
    this.vorbisComment.readUInt32LE(4 + vendorLength); // userCommentListLength - 读取但不使用
    const userCommentListBuffer = this.vorbisComment.slice(4 + vendorLength + 4);
    for (let offset = 0; offset < userCommentListBuffer.length; ) {
      const length = userCommentListBuffer.readUInt32LE(offset);
      offset += 4;
      const comment = userCommentListBuffer.slice(offset, offset + length).toString('utf8');
      offset += length;
      this.tags.push(comment);
    }
  }

  private parsePictureBlock(): void {
    this.pictures.forEach(picture => {
      let offset = 0;
      const type = picture.readUInt32BE(offset);
      offset += 4;
      const mimeTypeLength = picture.readUInt32BE(offset);
      offset += 4;
      const mime = picture.slice(offset, offset + mimeTypeLength).toString('ascii');
      offset += mimeTypeLength;
      const descriptionLength = picture.readUInt32BE(offset);
      offset += 4;
      const description = picture.slice(offset, offset + descriptionLength).toString('utf8');
      offset += descriptionLength;
      const width = picture.readUInt32BE(offset);
      offset += 4;
      const height = picture.readUInt32BE(offset);
      offset += 4;
      const depth = picture.readUInt32BE(offset);
      offset += 4;
      const colors = picture.readUInt32BE(offset);
      offset += 4;
      const pictureDataLength = picture.readUInt32BE(offset);
      offset += 4;
      this.picturesDatas.push(picture.slice(offset, offset + pictureDataLength));
      this.picturesSpecs.push(
        this.buildSpecification({
          type,
          mime,
          description,
          width,
          height,
          depth,
          colors,
        })
      );
    });
  }

  /**
   * 获取所有图片规格
   * @returns 图片规格数组
   */
  getPicturesSpecs(): PictureSpec[] {
    return this.picturesSpecs;
  }

  /**
   * Get the MD5 signature from the STREAMINFO block.
   */
  getMd5sum(): string {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return this.streamInfo.slice(18, 34).toString('hex');
  }

  /**
   * Get the minimum block size from the STREAMINFO block.
   */
  getMinBlocksize(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return this.streamInfo.readUInt16BE(0);
  }

  /**
   * Get the maximum block size from the STREAMINFO block.
   */
  getMaxBlocksize(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return this.streamInfo.readUInt16BE(2);
  }

  /**
   * Get the minimum frame size from the STREAMINFO block.
   */
  getMinFramesize(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return this.streamInfo.readUIntBE(4, 3);
  }

  /**
   * Get the maximum frame size from the STREAMINFO block.
   */
  getMaxFramesize(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return this.streamInfo.readUIntBE(7, 3);
  }

  /**
   * Get the sample rate from the STREAMINFO block.
   */
  getSampleRate(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    // 20 bits number
    return this.streamInfo.readUIntBE(10, 3) >> 4;
  }

  /**
   * Get the number of channels from the STREAMINFO block.
   */
  getChannels(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    // 3 bits
    return (this.streamInfo.readUIntBE(10, 3) & 0x00000f) >> 1;
  }

  /**
   * Get the # of bits per sample from the STREAMINFO block.
   */
  getBps(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return (this.streamInfo.readUIntBE(12, 2) & 0x01f0) >> 4;
  }

  /**
   * Get the total # of samples from the STREAMINFO block.
   */
  getTotalSamples(): number {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    return this.streamInfo.readUIntBE(13, 5) & 0x0fffffffff;
  }

  /**
   * Show the vendor string from the VORBIS_COMMENT block.
   */
  getVendorTag(): string {
    return this.vendorString;
  }

  /**
   * Get all tags where the the field name matches NAME.
   *
   * @param name - 标签名称
   * @returns 匹配的标签字符串（多个用换行符分隔）
   */
  getTag(name: string): string {
    return this.tags
      .filter(item => {
        const itemName = item.split('=')[0];
        return itemName === name;
      })
      .join('\n');
  }

  /**
   * Remove all tags whose field name is NAME.
   *
   * @param name - 标签名称
   */
  removeTag(name: string): void {
    this.tags = this.tags.filter(item => {
      const itemName = item.split('=')[0];
      return itemName !== name;
    });
  }

  /**
   * Remove first tag whose field name is NAME.
   *
   * @param name - 标签名称
   */
  removeFirstTag(name: string): void {
    const found = this.tags.findIndex(item => {
      return item.split('=')[0] === name;
    });
    if (found !== -1) {
      this.tags.splice(found, 1);
    }
  }

  /**
   * Remove all tags, leaving only the vendor string.
   */
  removeAllTags(): void {
    this.tags = [];
  }

  /**
   * Add a tag.
   * The FIELD must comply with the Vorbis comment spec, of the form NAME=VALUE. If there is currently no tag block, one will be created.
   *
   * @param field - 标签字段，格式为 NAME=VALUE
   */
  setTag(field: string): void {
    if (field.indexOf('=') === -1) {
      throw new Error(`malformed vorbis comment field "${field}", field contains no '=' character`);
    }
    this.tags.push(field);
  }

  /**
   * Import tags from a string.
   * Each line should be of the form NAME=VALUE.
   *
   * @param tagsString - 标签字符串，每行一个标签
   */
  importTagsFromString(tagsString: string): void {
    const tags = tagsString.split('\n').filter(line => line.trim());
    tags.forEach(line => {
      if (line.indexOf('=') === -1) {
        throw new Error(`malformed vorbis comment "${line}", contains no '=' character`);
      }
    });
    this.tags = this.tags.concat(tags);
  }

  /**
   * Export tags to a string.
   * Each line will be of the form NAME=VALUE.
   *
   * @returns 标签字符串
   */
  exportTagsToString(): string {
    return this.tags.join('\n');
  }

  /**
   * Import a picture and store it in a PICTURE metadata block.
   *
   * @param picture - 图片数据
   */
  importPictureFromBuffer(picture: PictureInput): void {
    let pictureBuffer: BrowserBuffer;
    if (picture instanceof BrowserBuffer) {
      pictureBuffer = picture;
    } else if (picture instanceof Uint8Array) {
      pictureBuffer = new BrowserBuffer(picture);
    } else if (picture instanceof ArrayBuffer) {
      pictureBuffer = new BrowserBuffer(picture);
    } else {
      throw new Error('Picture must be Uint8Array, ArrayBuffer, or BrowserBuffer');
    }

    const pictureArray = pictureBuffer.toUint8Array();
    const { mime } = detectImageType(pictureArray);
    if (mime !== 'image/jpeg' && mime !== 'image/png') {
      throw new Error(
        `only support image/jpeg and image/png picture temporarily, current import ${mime}`
      );
    }
    const dimensions = getImageSize(pictureArray);
    const spec = this.buildSpecification({
      mime: mime,
      width: dimensions.width,
      height: dimensions.height,
    });
    this.pictures.push(this.buildPictureBlock(pictureBuffer, spec));
    this.picturesSpecs.push(spec);
    this.picturesDatas.push(pictureBuffer);
  }

  /**
   * Import a picture from File or Blob (async).
   *
   * @param file - 图片文件
   * @returns Promise<void>
   */
  async importPictureFromFile(file: File | Blob): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    this.importPictureFromBuffer(arrayBuffer);
  }

  /**
   * Export PICTURE block to a Blob.
   *
   * @param index - 图片索引，默认为 0
   * @returns Blob
   */
  exportPictureToBlob(index: number = 0): Blob {
    if (this.picturesDatas.length > index) {
      const pictureData = this.picturesDatas[index];
      const spec = this.picturesSpecs[index];
      return new Blob([pictureData.toArrayBuffer()], { type: spec.mime });
    }
    throw new Error(`Picture index ${index} does not exist`);
  }

  /**
   * Export PICTURE block to ArrayBuffer.
   *
   * @param index - 图片索引，默认为 0
   * @returns ArrayBuffer
   */
  exportPictureToArrayBuffer(index: number = 0): ArrayBuffer {
    if (this.picturesDatas.length > index) {
      return this.picturesDatas[index].toArrayBuffer();
    }
    throw new Error(`Picture index ${index} does not exist`);
  }

  /**
   * Remove a picture at the specified index.
   *
   * @param index - 图片索引，默认为 0
   */
  removePicture(index: number = 0): void {
    if (this.pictures.length > index) {
      this.pictures.splice(index, 1);
      this.picturesSpecs.splice(index, 1);
      this.picturesDatas.splice(index, 1);
    } else {
      throw new Error(`Picture index ${index} does not exist`);
    }
  }

  /**
   * Remove all pictures.
   */
  removeAllPictures(): void {
    this.pictures = [];
    this.picturesSpecs = [];
    this.picturesDatas = [];
  }

  /**
   * Return all tags.
   */
  getAllTags(): string[] {
    return this.tags;
  }

  private buildSpecification(spec: Partial<PictureSpec> = {}): PictureSpec {
    const defaults: PictureSpec = {
      type: 3,
      mime: 'image/jpeg',
      description: '',
      width: 0,
      height: 0,
      depth: 24,
      colors: 0,
    };
    return Object.assign(defaults, spec);
  }

  /**
   * Build a picture block.
   *
   * @param picture - 图片数据
   * @param specification - 图片规格
   * @returns BrowserBuffer
   */
  private buildPictureBlock(picture: BrowserBuffer, specification: PictureSpec): BrowserBuffer {
    const pictureType = BrowserBuffer.alloc(4);
    const mimeLength = BrowserBuffer.alloc(4);
    const mime = BrowserBuffer.from(specification.mime, 'ascii');
    const descriptionLength = BrowserBuffer.alloc(4);
    const description = BrowserBuffer.from(specification.description, 'utf8');
    const width = BrowserBuffer.alloc(4);
    const height = BrowserBuffer.alloc(4);
    const depth = BrowserBuffer.alloc(4);
    const colors = BrowserBuffer.alloc(4);
    const pictureLength = BrowserBuffer.alloc(4);

    pictureType.writeUInt32BE(specification.type, 0);
    mimeLength.writeUInt32BE(specification.mime.length, 0);
    descriptionLength.writeUInt32BE(specification.description.length, 0);
    width.writeUInt32BE(specification.width, 0);
    height.writeUInt32BE(specification.height, 0);
    depth.writeUInt32BE(specification.depth, 0);
    colors.writeUInt32BE(specification.colors, 0);
    pictureLength.writeUInt32BE(picture.length, 0);

    return BrowserBuffer.concat([
      pictureType,
      mimeLength,
      mime,
      descriptionLength,
      description,
      width,
      height,
      depth,
      colors,
      pictureLength,
      picture,
    ]);
  }

  private buildMetadataBlock(
    type: number,
    block: BrowserBuffer,
    isLast: boolean = false
  ): BrowserBuffer {
    const header = BrowserBuffer.alloc(4);
    if (isLast) {
      type += 128;
    }
    header.writeUIntBE(type, 0, 1);
    header.writeUIntBE(block.length, 1, 3);
    return BrowserBuffer.concat([header, block]);
  }

  private buildMetadata(): BrowserBuffer[] {
    if (!this.streamInfo) {
      throw new Error('StreamInfo is not available');
    }
    const bufferArray: BrowserBuffer[] = [];
    bufferArray.push(this.buildMetadataBlock(STREAMINFO, this.streamInfo));
    this.blocks.forEach(block => {
      bufferArray.push(this.buildMetadataBlock(...block));
    });
    bufferArray.push(
      this.buildMetadataBlock(VORBIS_COMMENT, formatVorbisComment(this.vendorString, this.tags))
    );
    this.pictures.forEach(block => {
      bufferArray.push(this.buildMetadataBlock(PICTURE, block));
    });
    // 如果 padding 为 null，创建一个空的 PADDING 块（至少 4 字节）
    const padding = this.padding || BrowserBuffer.alloc(4);
    bufferArray.push(this.buildMetadataBlock(PADDING, padding, true));
    return bufferArray;
  }

  private buildStream(): BrowserBuffer[] {
    if (!this.buffer) {
      throw new Error('Buffer is not available');
    }
    const metadata = this.buildMetadata();
    return [this.buffer.slice(0, 4), ...metadata, this.buffer.slice(this.framesOffset)];
  }

  /**
   * Save changes and return ArrayBuffer.
   *
   * @returns ArrayBuffer
   */
  save(): ArrayBuffer {
    const stream = this.buildStream();
    const result = BrowserBuffer.concat(stream);
    return result.toArrayBuffer();
  }

  /**
   * Save changes and return Blob.
   *
   * @returns Blob
   */
  saveAsBlob(): Blob {
    const arrayBuffer = this.save();
    return new Blob([arrayBuffer], { type: 'audio/flac' });
  }

  /**
   * Save changes and return BrowserBuffer.
   *
   * @returns BrowserBuffer
   */
  saveAsBuffer(): BrowserBuffer {
    const stream = this.buildStream();
    return BrowserBuffer.concat(stream);
  }
}
