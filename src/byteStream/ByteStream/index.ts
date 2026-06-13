import { ByteArray } from "./ByteArray";
import * as zlib from "zlib";

/**
 * ByteStream
 *
 * For clear communication between client and server.
 */
export class ByteStream {
  buffer: Buffer;
  length: number;
  offset: number;
  bitOffset: number;

  // These are provided by `PiranhaMessage` (ported from old-v13).
  id?: number;
  client?: { write: (data: Buffer) => void; log?: (msg: string) => void };
  version?: number;

  constructor(data?: Buffer) {
    // eslint-disable-next-line new-cap
    this.buffer = data != null ? data : Buffer.alloc(0);
    this.length = 0;
    this.offset = 0;
    this.bitOffset = 0;
  }

  /**
   * Reading Int from Bytes
   */
  readInt(): number {
    this.bitOffset = 0;
    return (
      (this.buffer[this.offset++] << 24) |
      ((this.buffer[this.offset++] << 16) |
        ((this.buffer[this.offset++] << 8) | this.buffer[this.offset++]))
    );
  }

  skip(len: number) {
    this.bitOffset += len;
  }

  /**
   * Reading Short from Bytes
   */
  readShort(): number {
    this.bitOffset = 0;
    return (this.buffer[this.offset++] << 8) | this.buffer[this.offset++];
  }

  readByte(): number {
    return this.buffer[this.offset++];
  }

  readAll(): Buffer {
    return this.buffer;
  }

  /**
   * Writing value to Bytes as Short
   */
  writeShort(value: number) {
    this.bitOffset = 0;
    this.ensureCapacity(2);
    this.buffer[this.offset++] = value >> 8;
    this.buffer[this.offset++] = value;
  }

  /**
   * Writing value to Bytes as Int
   */
  writeInt(value: number) {
    this.bitOffset = 0;
    this.ensureCapacity(4);
    this.buffer[this.offset++] = value >> 24;
    this.buffer[this.offset++] = value >> 16;
    this.buffer[this.offset++] = value >> 8;
    this.buffer[this.offset++] = value;
  }

  /**
   * Get Bytes in String
   */
  getHex(): string {
    return ByteArray.bytesToHex(this.buffer);
  }

  /**
   * Reading String from Bytes
   */
  readString(): string {
    const length = this.readInt();

    if (length > 0 && length < 90000) {
      const stringBytes = this.buffer.slice(this.offset, this.offset + length);
      const string = stringBytes.toString("utf8");
      this.offset += length;
      return string;
    }
    return "";
  }

  read5BytesAsString(): string {
    const length = 5;

    if (length > 0 && length < 90000) {
      const stringBytes = this.buffer.slice(this.offset, this.offset + length);
      const string = stringBytes.toString("utf8");
      this.offset += length;
      return string;
    }
    return "";
  }

  /**
   * Reading VarInt from Bytes
   */
  readVInt(): number {
    let result = 0,
      shift = 0,
      s = 0,
      a1 = 0,
      a2 = 0;
    do {
      let byte = this.buffer[this.offset++];
      if (shift === 0) {
        a1 = (byte & 0x40) >> 6;
        a2 = (byte & 0x80) >> 7;
        s = (byte << 1) & ~0x181;
        byte = s | (a2 << 7) | a1;
      }
      result |= (byte & 0x7f) << shift;
      shift += 7;
      if (!(byte & 0x80)) {
        break;
      }
    } while (true);

    return (result >> 1) ^ -(result & 1);
  }

  /**
   * Reading 2 VarInts from Bytes
   */
  readDataReference(): [number, number] {
    const a1 = this.readVInt();
    return [a1, a1 == 0 ? 0 : this.readVInt()];
  }

  /**
   * Writing values to Bytes as VarInts
   */
  writeDataReference(value1: number, value2: number) {
    if (value1 < 1) {
      this.writeVInt(0);
    } else {
      this.writeVInt(value1);
      this.writeVInt(value2);
    }
  }

