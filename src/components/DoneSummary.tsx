import type { Category } from '../lib/types';

interface Props {
  removedCategories: Category[];
  onReset: () => void;
}

const PAIRS: Record<Category, string> = {
  Location: 'where you were',
  Device: 'what you shot with',
  Timestamps: 'when it happened',
  Identity: 'who created it',
  Other: 'other technical fields',
};

export function DoneSummary({ removedCategories, onReset }: Props) {
  return (
    <section className="done" aria-labelledby="done-heading">
      <h2 id="done-heading" className="done__heading" tabIndex={-1}>Clean. Ready to share.</h2>
      {removedCategories.length > 0 ? (
        <ul className="done__list">
          {removedCategories.map((cat, i) => (
            <li
              key={cat}
              className="done__row"
              style={{ '--stagger-i': i } as React.CSSProperties}
            >
              <span className="done__check" aria-hidden="true">&#x2713;</span>
              {cat === 'Other' ? (
                <span className="done__label">Removed other technical fields</span>
              ) : (
                <span className="done__label">
                  <span>Removed {cat.toLowerCase()}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{PAIRS[cat]}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="done__nothing">Nothing to strip. Already clean.</p>
      )}
      <button type="button" className="done__reset" onClick={onReset}>
        Do another
      </button>
    </section>
  );
}
