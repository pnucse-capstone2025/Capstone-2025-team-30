// 웹 브라우저의 입력을 유니티가 이해할수 있는 압축된 바이너리 형태로 변환하는 유틸리티

export class MemoryHelper {
  /**
   * Write a single bit to an ArrayBuffer at the specified bit offset
   * @param buffer - The ArrayBuffer to write to
   * @param bitOffset - The bit offset position
   * @param value - The boolean value to write
   */
  static writeSingleBit(buffer: ArrayBuffer, bitOffset: number, value: boolean): void {
    const view = new Uint8Array(buffer);
    const index = Math.floor(bitOffset / 8);
    bitOffset = bitOffset % 8;
    const byte = view[index];
    let newByte = 1 << bitOffset;
    if (value) {
      newByte = newByte | byte;
    } else {
      newByte = ~newByte & byte;
    }
    view[index] = newByte;
  }

  /**
   * Size of an integer in bytes (4 bytes = 32 bits)
   * @returns The size of an integer
   */
  static get sizeOfInt(): number {
    return 4;
  }
}