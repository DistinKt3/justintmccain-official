interface Props {
  lat: number;
  lng: number;
}

function formatLat(n: number): string {
  const hemisphere = n >= 0 ? 'N' : 'S';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

function formatLng(n: number): string {
  const hemisphere = n >= 0 ? 'E' : 'W';
  return `${Math.abs(n).toFixed(6)}° ${hemisphere}`;
}

export function GpsCallout({ lat, lng }: Props) {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <aside className="gps-callout" role="note">
      <h2 className="gps-callout__heading">
        <span className="gps-callout__glyph" aria-hidden="true">&#9888;</span>
        <span>This photo reveals where it was taken.</span>
      </h2>
      <dl className="gps-callout__coords">
        <div>
          <dt>Latitude</dt>
          <dd>{formatLat(lat)}</dd>
        </div>
        <div>
          <dt>Longitude</dt>
          <dd>{formatLng(lng)}</dd>
        </div>
      </dl>
      <a
        className="gps-callout__link"
        href={mapsUrl}
        target="_blank"
        rel="noopener"
      >
        View on Google Maps &#8599;
      </a>
    </aside>
  );
}
