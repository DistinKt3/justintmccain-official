import piexif from 'piexifjs';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';
import { uint8ToBinaryString, binaryStringToUint8 } from '../binary';

export function scrubJpeg(bytes: Uint8Array, originalName: string): ScrubResult {
  const binary = uint8ToBinaryString(bytes);
  const cleaned = piexif.remove(binary);
  return {
    bytes: binaryStringToUint8(cleaned),
    outputName: withCleanedSuffix(originalName, 'jpg'),
    outputMime: 'image/jpeg',
  };
}
