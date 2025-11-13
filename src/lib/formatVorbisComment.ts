import BrowserBuffer from './buffer';

/**
 * 格式化 Vorbis 评论块
 * @param vendorString - 供应商字符串
 * @param commentList - 评论列表
 * @returns 格式化后的 BrowserBuffer
 */
export default function formatVorbisComment(
  vendorString: string,
  commentList: string[]
): BrowserBuffer {
  const bufferArray: BrowserBuffer[] = [];
  const vendorStringBuffer = BrowserBuffer.from(vendorString, 'utf8');
  const vendorLengthBuffer = BrowserBuffer.alloc(4);
  vendorLengthBuffer.writeUInt32LE(vendorStringBuffer.length, 0);

  const userCommentListLengthBuffer = BrowserBuffer.alloc(4);
  userCommentListLengthBuffer.writeUInt32LE(commentList.length, 0);

  bufferArray.push(vendorLengthBuffer, vendorStringBuffer, userCommentListLengthBuffer);

  for (let i = 0; i < commentList.length; i++) {
    const comment = commentList[i];
    const commentBuffer = BrowserBuffer.from(comment, 'utf8');
    const lengthBuffer = BrowserBuffer.alloc(4);
    lengthBuffer.writeUInt32LE(commentBuffer.length, 0);
    bufferArray.push(lengthBuffer, commentBuffer);
  }

  return BrowserBuffer.concat(bufferArray);
}

