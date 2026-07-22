import piexif from 'piexifjs';
import { uint8ToBinaryString, binaryStringToUint8, base64ToBinaryString } from '../../src/lib/binary';

export { uint8ToBinaryString, binaryStringToUint8, base64ToBinaryString };

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

// ---------------------------------------------------------------------------
// PDF fixtures (pdf-lib)
// ---------------------------------------------------------------------------

import { PDFDocument } from 'pdf-lib';

export interface PdfFixtureOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export async function buildAuthoredPdf(opts: PdfFixtureOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([612, 792]);
  if (opts.title) doc.setTitle(opts.title);
  if (opts.author) doc.setAuthor(opts.author);
  if (opts.subject) doc.setSubject(opts.subject);
  if (opts.keywords) doc.setKeywords(opts.keywords);
  if (opts.creator) doc.setCreator(opts.creator);
  if (opts.producer) doc.setProducer(opts.producer);
  if (opts.creationDate) doc.setCreationDate(opts.creationDate);
  if (opts.modificationDate) doc.setModificationDate(opts.modificationDate);
  return doc.save({ useObjectStreams: false });
}

export async function buildBarePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([612, 792]);
  return doc.save({ useObjectStreams: false });
}

// ---------------------------------------------------------------------------
// PNG fixtures (chunk-level byte manipulation)
// ---------------------------------------------------------------------------

export const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// Minimal 1x1 transparent PNG (public-domain, no ancillary chunks).
export const BASE_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function findChunkOffset(bytes: Uint8Array, type: string): number {
  let offset = 8; // skip PNG signature
  while (offset + 8 <= bytes.length) {
    const length = (
      (bytes[offset] << 24) | (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) | bytes[offset + 3]
    ) >>> 0;
    const match =
      bytes[offset + 4] === type.charCodeAt(0) &&
      bytes[offset + 5] === type.charCodeAt(1) &&
      bytes[offset + 6] === type.charCodeAt(2) &&
      bytes[offset + 7] === type.charCodeAt(3);
    if (match) return offset;
    offset += 4 + 4 + length + 4;
  }
  return -1;
}

export function hasPngChunk(bytes: Uint8Array, type: string): boolean {
  return findChunkOffset(bytes, type) !== -1;
}

export function buildPngWithText(entries: Array<[string, string]>): Uint8Array {
  const baseBytes = binaryStringToUint8(base64ToBinaryString(BASE_PNG_B64));
  for (let i = 0; i < 8; i++) {
    if (baseBytes[i] !== PNG_SIGNATURE[i]) throw new Error('base PNG malformed');
  }

  const iendOffset = findChunkOffset(baseBytes, 'IEND');
  if (iendOffset === -1) throw new Error('base PNG has no IEND');

  const preIend = baseBytes.subarray(0, iendOffset);
  const iendChunk = baseBytes.subarray(iendOffset, iendOffset + 12);

  const enc = new TextEncoder();
  const textChunks: Uint8Array[] = [];
  for (const [key, value] of entries) {
    const keyBytes = enc.encode(key);
    const valBytes = enc.encode(value);
    // tEXt: key + NUL + value
    const data = new Uint8Array(keyBytes.length + 1 + valBytes.length);
    data.set(keyBytes, 0);
    data[keyBytes.length] = 0x00;
    data.set(valBytes, keyBytes.length + 1);

    const typeBytes = enc.encode('tEXt');
    const crcInput = new Uint8Array(4 + data.length);
    crcInput.set(typeBytes, 0);
    crcInput.set(data, 4);
    const checksum = crc32(crcInput);

    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    writeUint32BE(chunk, 0, data.length);
    chunk.set(typeBytes, 4);
    chunk.set(data, 8);
    writeUint32BE(chunk, 8 + data.length, checksum);
    textChunks.push(chunk);
  }

  const totalTextLen = textChunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(preIend.length + totalTextLen + iendChunk.length);
  out.set(preIend, 0);
  let cursor = preIend.length;
  for (const chunk of textChunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  out.set(iendChunk, cursor);
  return out;
}
