import { ByteStream } from "../byteStream/ByteStream";

/**
 * PiranhaMessage
 *
 * Main handler of packets.
 */
class PiranhaMessage extends ByteStream {
  id: number;
  client: any;
  version: number;

  constructor(bytes?: Buffer, client?: any) {
    super(bytes);
    this.id = 0;
    this.client = client ?? null;
    this.version = 0;
  }

  /**
   * Encode function for server packets.
   *
   * Need to use `write` functions.
   */
  encode() {
    // Intentionally empty; subclasses implement.
  }

  /**
   * Decode function for client packets.
   *
   * Need to use `read` functions.
   */
  decode() {
    // Intentionally empty; subclasses implement.
  }

  /**
   * Process function for client packets.
   */
  process() {
    // Intentionally empty; subclasses implement.
  }
}

export = PiranhaMessage;

