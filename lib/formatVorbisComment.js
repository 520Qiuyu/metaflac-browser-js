const BrowserBuffer = require('./buffer');

module.exports = (vendorString, commentList) => {
    const bufferArray = [];
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