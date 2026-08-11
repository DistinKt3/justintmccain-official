export function withCleanedSuffix(originalName: string, ext: string): string {
  const dot = originalName.lastIndexOf('.');
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  return `${stem}-cleaned.${ext}`;
}
