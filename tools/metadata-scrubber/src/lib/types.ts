export type FileKind = 'jpeg' | 'png' | 'heic' | 'pdf' | 'unknown';

export type Category = 'Location' | 'Device' | 'Timestamps' | 'Identity' | 'Other';

export interface Finding {
  category: Category;
  label: string;
  value: string;
  rawKey: string;
}

export interface ScrubResult {
  bytes: Uint8Array;
  outputName: string;
  outputMime: string;
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
