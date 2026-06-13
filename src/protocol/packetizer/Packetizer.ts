/**
 * Packetizer - Assembles incoming data chunks into complete packets.
 *
 * Protocol:
 *  - 2 bytes: message id
 *  - 3 bytes: payload length (unsigned, big-endian)
 *  - 2 bytes: version
 *  - payload (exactly `payloadLength` bytes)
 */
export class Packetizer {
  private _buffer: Buffer | null = null; // Buffer holding incomplete data
  private _packet: Buffer | null = null; // Current packet (header or full packet)
  private readonly maxPacketSize: number;

  constructor(maxPacketSizeBytes: number) {
    this.maxPacketSize = maxPacketSizeBytes;
  }

  /**
   * Process an incoming data chunk, extract complete packets, and invoke the callback for each.
   */
  packetize(data: Buffer, callback: (packet: Buffer) => void) {
    // Append new data to the internal buffer
    if (this._buffer) {
      this._buffer = Buffer.concat([this._buffer, data]);
    } else {
      this._buffer = data;
    }

    // Process as many complete packets as possible
    while (this._buffer && this._buffer.length > 0) {
      // Case 1: We already have a header and are waiting for the payload
      if (this._packet && this._packet.length > 0) {
        const payloadLength = this._packet.readUIntBE(2, 3); // bytes 2-4 are the length

        // Do we have enough data to complete the packet?
        if (this._buffer.length >= payloadLength) {
          const payload = this._buffer.slice(0, payloadLength);
          const fullPacket = Buffer.concat([this._packet, payload]);

          callback(fullPacket);

          this._packet = null;
          this._buffer = this._buffer.slice(payloadLength);
        } else {
          break;
        }
      }
      // Case 2: No current packet – try to read a new header
      else if (this._buffer.length >= 7) {
        this._packet = this._buffer.slice(0, 7);
        this._buffer = this._buffer.slice(7);

        const payloadLength = this._packet.readUIntBE(2, 3);
        if (payloadLength > this.maxPacketSize) {
          console.error(
            `Packet payload length ${payloadLength} exceeds maximum ${this.maxPacketSize}`
          );
          this._packet = null;
          break;
        }

        if (payloadLength === 0) {
          callback(this._packet);
          this._packet = null;
        }
      }
      // Case 3: Not enough bytes for a full header – wait for more data
      else {
        break;
      }
    }
  }
}

