import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from '../../../src/components/DropZone';

function makeFile(name = 'photo.jpg', type = 'image/jpeg'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('DropZone', () => {
  it('renders the prompt text', () => {
    render(<DropZone onFile={() => {}} />);
    expect(screen.getByText(/drop a photo\. see what it says about you/i)).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG, HEIC, or PDF/i)).toBeInTheDocument();
  });

  it('calls onFile when a file is picked via the input', async () => {
    const onFile = vi.fn();
    render(<DropZone onFile={onFile} />);
    const input = screen.getByLabelText(/drop a photo/i) as HTMLInputElement;
    await userEvent.upload(input, makeFile('a.jpg'));
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile.mock.calls[0][0].name).toBe('a.jpg');
  });

  it('calls onFile when a file is dropped', () => {
    const onFile = vi.fn();
    const { container } = render(<DropZone onFile={onFile} />);
    const label = container.querySelector('.dropzone')!;
    fireEvent.drop(label, {
      dataTransfer: { files: [makeFile('drop.png', 'image/png')] },
    });
    expect(onFile).toHaveBeenCalledOnce();
    expect(onFile.mock.calls[0][0].name).toBe('drop.png');
  });

  it('adds the active class during drag over and removes on leave', () => {
    const { container } = render(<DropZone onFile={() => {}} />);
    const label = container.querySelector('.dropzone')!;
    expect(label.className).not.toContain('dropzone--active');
    fireEvent.dragOver(label);
    expect(label.className).toContain('dropzone--active');
    fireEvent.dragLeave(label);
    expect(label.className).not.toContain('dropzone--active');
  });

  it('drop clears the active class', () => {
    const { container } = render(<DropZone onFile={() => {}} />);
    const label = container.querySelector('.dropzone')!;
    fireEvent.dragOver(label);
    expect(label.className).toContain('dropzone--active');
    fireEvent.drop(label, { dataTransfer: { files: [makeFile()] } });
    expect(label.className).not.toContain('dropzone--active');
  });

  it('input has an accessible label', () => {
    render(<DropZone onFile={() => {}} />);
    expect(screen.getByLabelText(/drop a photo\. see what it says about you/i)).toBeInTheDocument();
  });
});
