import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DoneSummary } from '../../../src/components/DoneSummary';

describe('DoneSummary', () => {
  it('shows the confirmation heading', () => {
    render(<DoneSummary removedCategories={['Location']} onReset={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/done\. your file is clean\./i);
  });

  it('lists each removed category', () => {
    render(<DoneSummary removedCategories={['Location', 'Device', 'Timestamps']} onReset={() => {}} />);
    expect(screen.getByText(/removed location/i)).toBeInTheDocument();
    expect(screen.getByText(/removed device/i)).toBeInTheDocument();
    expect(screen.getByText(/removed timestamps/i)).toBeInTheDocument();
  });

  it('shows the empty state when no categories were removed', () => {
    render(<DoneSummary removedCategories={[]} onReset={() => {}} />);
    expect(screen.getByText(/the file had no metadata to remove/i)).toBeInTheDocument();
  });

  it('invokes onReset when the reset link is clicked', async () => {
    const onReset = vi.fn();
    render(<DoneSummary removedCategories={[]} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /scrub another file/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
