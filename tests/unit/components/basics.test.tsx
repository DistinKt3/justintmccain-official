import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyBadge } from '../../../src/components/PrivacyBadge';
import { FileHeader } from '../../../src/components/FileHeader';
import { Skeleton } from '../../../src/components/Skeleton';

describe('PrivacyBadge', () => {
  it('states files never leave the device', () => {
    render(<PrivacyBadge />);
    expect(screen.getByText(/nothing leaves this tab/i)).toBeInTheDocument();
  });
});

describe('FileHeader', () => {
  it('renders name and formatted size', () => {
    render(<FileHeader name="photo.jpg" size={2048} onReset={() => {}} />);
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('formats MB for larger files', () => {
    render(<FileHeader name="doc.pdf" size={3 * 1024 * 1024} onReset={() => {}} />);
    expect(screen.getByText('3.0 MB')).toBeInTheDocument();
  });

  it('invokes onReset when the reset button is clicked', async () => {
    const onReset = vi.fn();
    render(<FileHeader name="x" size={1} onReset={onReset} />);
    await userEvent.click(screen.getByRole('button', { name: /start over/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});

describe('Skeleton', () => {
  it('is aria-hidden and has 5 skeleton rows', () => {
    const { container } = render(<Skeleton />);
    const wrapper = container.querySelector('.skeleton');
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.skeleton__row')).toHaveLength(5);
  });
});
