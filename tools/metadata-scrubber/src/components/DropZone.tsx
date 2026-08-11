import { useState } from 'react';

interface Props {
  onFile: (file: File) => void;
}

const ACCEPT = 'image/jpeg,image/png,image/heic,application/pdf';

export function DropZone({ onFile }: Props) {
  const [dragActive, setDragActive] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  function onDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function onDragLeave() {
    setDragActive(false);
  }

  return (
    <label
      className={`dropzone${dragActive ? ' dropzone--active' : ''}`}
      tabIndex={-1}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        className="visually-hidden"
        aria-label="Drop a photo. See what it says about you."
      />
      <p className="dropzone__prompt">Drop a photo. See what it says about you.</p>
      <p className="dropzone__hint">JPEG, PNG, HEIC, or PDF. Up to 25 MB.</p>
      <p className="dropzone__promise">Under 30 seconds.</p>
    </label>
  );
}
