import { PDFDocument, PDFName } from 'pdf-lib';
import { categorize } from '../categorize';
import type { Finding } from '../types';

export async function readPdf(bytes: Uint8Array): Promise<Finding[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const raw: Record<string, unknown> = {};

  const title = doc.getTitle();
  const author = doc.getAuthor();
  const subject = doc.getSubject();
  const keywords = doc.getKeywords();
  const creator = doc.getCreator();
  const producer = doc.getProducer();
  const creationDate = doc.getCreationDate();
  const modificationDate = doc.getModificationDate();

  if (title) raw.Title = title;
  if (author) raw.Author = author;
  if (subject) raw.Subject = subject;
  if (keywords) raw.Keywords = keywords;
  if (creator) raw.Creator = creator;
  if (producer) raw.Producer = producer;
  if (creationDate) raw.CreationDate = creationDate;
  if (modificationDate) raw.ModDate = modificationDate;

  const catalog = doc.catalog;
  const metadataRef = catalog.get(PDFName.of('Metadata'));
  if (metadataRef) {
    raw.XMPMetadata = 'present';
  }

  return categorize(raw, 'pdf');
}
