import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner } from '../../../src/components/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders the message with role=alert and aria-live=assertive', () => {
    render(<ErrorBanner message="JPEG, PNG, HEIC, or PDF only." onDismiss={() => {}} />);
    const banner = screen.getByRole('alert');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
    expect(banner).toHaveTextContent(/jpeg, png, heic, or pdf only/i);
  });

  it('invokes onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<ErrorBanner message="x" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
