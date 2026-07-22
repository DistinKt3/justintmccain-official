import { describe, it, expect } from 'vitest';
import { scrubJpeg } from '../../src/lib/scrub/jpeg';
import { readImage } from '../../src/lib/read/image';
import { buildJpegWithExif } from '../fixtures/programmatic';

describe('scrubJpeg', () => {
  it('removes GPS metadata (round-trip via readImage)', async () => {
    const dirty = buildJpegWithExif({ gpsLat: 37.7749, gpsLng: -122.4194 });
    const { bytes: cleaned } = scrubJpeg(dirty, 'photo.jpg');
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Location')).toEqual([]);
  });

  it('removes device metadata (round-trip)', async () => {
    const dirty = buildJpegWithExif({ make: 'Apple', model: 'iPhone 15 Pro' });
    const { bytes: cleaned } = scrubJpeg(dirty, 'photo.jpg');
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Device')).toEqual([]);
  });

  it('removes capture timestamp (round-trip)', async () => {
    const dirty = buildJpegWithExif({ dateTimeOriginal: '2024:06:15 14:32:11' });
    const { bytes: cleaned } = scrubJpeg(dirty, 'photo.jpg');
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Timestamps')).toEqual([]);
  });

  it('produces a filename with -cleaned.jpg suffix', () => {
    const dirty = buildJpegWithExif({ make: 'Apple' });
    const result = scrubJpeg(dirty, 'IMG_1234.jpg');
    expect(result.outputName).toBe('IMG_1234-cleaned.jpg');
    expect(result.outputMime).toBe('image/jpeg');
  });

  it('handles filenames with multiple dots', () => {
    const dirty = buildJpegWithExif({});
    const result = scrubJpeg(dirty, 'photo.foo.jpg');
    expect(result.outputName).toBe('photo.foo-cleaned.jpg');
  });

  it('handles filenames with no extension', () => {
    const dirty = buildJpegWithExif({});
    const result = scrubJpeg(dirty, 'photo');
    expect(result.outputName).toBe('photo-cleaned.jpg');
  });

  it('output still starts with JPEG magic bytes', () => {
    const dirty = buildJpegWithExif({ make: 'Apple' });
    const { bytes } = scrubJpeg(dirty, 'test.jpg');
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
    expect(bytes[2]).toBe(0xff);
  });
});
