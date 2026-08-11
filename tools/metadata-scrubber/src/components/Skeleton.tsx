const WIDTHS = ['75%', '40%', '60%', '30%', '55%'];

export function Skeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      {WIDTHS.map((w, i) => (
        <div key={i} className="skeleton__row" style={{ width: w }} />
      ))}
    </div>
  );
}
