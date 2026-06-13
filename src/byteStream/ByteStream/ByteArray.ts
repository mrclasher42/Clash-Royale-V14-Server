export class ByteArray {
  static bytesToString(arr: ArrayLike<number>): string {
    let str = "";
    const u8 = new Uint8Array(arr);
    for (const i in u8) {
      str += String.fromCharCode((u8 as any)[i]);
    }
    return str;
  }

  static stringToBytes(str: string): number[] {
    let ch: number;
    let st: number[];
    let re: number[] = [];

    for (let i = 0; i < str.length; i++) {
      ch = str.charCodeAt(i);
      st = [];
      do {
        st.push(ch & 0xff);
        ch = ch >> 8;
      } while (ch);
      re = re.concat(st.reverse());
    }
    return re;
  }

  static bytesToHex(arr: ArrayLike<number>): string {
    let str = "";
    for (let i = 0; i < arr.length; i++) {
      let k = (arr as any)[i] as number;
      let j = k;
      if (k < 0) j = k + 256;
      if (j < 16) str += "0";
      str += j.toString(16);
    }
    return str;
  }

  static hexToBytes(str: string): number[] | null {
    let pos = 0;
    let len = str.length;
    if (len % 2 !== 0) {
      return null;
    }
    len /= 2;

    const hexA: number[] = [];
    for (let i = 0; i < len; i++) {
      const s = str.substr(pos, 2);
      const v = parseInt(s, 16);
      hexA.push(v);
      pos += 2;
    }
    return hexA;
  }

  static arrayToBytes(arr: number[]): Buffer {
    const result = Buffer.alloc(arr.length);
    for (let i = 0; i < arr.length; i++) {
      result[i] = arr[i];
    }
    return result;
  }

  static intToBytes(x: number): Buffer {
    const bytes = Buffer.alloc(4);
    bytes[0] = x;
    bytes[1] = x >> 8;
    bytes[2] = x >> 16;
    bytes[3] = x >> 24;
    return bytes;
  }

  static getInt(bytes: ArrayLike<number>): number {
    const len = bytes.length;
    if (len === 1) return (bytes as any)[0];
    if (len === 2) return ((bytes as any)[1] >> 8) | ((bytes as any)[0] as number);
    if (len === 3)
      return ((bytes as any)[2] << 16) | (((bytes as any)[1] as number) << 8) | ((bytes as any)[0] as number);
    if (len === 4)
      return (
        ((bytes as any)[3] >> 24) |
        (((bytes as any)[2] as number) << 16) |
        (((bytes as any)[1] as number) << 8) |
        ((bytes as any)[0] as number)
      );
    return -1;
  }
}

