import { describe, it, expect } from 'vitest';
import { readImage } from '../../src/lib/read/image';
import { buildJpegWithExif, buildPlainJpeg } from '../fixtures/programmatic';

describe('readImage', () => {
  it('extracts GPS latitude and longitude from a geotagged JPEG', async () => {
    const bytes = buildJpegWithExif({ gpsLat: 37.7749, gpsLng: -122.4194 });
    const findings = await readImage(bytes);
    const locations = findings.filter(f => f.category === 'Location');
    expect(locations.some(f => f.rawKey === 'GPSLatitude')).toBe(true);
    expect(locations.some(f => f.rawKey === 'GPSLongitude')).toBe(true);
  });

  it('extracts device make and model', async () => {
    const bytes = buildJpegWithExif({ make: 'Apple', model: 'iPhone 15 Pro' });
    const findings = await readImage(bytes);
    const devices = findings.filter(f => f.category === 'Device');
    expect(devices.find(f => f.rawKey === 'Make')?.value).toBe('Apple');
    expect(devices.find(f => f.rawKey === 'Model')?.value).toBe('iPhone 15 Pro');
  });

  it('extracts capture timestamp', async () => {
    const bytes = buildJpegWithExif({ dateTimeOriginal: '2024:06:15 14:32:11' });
    const findings = await readImage(bytes);
    const stamps = findings.filter(f => f.category === 'Timestamps');
    expect(stamps.length).toBeGreaterThan(0);
  });

  it('returns an empty array for a JPEG with no EXIF', async () => {
    const bytes = buildPlainJpeg();
    const findings = await readImage(bytes);
    expect(findings).toEqual([]);
  });

  it('returns an empty array for garbage bytes rather than throwing', async () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4]);
    const findings = await readImage(bytes);
    expect(findings).toEqual([]);
  });
});
