interface Props {
  name: string;
  size: number;
  onReset: () => void;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function FileHeader({ name, size, onReset }: Props) {
  return (
    <div className="file-header">
      <span className="file-header__name">{name}</span>
      <span className="file-header__size">{formatBytes(size)}</span>
      <button type="button" className="file-header__reset" onClick={onReset}>
        Start over
      </button>
    </div>
  );
}
