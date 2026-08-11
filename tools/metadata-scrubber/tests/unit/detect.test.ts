import { describe, it, expect } from 'vitest';
import { detectFileKind } from '../../src/lib/detect';

function bytes(...hex: number[]): Uint8Array {
  return new Uint8Array(hex);
}

function buildHeicBytes(brand: string): Uint8Array {
  const size = new Uint8Array([0, 0, 0, 24]); // 24-byte ftyp box, arbitrary
  const ftyp = new TextEncoder().encode('ftyp');
  const brandBytes = new TextEncoder().encode(brand);
  const rest = new Uint8Array(12); // filler to reach 24 bytes
  const out = new Uint8Array(4 + 4 + 4 + 12);
  out.set(size, 0);
  out.set(ftyp, 4);
  out.set(brandBytes, 8);
  out.set(rest, 12);
  return out;
}

describe('detectFileKind', () => {
  it('detects JPEG by FFD8FF magic', () => {
    expect(detectFileKind(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0))).toBe('jpeg');
  });

  it('detects PNG by 89504E47 magic', () => {
    expect(detectFileKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
  });

  it('detects HEIC via ftypheic', () => {
    expect(detectFileKind(buildHeicBytes('heic'))).toBe('heic');
  });

  it('detects HEIC via ftypheix', () => {
    expect(detectFileKind(buildHeicBytes('heix'))).toBe('heic');
  });

  it('detects HEIC via ftypmif1', () => {
    expect(detectFileKind(buildHeicBytes('mif1'))).toBe('heic');
  });

  it('detects HEIC via ftyphevc', () => {
    expect(detectFileKind(buildHeicBytes('hevc'))).toBe('heic');
  });

  it('detects PDF by %PDF magic', () => {
    expect(detectFileKind(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37))).toBe('pdf');
  });

  it('rejects a file that says .jpg but has wrong bytes', () => {
    expect(detectFileKind(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe('unknown');
  });

  it('returns unknown for empty input', () => {
    expect(detectFileKind(new Uint8Array(0))).toBe('unknown');
  });
});
