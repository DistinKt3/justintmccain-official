import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

describe('App smoke', () => {
  it('renders the privacy badge on initial load', () => {
    render(<App />);
    expect(screen.getByText(/files stay on your device/i)).toBeInTheDocument();
  });

  it('renders the drop zone as the initial hero', () => {
    render(<App />);
    expect(screen.getByText(/drop a file to see what it's leaking/i)).toBeInTheDocument();
  });
});
