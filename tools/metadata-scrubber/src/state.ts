import type { Category, FileKind, Finding } from './lib/types';

export interface FileMeta {
  name: string;
  size: number;
  bytes: Uint8Array;
}

export type State =
  | { kind: 'empty' }
  | { kind: 'analyzing'; file: FileMeta }
  | {
      kind: 'analyzed';
      file: FileMeta;
      fileKind: FileKind;
      findings: Finding[];
    }
  | {
      kind: 'scrubbing';
      file: FileMeta;
      fileKind: FileKind;
      findings: Finding[];
    }
  | {
      kind: 'done';
      file: FileMeta;
      removedCategories: Category[];
    }
  | { kind: 'error'; message: string; previous: State };

export type Action =
  | { type: 'FILE_DROPPED'; file: FileMeta }
  | { type: 'ANALYSIS_COMPLETE'; findings: Finding[]; fileKind: FileKind }
  | { type: 'ANALYSIS_FAILED'; message: string }
  | { type: 'SCRUB_STARTED' }
  | { type: 'SCRUB_COMPLETE'; removedCategories: Category[] }
  | { type: 'SCRUB_FAILED'; message: string }
  | { type: 'ERROR_DISMISSED' }
  | { type: 'RESET' };

export const initialState: State = { kind: 'empty' };

export function reduce(state: State, action: Action): State {
  switch (action.type) {
    case 'FILE_DROPPED': {
      if (
        state.kind === 'empty' ||
        state.kind === 'analyzed' ||
        state.kind === 'done' ||
        state.kind === 'error'
      ) {
        return { kind: 'analyzing', file: action.file };
      }
      return state;
    }

    case 'ANALYSIS_COMPLETE':
      if (state.kind !== 'analyzing') return state;
      return {
        kind: 'analyzed',
        file: state.file,
        fileKind: action.fileKind,
        findings: action.findings,
      };

    case 'ANALYSIS_FAILED':
      if (state.kind !== 'analyzing') return state;
      return {
        kind: 'error',
        message: action.message,
        previous: initialState,
      };

    case 'SCRUB_STARTED':
      if (state.kind !== 'analyzed') return state;
      return {
        kind: 'scrubbing',
        file: state.file,
        fileKind: state.fileKind,
        findings: state.findings,
      };

    case 'SCRUB_COMPLETE':
      if (state.kind !== 'scrubbing') return state;
      return {
        kind: 'done',
        file: state.file,
        removedCategories: action.removedCategories,
      };

    case 'SCRUB_FAILED':
      if (state.kind !== 'scrubbing') return state;
      return {
        kind: 'error',
        message: action.message,
        previous: {
          kind: 'analyzed',
          file: state.file,
          fileKind: state.fileKind,
          findings: state.findings,
        },
      };

    case 'ERROR_DISMISSED':
      if (state.kind !== 'error') return state;
      return state.previous;

    case 'RESET':
      return initialState;
  }
}
