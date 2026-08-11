import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { scrubPdf } from '../../src/lib/scrub/pdf';
import { readPdf } from '../../src/lib/read/pdf';
import { buildAuthoredPdf } from '../fixtures/programmatic';

describe('scrubPdf', () => {
  it('removes Author/Creator/Producer/Title from info dictionary', async () => {
    const dirty = await buildAuthoredPdf({
      title: 'Q3 Report',
      author: 'Jane Doe',
      creator: 'Microsoft Word',
      producer: 'Word for Microsoft 365',
    });
    const { bytes: cleaned } = await scrubPdf(dirty, 'report.pdf');
    const findings = await readPdf(cleaned);
    expect(findings.filter(f => f.category === 'Identity')).toEqual([]);
  });

  it('removes CreationDate and ModDate', async () => {
    const dirty = await buildAuthoredPdf({
      creationDate: new Date('2024-06-15T14:32:11Z'),
      modificationDate: new Date('2024-07-01T09:00:00Z'),
    });
    const { bytes: cleaned } = await scrubPdf(dirty, 'doc.pdf');
    const findings = await readPdf(cleaned);
    expect(findings.filter(f => f.category === 'Timestamps')).toEqual([]);
  });

  it('preserves the page count', async () => {
    const dirty = await buildAuthoredPdf({ author: 'Jane' });
    const { bytes: cleaned } = await scrubPdf(dirty, 'doc.pdf');
    const dirtyDoc = await PDFDocument.load(dirty);
    const cleanedDoc = await PDFDocument.load(cleaned);
    expect(cleanedDoc.getPageCount()).toBe(dirtyDoc.getPageCount());
  });

  it('output starts with %PDF magic bytes', async () => {
    const dirty = await buildAuthoredPdf({ author: 'Jane' });
    const { bytes: cleaned } = await scrubPdf(dirty, 'doc.pdf');
    expect(cleaned[0]).toBe(0x25); // %
    expect(cleaned[1]).toBe(0x50); // P
    expect(cleaned[2]).toBe(0x44); // D
    expect(cleaned[3]).toBe(0x46); // F
  });

  it('produces -cleaned.pdf filename', async () => {
    const dirty = await buildAuthoredPdf({ author: 'Jane' });
    const result = await scrubPdf(dirty, 'my-report.pdf');
    expect(result.outputName).toBe('my-report-cleaned.pdf');
    expect(result.outputMime).toBe('application/pdf');
  });
});
