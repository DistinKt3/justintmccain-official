import { describe, it, expect } from 'vitest';
import { scrubPng } from '../../src/lib/scrub/png';
import { buildPngWithText, hasPngChunk } from '../fixtures/programmatic';

describe('scrubPng', () => {
  it('removes all tEXt chunks', () => {
    const dirty = buildPngWithText([['Author', 'Jane'], ['Software', 'Photoshop 24']]);
    expect(hasPngChunk(dirty, 'tEXt')).toBe(true);
    const { bytes } = scrubPng(dirty, 'pic.png');
    expect(hasPngChunk(bytes, 'tEXt')).toBe(false);
  });

  it('preserves IHDR, IDAT, IEND (critical chunks)', () => {
    const dirty = buildPngWithText([['Author', 'Jane']]);
    const { bytes } = scrubPng(dirty, 'pic.png');
    expect(hasPngChunk(bytes, 'IHDR')).toBe(true);
    expect(hasPngChunk(bytes, 'IDAT')).toBe(true);
    expect(hasPngChunk(bytes, 'IEND')).toBe(true);
  });

  it('output has the PNG signature', () => {
    const dirty = buildPngWithText([['x', 'y']]);
    const { bytes } = scrubPng(dirty, 'pic.png');
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
    expect(bytes[2]).toBe(0x4e);
    expect(bytes[3]).toBe(0x47);
  });

  it('produces -cleaned.png filename', () => {
    const dirty = buildPngWithText([]);
    const result = scrubPng(dirty, 'screenshot.png');
    expect(result.outputName).toBe('screenshot-cleaned.png');
    expect(result.outputMime).toBe('image/png');
  });

  it('throws on non-PNG bytes', () => {
    expect(() => scrubPng(new Uint8Array([0xff, 0xd8, 0xff]), 'not.png')).toThrow(/PNG/i);
  });
});