  /**
   * Writing value to Bytes as VarInt
   */
  writeVInt(value: number) {
    this.bitOffset = 0;
    let temp = (value >> 25) & 0x40;
    let flipped = value ^ (value >> 31);

    temp |= value & 0x3f;

    value >>= 6;
    flipped >>= 6;

    if (flipped === 0) {
      this.writeByte(temp);
      return 0;
    }

    this.writeByte(temp | 0x80);

    flipped >>= 7;
    let r = 0;

    if (flipped) {
      r = 0x80;
    }

    this.writeByte((value & 0x7f) | r);

    value >>= 7;

    while (flipped !== 0) {
      flipped >>= 7;
      r = 0;
      if (flipped) {
        r = 0x80;
      }
      this.writeByte((value & 0x7f) | r);
      value >>= 7;
    }
  }

  /**
   * Writing value to Bytes as Boolean
   */
  writeBoolean(value: boolean) {
    if (this.bitOffset === 0) {
      this.ensureCapacity(1);
      this.buffer[this.offset++] = 0;
    }

    if (value) {
      this.buffer[this.offset - 1] |= 1 << this.bitOffset;
    }

    this.bitOffset = (this.bitOffset + 1) & 7;
  }

  /**
   * Reading Boolean from Bytes
   */
  readBoolean(): boolean {
    return this.readVInt() >= 1;
  }

  /**
   * Writing value to Bytes as String
   */
  writeString(value: string) {
    if (value == null || value.length > 90000) {
      this.writeInt(-1);
      return;
    }

    const buf = Buffer.from(value, "utf8");
    this.writeInt(buf.length);
    this.buffer = Buffer.concat([this.buffer, buf]);
    this.offset += buf.length;
  }

  // Alias used in old-v13.
  writeStringReference = this.writeString.bind(this);

  /**
   * Writing value to Bytes as LongLong (commonly isn't used)
   */
  writeLongLong(value: number) {
    this.writeInt(value >> 32);
    this.writeInt(value);
  }

  /**
   * Writing values to Bytes as VarInts
   */
  writeLogicLong(value1: number, value2: number) {
    this.writeVInt(value1);
    this.writeVInt(value2);
  }

  /**
   * Reading 2 VarInts from Bytes
   */
  readLogicLong(): [number, number] {
    return [this.readVInt(), this.readVInt()];
  }

  /**
   * Reads a variable-length signed 64-bit integer (VLong) from the stream.
   */
  readVLong(): bigint {
    this.bitOffset = 0;
    const firstByte = this.buffer[this.offset++];
    const sign = (firstByte & 0x40) !== 0;
    let continuation = (firstByte & 0x80) !== 0;
    let mag = BigInt(firstByte & 0x3f);
    let shift = 6n;

    while (continuation) {
      const nextByte = this.buffer[this.offset++];
      continuation = (nextByte & 0x80) !== 0;
      mag |= BigInt(nextByte & 0x7f) << shift;
      shift += 7n;
    }

    return sign ? -mag : mag;
  }

  /**
   * Writes a variable-length signed 64-bit integer (VLong) to the stream.
   */
  writeVLong(value: number | bigint) {
    this.bitOffset = 0;
    let v = BigInt(value);
    const sign = v < 0n;
    let mag = sign ? -v : v;

    // First byte: lower 6 bits + sign + continuation flag
    const firstChunk = Number(mag & 0x3fn);
    mag >>= 6n;
    let hasMore = mag !== 0n;
    const firstByte = firstChunk | (sign ? 0x40 : 0) | (hasMore ? 0x80 : 0);
    this.writeByte(firstByte);

    // Subsequent bytes: 7 bits each + continuation flag
    while (hasMore) {
      const chunk = Number(mag & 0x7fn);
      mag >>= 7n;
      hasMore = mag !== 0n;
      this.writeByte(chunk | (hasMore ? 0x80 : 0));
    }
  }

