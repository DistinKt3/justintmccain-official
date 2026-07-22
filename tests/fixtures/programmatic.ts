import piexif from 'piexifjs';

// Minimal 1x1 white baseline JPEG (public-domain, well-known 1x1 test image, no EXIF).
export const BASE_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAA' +
  'AQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIh' +
  'MUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpT' +
  'VFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5' +
  'usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAA' +
  'AAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEI' +
  'FEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVm' +
  'Z2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK' +
  '0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

export function base64ToBinaryString(b64: string): string {
  return atob(b64);
}

export function binaryStringToUint8(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

export function uint8ToBinaryString(bytes: Uint8Array): string {
  let s = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return s;
}

function decimalToDMSRational(deg: number): [number, number][] {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60 * 100);
  return [[d, 1], [m, 1], [s, 100]];
}

export interface JpegFixtureOptions {
  gpsLat?: number;
  gpsLng?: number;
  make?: string;
  model?: string;
  software?: string;
  dateTimeOriginal?: string;
  artist?: string;
}

export function buildJpegWithExif(opts: JpegFixtureOptions = {}): Uint8Array {
  const dataUrl = `data:image/jpeg;base64,${BASE_JPEG_B64}`;

  const zeroth: Record<number, unknown> = {};
  const exif: Record<number, unknown> = {};
  const gps: Record<number, unknown> = {};

  if (opts.make) zeroth[piexif.ImageIFD.Make] = opts.make;
  if (opts.model) zeroth[piexif.ImageIFD.Model] = opts.model;
  if (opts.software) zeroth[piexif.ImageIFD.Software] = opts.software;
  if (opts.artist) zeroth[piexif.ImageIFD.Artist] = opts.artist;
  if (opts.dateTimeOriginal) exif[piexif.ExifIFD.DateTimeOriginal] = opts.dateTimeOriginal;

  if (opts.gpsLat !== undefined) {
    gps[piexif.GPSIFD.GPSLatitudeRef] = opts.gpsLat >= 0 ? 'N' : 'S';
    gps[piexif.GPSIFD.GPSLatitude] = decimalToDMSRational(opts.gpsLat);
  }
  if (opts.gpsLng !== undefined) {
    gps[piexif.GPSIFD.GPSLongitudeRef] = opts.gpsLng >= 0 ? 'E' : 'W';
    gps[piexif.GPSIFD.GPSLongitude] = decimalToDMSRational(opts.gpsLng);
  }

  const exifObj = { '0th': zeroth, Exif: exif, GPS: gps };
  const exifBytes = piexif.dump(exifObj);
  const newDataUrl = piexif.insert(exifBytes, dataUrl);
  const newBase64 = newDataUrl.split(',')[1];
  return binaryStringToUint8(base64ToBinaryString(newBase64));
}

export function buildPlainJpeg(): Uint8Array {
  return binaryStringToUint8(base64ToBinaryString(BASE_JPEG_B64));
}
