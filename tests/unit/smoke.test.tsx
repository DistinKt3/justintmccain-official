import { render, screen } from '@testing-library/react';
import { App } from '../../src/App';

describe('App smoke', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Metadata Scrubber');
  });
});