  /**
   * Writing values to Bytes as Ints (Long)
   */
  writeLong(value1: number, value2: number) {
    this.writeInt(value1);
    this.writeInt(value2);
  }

  /**
   * Reading 2 Ints from Bytes
   */
  readLong(): [number, number] {
    return [this.readInt(), this.readInt()];
  }

  /**
   * Writing value to Bytes as Byte
   */
  writeByte(value: number) {
    this.bitOffset = 0;
    this.ensureCapacity(1);
    this.buffer[this.offset++] = value;
  }

  /**
   * Writing value to Bytes as ByteArray
   */
  writeBytes(hex: string) {
    const buffer = Buffer.from(hex, "hex");
    const length = buffer.length;

    if (buffer != null) {
      this.buffer = Buffer.concat([this.buffer, buffer]);
      this.offset += length;
    }
  }

  writeHex(hex: string) {
    const buffer = Buffer.from(hex, "hex");

    if (buffer != null) {
      this.buffer = Buffer.concat([this.buffer, buffer]);
      this.offset += buffer.length;
    }
  }

  writeHex2(hex: string) {
    const buffer = Buffer.from(hex, "hex");

    if (buffer != null) {
      this.writeInt(buffer.length);
      this.buffer = Buffer.concat([this.buffer, buffer]);
      this.offset += buffer.length;
      return;
    }
  }

  /**
   * Writes a compressed (zlib) and optionally encrypted string to the stream.
   *
   * @param str - The plaintext string to compress and write.
   * @param encrypt - Optional encryption function that takes a Buffer and returns the encrypted Buffer.
   *                  If omitted, only compression is applied.
   *
   * Usage examples:
   * - Only compression: stream.writeCompressedString("hello");
   * - Compression + custom encryption: stream.writeCompressedString("hello", myEncryptFunction);
   *
   * The compressed data is written with an Int32 length prefix, similar to writeString().
   * If encryption is used, the encrypted compressed data is stored after the length prefix.
   */
  writeCompressedString(str: string) {
      const raw        = Buffer.from(str, "utf8");
      const compressed = zlib.deflateSync(raw, {
        level: zlib.constants.Z_DEFAULT_COMPRESSION, // level 6 — same as original
      });
    
      const out = Buffer.allocUnsafe(4 + compressed.length);
      out.writeUInt32LE(raw.length, 0); // write uncompressed size as LE uint32
      compressed.copy(out, 4);
    
      this.writeHex2(out.toString("hex"));
  }

  /**
   * Adding more space to Buffer
   */
  ensureCapacity(capacity: number) {
    const bufferLength = this.buffer.length;
    if (this.offset + capacity > bufferLength) {
      // eslint-disable-next-line new-cap
      const tmpBuffer = Buffer.alloc(capacity);
      this.buffer = Buffer.concat([this.buffer, tmpBuffer]);
    }
  }

  /**
   * Send a packet to the server.
   */
  send() {
    if ((this.id ?? 0) < 20000) return;

    // `PiranhaMessage.encode()` must write into `this.buffer`.
    // @ts-expect-error runtime contract from old-v13
    this.encode();

    const header = Buffer.alloc(7);
    header.writeUInt16BE(this.id as number, 0);
    header.writeUIntBE(this.buffer.length, 2, 3);
    header.writeUInt16BE(this.version as number, 5);

    const crypted = this.buffer; // crypto.encrypt(this.id, this.buffer);
    const footer = Buffer.from([0xff, 0xff, 0x0, 0x0, 0x0, 0x0, 0x0]);

    if (!this.client) throw new Error("ByteStream.client missing");
    this.client.write(Buffer.concat([header, crypted, footer]));
    this.client.log?.(`Packet ${this.id} (${this.constructor.name}) was sent.`);
  }
}
