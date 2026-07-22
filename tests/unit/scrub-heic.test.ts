import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { scrubHeic } from '../../src/lib/scrub/heic';
import { readImage } from '../../src/lib/read/image';

const currentDir = dirname(fileURLToPath(import.meta.url));
const heicPath = resolve(currentDir, '../fixtures/iphone.heic');
const heicExists = existsSync(heicPath);

describe.runIf(heicExists)('scrubHeic (fixture present)', () => {
  it('converts HEIC input to a JPEG output with no Location or Device findings', async () => {
    const bytes = new Uint8Array(readFileSync(heicPath));
    const { bytes: cleaned, outputMime, outputName } = await scrubHeic(bytes, 'IMG_0001.heic');
    expect(outputMime).toBe('image/jpeg');
    expect(outputName).toBe('IMG_0001-cleaned.jpg');
    expect(cleaned[0]).toBe(0xff);
    expect(cleaned[1]).toBe(0xd8);
    const findings = await readImage(cleaned);
    expect(findings.filter(f => f.category === 'Location')).toEqual([]);
    expect(findings.filter(f => f.category === 'Device')).toEqual([]);
  });
});

describe.skipIf(heicExists)('scrubHeic (fixture missing)', () => {
  it('is skipped without tests/fixtures/iphone.heic; verify manually per Task 15', () => {
    expect(heicExists).toBe(false);
  });
});
