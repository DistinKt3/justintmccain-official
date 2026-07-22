import { describe, it, expect } from 'vitest';
import { readPdf } from '../../src/lib/read/pdf';
import { buildAuthoredPdf, buildBarePdf } from '../fixtures/programmatic';

describe('readPdf', () => {
  it('extracts Author, Creator, Producer from info dictionary', async () => {
    const bytes = await buildAuthoredPdf({
      author: 'Jane Doe',
      creator: 'Microsoft Word',
      producer: 'Word for Microsoft 365',
    });
    const findings = await readPdf(bytes);
    const identity = findings.filter(f => f.category === 'Identity');
    expect(identity.find(f => f.rawKey === 'Author')?.value).toBe('Jane Doe');
    expect(identity.find(f => f.rawKey === 'Creator')?.value).toBe('Microsoft Word');
    expect(identity.find(f => f.rawKey === 'Producer')?.value).toBe('Word for Microsoft 365');
  });

  it('extracts Title and Subject', async () => {
    const bytes = await buildAuthoredPdf({ title: 'Q3 Report', subject: 'Finance' });
    const findings = await readPdf(bytes);
    expect(findings.find(f => f.rawKey === 'Title')?.value).toBe('Q3 Report');
    expect(findings.find(f => f.rawKey === 'Subject')?.value).toBe('Finance');
  });

  it('extracts CreationDate as a Timestamps finding', async () => {
    const bytes = await buildAuthoredPdf({ creationDate: new Date('2024-06-15T14:32:11Z') });
    const findings = await readPdf(bytes);
    const stamps = findings.filter(f => f.category === 'Timestamps');
    expect(stamps.some(f => f.rawKey === 'CreationDate')).toBe(true);
  });

  it('returns [] for a bare PDF with no metadata', async () => {
    const bytes = await buildBarePdf();
    const findings = await readPdf(bytes);
    expect(findings).toEqual([]);
  });

  it('throws on unrecoverable parse errors (corrupt bytes)', async () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]);
    await expect(readPdf(bytes)).rejects.toThrow();
  });
});
