import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrubButton } from '../../../src/components/ScrubButton';

describe('ScrubButton', () => {
  it('renders the primary label when not loading', () => {
    render(<ScrubButton loading={false} onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /strip it clean/i })).toBeInTheDocument();
  });

  it('renders the loading label and is disabled when loading', () => {
    render(<ScrubButton loading={true} onClick={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent(/stripping/i);
  });

  it('invokes onClick when clicked and not loading', async () => {
    const onClick = vi.fn();
    render(<ScrubButton loading={false} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not invoke onClick when clicked while loading', async () => {
    const onClick = vi.fn();
    render(<ScrubButton loading={true} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
