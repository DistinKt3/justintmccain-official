import { useReducer, useCallback, useEffect } from 'react';
import { Masthead } from './components/Masthead';
import { DropZone } from './components/DropZone';
import { FileHeader } from './components/FileHeader';
import { MetadataReport } from './components/MetadataReport';
import { ScrubButton } from './components/ScrubButton';
import { DoneSummary } from './components/DoneSummary';
import { ErrorBanner } from './components/ErrorBanner';
import { Skeleton } from './components/Skeleton';
import { initialState, reduce, type FileMeta } from './state';
import { detectFileKind } from './lib/detect';
import { readImage } from './lib/read/image';
import { readPdf } from './lib/read/pdf';
import { scrubJpeg } from './lib/scrub/jpeg';
import { scrubPng } from './lib/scrub/png';
import { scrubHeic } from './lib/scrub/heic';
import { scrubPdf } from './lib/scrub/pdf';
import {
  MAX_FILE_BYTES,
  type Category,
  type FileKind,
  type Finding,
  type ScrubResult,
} from './lib/types';

const ERR_UNSUPPORTED = 'JPEG, PNG, HEIC, or PDF only.';
const ERR_OVERSIZED = 'Too big. 25 MB max.';
const ERR_CORRUPT = "Can't read this file. It may be broken or locked.";
const ERR_SCRUB = 'Strip failed. Try again.';

async function readMetadata(bytes: Uint8Array, kind: FileKind): Promise<Finding[]> {
  switch (kind) {
    case 'jpeg':
    case 'png':
    case 'heic':
      return readImage(bytes);
    case 'pdf':
      return readPdf(bytes);
    case 'unknown':
      return [];
  }
}

async function scrubByKind(
  bytes: Uint8Array,
  kind: FileKind,
  name: string,
): Promise<ScrubResult> {
  switch (kind) {
    case 'jpeg': return scrubJpeg(bytes, name);
    case 'png':  return scrubPng(bytes, name);
    case 'heic': return scrubHeic(bytes, name);
    case 'pdf':  return scrubPdf(bytes, name);
    case 'unknown': throw new Error('Unsupported file kind');
  }
}

function triggerDownload(bytes: Uint8Array, filename: string, mime: string): void {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function App() {
  const [state, dispatch] = useReducer(reduce, initialState);

  const onFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      const meta: FileMeta = { name: file.name, size: file.size, bytes: new Uint8Array() };
      dispatch({ type: 'FILE_DROPPED', file: meta });
      dispatch({ type: 'ANALYSIS_FAILED', message: ERR_OVERSIZED });
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const meta: FileMeta = { name: file.name, size: file.size, bytes };
    dispatch({ type: 'FILE_DROPPED', file: meta });

    const kind = detectFileKind(bytes);
    if (kind === 'unknown') {
      dispatch({ type: 'ANALYSIS_FAILED', message: ERR_UNSUPPORTED });
      return;
    }
    try {
      const findings = await readMetadata(bytes, kind);
      dispatch({ type: 'ANALYSIS_COMPLETE', findings, fileKind: kind });
    } catch {
      dispatch({ type: 'ANALYSIS_FAILED', message: ERR_CORRUPT });
    }
  }, []);

  const onScrub = useCallback(async () => {
    if (state.kind !== 'analyzed') return;
    const { file, fileKind, findings } = state;
    dispatch({ type: 'SCRUB_STARTED' });
    try {
      const result = await scrubByKind(file.bytes, fileKind, file.name);
      triggerDownload(result.bytes, result.outputName, result.outputMime);
      const removedCategories = Array.from(new Set(findings.map(f => f.category))) as Category[];
      dispatch({ type: 'SCRUB_COMPLETE', removedCategories });
    } catch {
      dispatch({ type: 'SCRUB_FAILED', message: ERR_SCRUB });
    }
  }, [state]);

  const onReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const onDismiss = useCallback(() => dispatch({ type: 'ERROR_DISMISSED' }), []);

  useEffect(() => {
    let selector: string | null = null;
    switch (state.kind) {
      case 'analyzed':   selector = '.scrub-button'; break;
      case 'done':       selector = '.done__heading'; break;
      case 'error':      selector = '.error-banner__dismiss'; break;
      case 'empty':      selector = '.dropzone'; break;
      default:           selector = null;
    }
    if (!selector) return;
    const target = document.querySelector<HTMLElement>(selector);
    if (target && 'focus' in target) target.focus();
  }, [state.kind]);

  const errorMessage = state.kind === 'error' ? state.message : null;
  const currentContent = state.kind === 'error' ? state.previous : state;
  const heicNote =
    currentContent.kind === 'analyzed' && currentContent.fileKind === 'heic';

  return (
    <main className="app">
      {errorMessage && <ErrorBanner message={errorMessage} onDismiss={onDismiss} />}
      <header className="app__header">
        <Masthead />
      </header>
      <div className="app__content" aria-live="polite">
        {currentContent.kind === 'empty' && <DropZone onFile={onFile} />}

        {currentContent.kind === 'analyzing' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <Skeleton />
          </>
        )}

        {currentContent.kind === 'analyzed' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <MetadataReport findings={currentContent.findings} heicNote={heicNote} />
            {currentContent.findings.length > 0 && (
              <div className="app__actions">
                <ScrubButton loading={false} onClick={onScrub} />
              </div>
            )}
          </>
        )}

        {currentContent.kind === 'scrubbing' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <MetadataReport findings={currentContent.findings} />
            <div className="app__actions">
              <ScrubButton loading={true} onClick={onScrub} />
            </div>
          </>
        )}

        {currentContent.kind === 'done' && (
          <>
            <FileHeader
              name={currentContent.file.name}
              size={currentContent.file.size}
              onReset={onReset}
            />
            <DoneSummary
              removedCategories={currentContent.removedCategories}
              onReset={onReset}
            />
          </>
        )}
      </div>
    </main>
  );
}
