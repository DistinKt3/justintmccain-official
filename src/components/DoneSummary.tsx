import type { Category } from '../lib/types';

interface Props {
  removedCategories: Category[];
  onReset: () => void;
}

export function DoneSummary({ removedCategories, onReset }: Props) {
  return (
    <section className="done" aria-labelledby="done-heading">
      <h2 id="done-heading" className="done__heading">Done. Your file is clean.</h2>
      {removedCategories.length > 0 ? (
        <ul className="done__list">
          {removedCategories.map((cat, i) => (
            <li
              key={cat}
              className="done__row"
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <span className="done__check" aria-hidden="true">&#x2713;</span>
              <span className="done__label">Removed {cat.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="done__nothing">The file had no metadata to remove.</p>
      )}
      <button type="button" className="done__reset" onClick={onReset}>
        Scrub another file
      </button>
    </section>
  );
}
