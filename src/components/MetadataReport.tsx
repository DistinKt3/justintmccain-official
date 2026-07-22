import type { Category, Finding } from '../lib/types';
import { GpsCallout } from './GpsCallout';

interface Props {
  findings: Finding[];
  heicNote?: boolean;
}

const CATEGORY_ORDER: Category[] = ['Location', 'Device', 'Timestamps', 'Identity', 'Other'];

function parseCoord(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/([0-9.]+)°\s*([NSEW])/);
  if (!match) return null;
  const mag = parseFloat(match[1]);
  const hemi = match[2];
  return hemi === 'S' || hemi === 'W' ? -mag : mag;
}

function groupByCategory(findings: Finding[]): Record<Category, Finding[]> {
  const map = { Location: [], Device: [], Timestamps: [], Identity: [], Other: [] } as Record<Category, Finding[]>;
  for (const f of findings) map[f.category].push(f);
  return map;
}

export function MetadataReport({ findings, heicNote }: Props) {
  if (findings.length === 0) {
    return (
      <p className="report-empty">No hidden metadata found. This file is already clean.</p>
    );
  }

  const byCategory = groupByCategory(findings);
  const latValue = findings.find(f => f.rawKey === 'GPSLatitude')?.value;
  const lngValue = findings.find(f => f.rawKey === 'GPSLongitude')?.value;
  const lat = parseCoord(latValue);
  const lng = parseCoord(lngValue);

  return (
    <section aria-labelledby="report-heading" className="report">
      <h2 id="report-heading" className="visually-hidden">Detected metadata</h2>
      {lat !== null && lng !== null && <GpsCallout lat={lat} lng={lng} />}
      {heicNote && (
        <p className="report-note">HEIC will be converted to a clean JPEG.</p>
      )}
      {CATEGORY_ORDER.map((cat, idx) => {
        const rows = byCategory[cat];
        if (rows.length === 0) return null;
        return (
          <div
            className="report-section"
            key={cat}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <h3 className="report-section__label">{cat}</h3>
            <dl className="report-section__rows">
              {rows.map(row => (
                <div className="report-row" key={row.rawKey}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </section>
  );
}
