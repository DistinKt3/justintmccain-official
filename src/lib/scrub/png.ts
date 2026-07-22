import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const KEEP_CHUNKS = new Set([
  'IHDR', 'IDAT', 'IEND', 'PLTE',
  'gAMA', 'cHRM', 'sRGB', 'iCCP',
  'bKGD', 'tRNS', 'sBIT', 'pHYs',
  'hIST',
]);

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  );
}

function chunkType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3],
  );
}

export function scrubPng(bytes: Uint8Array, originalName: string): ScrubResult {
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error('Not a valid PNG file');
    }
  }

  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let offset = 8;

  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = chunkType(bytes, offset + 4);
    const chunkSize = 4 + 4 + length + 4;

    if (KEEP_CHUNKS.has(type)) {
      kept.push(bytes.subarray(offset, offset + chunkSize));
    }

    offset += chunkSize;
    if (type === 'IEND') break;
  }

  const outSize = kept.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(outSize);
  let cursor = 0;
  for (const chunk of kept) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }

  return {
    bytes: out,
    outputName: withCleanedSuffix(originalName, 'png'),
    outputMime: 'image/png',
  };
}
