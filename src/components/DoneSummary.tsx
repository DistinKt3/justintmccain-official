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

/**
 * The one Evidence Paper surface in the app.
 *
 * Every other state is Signal Black -- the signal, the thing you haven't
 * dealt with yet. This is the ledger: proof rendered as a printed record.
 * The dark-to-light flip IS the argument, felt rather than explained, which
 * is why the payoff is a receipt and not a success toast.
 *
 * Amber appears exactly once in this product, on the seal below, and it is
 * a fill rather than text -- amber text on Evidence Paper measures 1.72:1
 * and fails AA outright. Ink on amber measures 9.45:1.
 */
export function DoneSummary({ removedCategories, onReset }: Props) {
  return (
    <section className="done" aria-labelledby="done-heading">
      <div className="done__receipt">
        <div className="done__masthead">
          <span className="done__seal" aria-hidden="true">Scrubbed</span>
          <span className="done__kicker" aria-hidden="true">Record of removal</span>
        </div>

        <h2 id="done-heading" className="done__heading" tabIndex={-1}>Clean. Ready to share.</h2>

        {removedCategories.length > 0 ? (
          <ul className="done__list">
            {removedCategories.map((cat, i) => (
              <li
                key={cat}
                className="done__row"
                style={{ '--stagger-i': i } as React.CSSProperties}
              >
                {/* Node atom, drawn in CSS. Empty by design: this element IS
                    the bullet, so a glyph here would double the marker. */}
                <span className="done__check" aria-hidden="true" />
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
      </div>
    </section>
  );
}
