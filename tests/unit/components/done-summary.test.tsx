import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DoneSummary } from '../../../src/components/DoneSummary';

describe('DoneSummary', () => {
  it('shows the confirmation heading', () => {
    render(<DoneSummary removedCategories={['Location']} onReset={() => {}} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/clean\. ready to share\./i);
  });

  it('lists each removed category', () => {
    render(<DoneSummary removedCategories={['Location', 'Device', 'Timestamps']} onReset={() => {}} />);
    expect(screen.getByText(/removed location/i)).toBeInTheDocument();
    expect(screen.getByText(/removed device/i)).toBeInTheDocument();
    expect(screen.getByText(/removed timestamps/i)).toBeInTheDocument();
  });

  it('shows the empty state when no categories were removed', () => {
    render(<DoneSummary removedCategories={[]} onReset={() => {}} />);
    expect(screen.getByText(/nothing to strip\. already clean\./i)).toBeInTheDocument();
  });

  it('invokes onReset when the reset link is clicked', async () => {
    const onReset = vi.fn();
    render(<DoneSummary removedCategories={[]} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /do another/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('renders paired phrases for Location and Device', () => {
    render(<DoneSummary removedCategories={['Location', 'Device']} onReset={() => {}} />);
    expect(screen.getByText(/where you were/i)).toBeInTheDocument();
    expect(screen.getByText(/what you shot with/i)).toBeInTheDocument();
  });
});
