import { describe, it, expect } from 'vitest';
import { categorize } from '../../src/lib/categorize';

describe('categorize', () => {
  it('routes GPS fields to Location', () => {
    const result = categorize({
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
      GPSAltitude: 15.2,
    }, 'jpeg');
    const locations = result.filter(f => f.category === 'Location');
    expect(locations.map(f => f.rawKey).sort()).toEqual(
      ['GPSAltitude', 'GPSLatitude', 'GPSLongitude'],
    );
  });

  it('routes Make/Model/Software to Device', () => {
    const result = categorize({
      Make: 'Apple',
      Model: 'iPhone 15 Pro',
      Software: '17.4.1',
    }, 'jpeg');
    const devices = result.filter(f => f.category === 'Device');
    expect(devices).toHaveLength(3);
    expect(devices.find(f => f.rawKey === 'Model')?.value).toBe('iPhone 15 Pro');
  });

  it('routes DateTimeOriginal to Timestamps', () => {
    const result = categorize({ DateTimeOriginal: '2024:06:15 14:32:11' }, 'jpeg');
    const stamps = result.filter(f => f.category === 'Timestamps');
    expect(stamps).toHaveLength(1);
    expect(stamps[0].label).toBe('Capture time');
  });

  it('routes PDF Author/Creator/Producer to Identity', () => {
    const result = categorize({
      Author: 'Jane Doe',
      Creator: 'Microsoft Word',
      Producer: 'Word for Microsoft 365',
    }, 'pdf');
    const ids = result.filter(f => f.category === 'Identity');
    expect(ids).toHaveLength(3);
  });

  it('routes unknown fields to Other', () => {
    const result = categorize({ Orientation: 6, ColorSpace: 1 }, 'jpeg');
    const others = result.filter(f => f.category === 'Other');
    expect(others).toHaveLength(2);
  });

  it('drops empty and null values', () => {
    const result = categorize({
      Make: '',
      Model: null,
      Software: undefined,
      Producer: 'Word',
    }, 'jpeg');
    expect(result).toHaveLength(1);
    expect(result[0].rawKey).toBe('Producer');
  });

  it('formats GPS numbers with fixed precision', () => {
    const result = categorize({ GPSLatitude: 37.774900123 }, 'jpeg');
    expect(result[0].value).toBe('37.774900° N');
  });

  it('shows S for negative latitude', () => {
    const result = categorize({ GPSLatitude: -33.868820 }, 'jpeg');
    expect(result[0].value).toContain('S');
    expect(result[0].value).not.toContain('-');
  });

  it('shows W for negative longitude', () => {
    const result = categorize({ GPSLongitude: -122.4194 }, 'jpeg');
    expect(result[0].value).toContain('W');
  });

  it('humanizes unknown GPS keys without mangling prefix', () => {
    const result = categorize({ GPSImgDirection: 123.45 }, 'jpeg');
    const gpsField = result.find(f => f.rawKey === 'GPSImgDirection');
    expect(gpsField).toBeDefined();
    expect(gpsField?.category).toBe('Location');
    expect(gpsField?.label).toBe('GPS Img Direction');
  });

  it('is deterministic (stable ordering)', () => {
    const raw = { Model: 'A', Make: 'B', GPSLatitude: 1, Producer: 'C' };
    const a = categorize(raw, 'jpeg').map(f => f.rawKey);
    const b = categorize(raw, 'jpeg').map(f => f.rawKey);
    expect(a).toEqual(b);
  });
});
