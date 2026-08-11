/**
 * The scrubber's mark is the sibling of Vanish's four-dot fade.
 *
 * Vanish's mark is erasure over time: four dots fading left to right.
 * This one is erasure at a threshold: nodes carrying data approach a gate,
 * and the ones that come out the other side are hollow. Same primitive as
 * the JTM node, different verb. It is literally the product -- metadata in,
 * clean file out.
 *
 * Decorative only. The accessible name comes from the adjacent text.
 */
export function Wordmark() {
  return (
    <span className="wordmark">
      <svg
        className="wordmark__glyph"
        viewBox="0 0 40 12"
        width="40"
        height="12"
        aria-hidden="true"
        focusable="false"
      >
        {/* carrying metadata -- solid */}
        <circle cx="4" cy="6" r="2.5" fill="currentColor" />
        <circle cx="12" cy="6" r="2.5" fill="currentColor" />
        {/* the gate */}
        <line
          x1="20"
          y1="0.5"
          x2="20"
          y2="11.5"
          stroke="var(--grid)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* scrubbed -- hollow */}
        <circle
          cx="28"
          cy="6"
          r="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <circle
          cx="36"
          cy="6"
          r="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
      <span className="wordmark__text">Scrubber</span>
    </span>
  );
}
