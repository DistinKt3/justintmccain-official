import heic2any from 'heic2any';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';
import { scrubJpeg } from './jpeg';

export async function scrubHeic(
  bytes: Uint8Array,
  originalName: string,
): Promise<ScrubResult> {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'image/heic' });
  const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.95 });
  const jpegBlob = Array.isArray(converted) ? converted[0] : converted;
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const stripped = scrubJpeg(jpegBytes, originalName);
  return {
    bytes: stripped.bytes,
    outputName: withCleanedSuffix(originalName, 'jpg'),
    outputMime: 'image/jpeg',
  };
}
