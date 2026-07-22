import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataReport } from '../../../src/components/MetadataReport';
import type { Finding } from '../../../src/lib/types';

const gpsLat: Finding = { category: 'Location', label: 'Latitude', value: '37.774900° N', rawKey: 'GPSLatitude' };
const gpsLng: Finding = { category: 'Location', label: 'Longitude', value: '122.419400° W', rawKey: 'GPSLongitude' };
const make: Finding   = { category: 'Device',   label: 'Camera make',  value: 'Apple',            rawKey: 'Make' };
const model: Finding  = { category: 'Device',   label: 'Camera model', value: 'iPhone 15 Pro',    rawKey: 'Model' };
const captured: Finding = { category: 'Timestamps', label: 'Capture time', value: '2024:06:15 14:32:11', rawKey: 'DateTimeOriginal' };

describe('MetadataReport', () => {
  it('renders the friendly empty message when there are no findings', () => {
    render(<MetadataReport findings={[]} />);
    expect(screen.getByText(/clean already\. nothing hidden in this file/i)).toBeInTheDocument();
  });

  it('renders category sections when findings exist', () => {
    render(<MetadataReport findings={[make, model, captured]} />);
    expect(screen.getByRole('heading', { name: 'Device' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Timestamps' })).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  it('renders GpsCallout when Location findings are present', () => {
    render(<MetadataReport findings={[gpsLat, gpsLng, make]} />);
    expect(screen.getByText(/remembers where you were/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see exactly where/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/www\.google\.com\/maps\?q=/),
    );
  });

  it('does NOT render GpsCallout when there are no Location findings', () => {
    render(<MetadataReport findings={[make, captured]} />);
    expect(screen.queryByText(/remembers where you were/i)).not.toBeInTheDocument();
  });

  it('renders the HEIC conversion note when heicNote prop is true', () => {
    render(<MetadataReport findings={[make]} heicNote />);
    expect(screen.getByText(/heic will become a clean jpeg/i)).toBeInTheDocument();
  });

  it('parses coordinates from formatted values back to signed decimals for the Maps URL', () => {
    render(<MetadataReport findings={[gpsLat, gpsLng]} />);
    const link = screen.getByRole('link', { name: /see exactly where/i });
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps?q=37.7749,-122.4194');
  });
});
