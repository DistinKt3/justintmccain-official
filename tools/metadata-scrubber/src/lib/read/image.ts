import exifr from 'exifr';
import { categorize } from '../categorize';
import type { Finding } from '../types';

export async function readImage(bytes: Uint8Array): Promise<Finding[]> {
  try {
    const raw = await exifr.parse(bytes, {
      gps: true,
      exif: true,
      iptc: true,
      xmp: true,
      tiff: true,
      icc: false,
      jfif: false,
    });
    return categorize((raw ?? {}) as Record<string, unknown>, 'jpeg');
  } catch {
    return [];
  }
}
