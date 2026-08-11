import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import type { ScrubResult } from '../types';
import { withCleanedSuffix } from './naming';

const INFO_KEYS = [
  'Title', 'Author', 'Subject', 'Keywords',
  'Creator', 'Producer', 'CreationDate', 'ModDate',
];

export async function scrubPdf(
  bytes: Uint8Array,
  originalName: string,
): Promise<ScrubResult> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });

  const infoRef = doc.context.trailerInfo.Info;
  if (infoRef) {
    const info = doc.context.lookup(infoRef);
    if (info instanceof PDFDict) {
      for (const key of INFO_KEYS) {
        info.delete(PDFName.of(key));
      }
    }
  }

  const metadataKey = PDFName.of('Metadata');
  if (doc.catalog.get(metadataKey)) {
    doc.catalog.delete(metadataKey);
  }

  const out = await doc.save({ useObjectStreams: false });
  return {
    bytes: out,
    outputName: withCleanedSuffix(originalName, 'pdf'),
    outputMime: 'application/pdf',
  };
}
