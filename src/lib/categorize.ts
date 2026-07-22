import type { Category, Finding, FileKind } from './types';

interface FieldMap {
  category: Category;
  label: string;
}

const FIELD_MAP: Record<string, FieldMap> = {
  // Location
  GPSLatitude:   { category: 'Location',   label: 'Latitude' },
  GPSLongitude:  { category: 'Location',   label: 'Longitude' },
  GPSAltitude:   { category: 'Location',   label: 'Altitude' },
  GPSDateStamp:  { category: 'Location',   label: 'GPS timestamp' },
  GPSTimeStamp:  { category: 'Location',   label: 'GPS time of day' },
  // Device
  Make:          { category: 'Device',     label: 'Camera make' },
  Model:         { category: 'Device',     label: 'Camera model' },
  LensMake:      { category: 'Device',     label: 'Lens make' },
  LensModel:     { category: 'Device',     label: 'Lens model' },
  Software:      { category: 'Device',     label: 'Software' },
  // Timestamps
  DateTimeOriginal: { category: 'Timestamps', label: 'Capture time' },
  CreateDate:       { category: 'Timestamps', label: 'Created' },
  ModifyDate:       { category: 'Timestamps', label: 'Modified' },
  CreationDate:     { category: 'Timestamps', label: 'Created' },
  ModDate:          { category: 'Timestamps', label: 'Modified' },
  // Identity
  Artist:        { category: 'Identity',   label: 'Artist' },
  Copyright:     { category: 'Identity',   label: 'Copyright' },
  OwnerName:     { category: 'Identity',   label: 'Owner' },
  HostComputer:  { category: 'Identity',   label: 'Host computer' },
  Author:        { category: 'Identity',   label: 'Author' },
  Creator:       { category: 'Identity',   label: 'Creator' },
  Producer:      { category: 'Identity',   label: 'Producer' },
  Title:         { category: 'Identity',   label: 'Title' },
  Subject:       { category: 'Identity',   label: 'Subject' },
  Keywords:      { category: 'Identity',   label: 'Keywords' },
};

const CATEGORY_ORDER: Category[] = ['Location', 'Device', 'Timestamps', 'Identity', 'Other'];

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  return false;
}

function formatGpsLat(n: number): string {
  const hemisphere = n >= 0 ? 'N' : 'S';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

function formatGpsLng(n: number): string {
  const hemisphere = n >= 0 ? 'E' : 'W';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

function formatValue(rawKey: string, v: unknown): string {
  if (rawKey === 'GPSLatitude' && typeof v === 'number') return formatGpsLat(v);
  if (rawKey === 'GPSLongitude' && typeof v === 'number') return formatGpsLng(v);
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(String).join(', ');
  return String(v);
}

function humanizeUnknown(rawKey: string): string {
  return rawKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

export function categorize(raw: Record<string, unknown>, _kind: FileKind): Finding[] {
  const findings: Finding[] = [];
  const keys = Object.keys(raw).sort();

  for (const key of keys) {
    const value = raw[key];
    if (isEmpty(value)) continue;

    const mapped = FIELD_MAP[key];
    if (mapped) {
      // exifr returns GPSLatitude/GPSLongitude as DMS arrays; the decimal
      // values live in raw.latitude / raw.longitude. Use those so that
      // formatGpsLat/Lng produces the "37.774900° N" string that MetadataReport
      // needs to render GpsCallout.
      let resolvedValue = value;
      if (key === 'GPSLatitude' && typeof raw['latitude'] === 'number') {
        resolvedValue = raw['latitude'];
      } else if (key === 'GPSLongitude' && typeof raw['longitude'] === 'number') {
        resolvedValue = raw['longitude'];
      }
      findings.push({
        category: mapped.category,
        label: mapped.label,
        value: formatValue(key, resolvedValue),
        rawKey: key,
      });
    } else if (key.startsWith('GPS')) {
      const suffix = key.replace(/^GPS/, '');
      findings.push({
        category: 'Location',
        label: `GPS ${humanizeUnknown(suffix)}`,
        value: formatValue(key, value),
        rawKey: key,
      });
    } else {
      findings.push({
        category: 'Other',
        label: humanizeUnknown(key),
        value: formatValue(key, value),
        rawKey: key,
      });
    }
  }

  return findings.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.rawKey.localeCompare(b.rawKey);
  });
}
