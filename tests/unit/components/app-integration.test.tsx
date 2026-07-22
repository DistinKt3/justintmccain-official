import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../../src/App';
import { buildJpegWithExif } from '../../fixtures/programmatic';

beforeEach(() => {
  // jsdom doesn't fully implement createObjectURL; provide a stub.
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});

// Use applyAccept: false so files reach onChange regardless of the input's
// accept attribute — mirrors real browser behaviour where the OS file picker
// can return any file type the user selects.
const user = userEvent.setup({ applyAccept: false });

describe('App integration (happy path)', () => {
  it('drops a geotagged JPEG, sees GPS, scrubs, shows done summary', async () => {
    const bytes = buildJpegWithExif({
      gpsLat: 37.7749,
      gpsLng: -122.4194,
      make: 'Apple',
      model: 'iPhone 15 Pro',
    });
    const file = new File([bytes as Uint8Array<ArrayBuffer>], 'IMG_0001.jpg', { type: 'image/jpeg' });

    render(<App />);
    const input = screen.getByLabelText(/drop a photo/i) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/remembers where you were/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /strip it clean/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clean\. ready to share\./i })).toBeInTheDocument();
    });
    expect(screen.getByText(/removed location/i)).toBeInTheDocument();
    expect(screen.getByText(/removed device/i)).toBeInTheDocument();
  });

  it('shows an error banner when an unsupported file is dropped', async () => {
    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const file = new File([gifBytes as Uint8Array<ArrayBuffer>], 'animated.gif', { type: 'image/gif' });

    render(<App />);
    const input = screen.getByLabelText(/drop a photo/i) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/jpeg, png, heic, or pdf only/i);
    });
  });
});
