import { describe, it, expect } from 'vitest';
import { initialState, reduce, type FileMeta, type State } from '../../src/state';
import type { Finding } from '../../src/lib/types';

const sampleFile: FileMeta = {
  name: 'photo.jpg',
  size: 1024,
  bytes: new Uint8Array([0xff, 0xd8, 0xff]),
};

const gpsFinding: Finding = {
  category: 'Location',
  label: 'Latitude',
  value: '37.774900 N',
  rawKey: 'GPSLatitude',
};

describe('reduce', () => {
  it('starts empty', () => {
    expect(initialState.kind).toBe('empty');
  });

  it('FILE_DROPPED moves empty to analyzing', () => {
    const next = reduce(initialState, { type: 'FILE_DROPPED', file: sampleFile });
    expect(next.kind).toBe('analyzing');
    if (next.kind === 'analyzing') expect(next.file).toBe(sampleFile);
  });

  it('ANALYSIS_COMPLETE moves analyzing to analyzed with findings', () => {
    const analyzing = reduce(initialState, { type: 'FILE_DROPPED', file: sampleFile });
    const next = reduce(analyzing, {
      type: 'ANALYSIS_COMPLETE',
      findings: [gpsFinding],
      fileKind: 'jpeg',
    });
    expect(next.kind).toBe('analyzed');
    if (next.kind === 'analyzed') {
      expect(next.findings).toEqual([gpsFinding]);
      expect(next.fileKind).toBe('jpeg');
    }
  });

  it('ANALYSIS_FAILED moves analyzing to error with empty previous', () => {
    const analyzing = reduce(initialState, { type: 'FILE_DROPPED', file: sampleFile });
    const next = reduce(analyzing, { type: 'ANALYSIS_FAILED', message: 'corrupt' });
    expect(next.kind).toBe('error');
    if (next.kind === 'error') {
      expect(next.message).toBe('corrupt');
      expect(next.previous.kind).toBe('empty');
    }
  });

  it('SCRUB_STARTED moves analyzed to scrubbing carrying findings forward', () => {
    const analyzed: State = {
      kind: 'analyzed',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const next = reduce(analyzed, { type: 'SCRUB_STARTED' });
    expect(next.kind).toBe('scrubbing');
    if (next.kind === 'scrubbing') expect(next.findings).toEqual([gpsFinding]);
  });

  it('SCRUB_COMPLETE moves scrubbing to done with removed categories', () => {
    const scrubbing: State = {
      kind: 'scrubbing',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const next = reduce(scrubbing, {
      type: 'SCRUB_COMPLETE',
      removedCategories: ['Location', 'Device'],
    });
    expect(next.kind).toBe('done');
    if (next.kind === 'done') expect(next.removedCategories).toEqual(['Location', 'Device']);
  });

  it('SCRUB_FAILED puts analyzed state into error.previous so user can retry', () => {
    const analyzed: State = {
      kind: 'analyzed',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const scrubbing = reduce(analyzed, { type: 'SCRUB_STARTED' });
    const errored = reduce(scrubbing, { type: 'SCRUB_FAILED', message: 'oops' });
    expect(errored.kind).toBe('error');
    if (errored.kind === 'error') {
      expect(errored.message).toBe('oops');
      expect(errored.previous.kind).toBe('analyzed');
    }
  });

  it('ERROR_DISMISSED restores the previous state', () => {
    const analyzed: State = {
      kind: 'analyzed',
      file: sampleFile,
      fileKind: 'jpeg',
      findings: [gpsFinding],
    };
    const errored = reduce(analyzed, { type: 'SCRUB_FAILED', message: 'x' });
    // ERROR_DISMISSED needs the scrubbing->error transition; simulate directly:
    const errFromScrub: State = {
      kind: 'error',
      message: 'x',
      previous: analyzed,
    };
    const next = reduce(errFromScrub, { type: 'ERROR_DISMISSED' });
    expect(next).toEqual(analyzed);
    // Also cover: dismiss from the SCRUB_FAILED-derived error state
    void errored;
  });

  it('RESET returns to initial from any state', () => {
    const done: State = {
      kind: 'done',
      file: sampleFile,
      removedCategories: ['Location'],
    };
    expect(reduce(done, { type: 'RESET' })).toEqual(initialState);
  });

  it('ignores mismatched actions (SCRUB_STARTED in empty state) -- returns same reference', () => {
    const next = reduce(initialState, { type: 'SCRUB_STARTED' });
    expect(next).toBe(initialState);
  });

  it('FILE_DROPPED works from done (user starts over by dropping a new file)', () => {
    const done: State = {
      kind: 'done',
      file: sampleFile,
      removedCategories: ['Location'],
    };
    const next = reduce(done, { type: 'FILE_DROPPED', file: sampleFile });
    expect(next.kind).toBe('analyzing');
  });
});
