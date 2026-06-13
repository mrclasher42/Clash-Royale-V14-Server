import zlib
import binascii

# The hex string you provided
hex_data = (
    ""
)

# Convert the hex string to bytes
data_bytes = binascii.unhexlify(hex_data)

# The first 4 bytes are the uncompressed length (little-endian)
uncompressed_len = int.from_bytes(data_bytes[:4], byteorder='little')
print(f"Uncompressed length (from header): {uncompressed_len} bytes")

# The rest is the zlib compressed stream (starting with 0x78da)
compressed_data = data_bytes[4:]

# Decompress using zlib
try:
    decompressed = zlib.decompress(compressed_data)
    print("\n--- Decoded JSON ---\n")
    print(decompressed.decode('utf-8'))
except Exception as e:
    print(f"Decompression failed: {e}")