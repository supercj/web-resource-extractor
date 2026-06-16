/**
 * 轻量级 ZIP 文件生成器
 * 不依赖外部库，支持基本的 ZIP 打包功能
 */

class SimpleZip {
  constructor() {
    this.files = [];
  }

  addFile(name, data) {
    // data 应该是 Uint8Array 或 string
    let bytes;
    if (typeof data === 'string') {
      bytes = new TextEncoder().encode(data);
    } else if (data instanceof Blob) {
      // Blob 需要异步处理，这里先存储
      this.files.push({ name, blob: data, isBlob: true });
      return;
    } else if (data instanceof ArrayBuffer) {
      bytes = new Uint8Array(data);
    } else if (data instanceof Uint8Array) {
      bytes = data;
    } else {
      bytes = new Uint8Array(0);
    }
    this.files.push({ name, data: bytes, isBlob: false });
  }

  async addBlob(name, blob) {
    const buffer = await blob.arrayBuffer();
    this.files.push({ name, data: new Uint8Array(buffer), isBlob: false });
  }

  async generate() {
    // 先处理所有 Blob 文件
    for (const file of this.files) {
      if (file.isBlob) {
        const buffer = await file.blob.arrayBuffer();
        file.data = new Uint8Array(buffer);
        file.isBlob = false;
      }
    }

    // 计算总大小
    let offset = 0;
    const localHeaders = [];
    const centralHeaders = [];
    const encoder = new TextEncoder();

    // 生成本地文件头和数据
    for (const file of this.files) {
      const nameBytes = encoder.encode(file.name);
      const crc = this.crc32(file.data);

      // 本地文件头
      const localHeader = new ArrayBuffer(30 + nameBytes.length);
      const localView = new DataView(localHeader);
      localView.setUint32(0, 0x04034b50, true);  // 签名
      localView.setUint16(4, 20, true);            // 版本
      localView.setUint16(6, 0, true);             // 标志
      localView.setUint16(8, 0, true);             // 压缩方式 (STORE)
      localView.setUint16(10, 0, true);            // 修改时间
      localView.setUint16(12, 0, true);            // 修改日期
      localView.setUint32(14, crc, true);          // CRC32
      localView.setUint32(18, file.data.length, true);  // 压缩大小
      localView.setUint32(22, file.data.length, true);  // 原始大小
      localView.setUint16(26, nameBytes.length, true);  // 文件名长度
      localView.setUint16(28, 0, true);            // 扩展字段长度

      // 复制文件名
      const localBytes = new Uint8Array(localHeader);
      localBytes.set(nameBytes, 30);

      localHeaders.push({ header: localBytes, data: file.data, offset });

      // 中央目录头
      const centralHeader = new ArrayBuffer(46 + nameBytes.length);
      const centralView = new DataView(centralHeader);
      centralView.setUint32(0, 0x02014b50, true);  // 签名
      centralView.setUint16(4, 20, true);            // 版本
      centralView.setUint16(6, 20, true);            // 版本所需
      centralView.setUint16(8, 0, true);             // 标志
      centralView.setUint16(10, 0, true);            // 压缩方式
      centralView.setUint16(12, 0, true);            // 修改时间
      centralView.setUint16(14, 0, true);            // 修改日期
      centralView.setUint32(16, crc, true);          // CRC32
      centralView.setUint32(20, file.data.length, true);  // 压缩大小
      centralView.setUint32(24, file.data.length, true);  // 原始大小
      centralView.setUint16(28, nameBytes.length, true);  // 文件名长度
      centralView.setUint16(30, 0, true);            // 扩展字段长度
      centralView.setUint16(32, 0, true);            // 文件注释长度
      centralView.setUint16(34, 0, true);            // 磁盘号
      centralView.setUint16(36, 0, true);            // 内部属性
      centralView.setUint32(38, 0, true);            // 外部属性
      centralView.setUint32(42, offset, true);       // 偏移量

      const centralBytes = new Uint8Array(centralHeader);
      centralBytes.set(nameBytes, 46);

      centralHeaders.push({ header: centralBytes });

      offset += localBytes.length + file.data.length;
    }

    // 计算中央目录总大小
    let centralDirSize = 0;
    for (const ch of centralHeaders) {
      centralDirSize += ch.header.length;
    }

    // 中央目录结束记录
    const endRecord = new ArrayBuffer(22);
    const endView = new DataView(endRecord);
    endView.setUint32(0, 0x06054b50, true);        // 签名
    endView.setUint16(4, 0, true);                  // 磁盘号
    endView.setUint16(6, 0, true);                  // 中央目录磁盘号
    endView.setUint16(8, this.files.length, true);  // 条目数
    endView.setUint16(10, this.files.length, true); // 总条目数
    endView.setUint32(12, centralDirSize, true);    // 中央目录大小
    endView.setUint32(16, offset, true);            // 中央目录偏移
    endView.setUint16(20, 0, true);                 // 注释长度

    // 组装最终 ZIP
    const totalSize = offset + centralDirSize + 22;
    const zipData = new Uint8Array(totalSize);
    let pos = 0;

    for (const lh of localHeaders) {
      zipData.set(lh.header, pos);
      pos += lh.header.length;
      zipData.set(lh.data, pos);
      pos += lh.data.length;
    }

    for (const ch of centralHeaders) {
      zipData.set(ch.header, pos);
      pos += ch.header.length;
    }

    zipData.set(new Uint8Array(endRecord), pos);

    return zipData;
  }

  crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = SimpleZip.crcTable;

    if (!table) {
      // 首次使用时生成 CRC 表
      SimpleZip.crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        SimpleZip.crcTable[i] = c;
      }
    }

    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ SimpleZip.crcTable[(crc ^ data[i]) & 0xFF];
    }

    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}

// 导出到全局
window.SimpleZip = SimpleZip;
