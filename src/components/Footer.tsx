/**
 * Footer identity block.
 *
 * Mirrors the three tiers of the portfolio footer on justintmccain.com so the
 * two tools and the landing page read as one system rather than three projects
 * that happen to share a palette:
 *
 *   1. identity  ·  elsewhere-links
 *   2. the note specific to THIS surface
 *   3. copyright
 *
 * The canonical wording lives in the portfolio's `build/content.mjs`
 * (IDENTITY + FOOTER). This app builds independently, so those strings are
 * necessarily duplicated here. If you change the name, the role or the
 * copyright line, change it in all three places — here, `build/content.mjs`,
 * and Vanish's `src/components/ui.tsx`.
 *
 * TIER 2 IS THE SIBLING LINK, NOT A TRUST PROMISE. "Nothing leaves this tab"
 * is deliberately absent: it is permanent chrome in the TopBar, and saying it
 * a second time on the same screen turns a fact into a sales pitch. The thing
 * genuinely worth adding down here is the OTHER tool, for someone who arrived
 * on this page directly and has no idea the rest of the work exists.
 */

const PORTFOLIO = 'https://justintmccain.com';
const LINKEDIN = 'https://www.linkedin.com/in/justintmccain/';
const EMAIL = 'JustinTMcCain@protonmail.com';

/* Hard-coded rather than new Date().getFullYear(). Vanish renders its copy of
   this line on the server, where a runtime year can disagree with the client
   across a New Year boundary and trip a hydration mismatch. Both apps use a
   constant so the shared line cannot drift apart. */
const YEAR = '2026';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <p className="footer__id">
          <span className="footer__name">Justin T. McCain</span>
          <span className="footer__sep" aria-hidden="true">·</span>
          <span className="footer__role">Privacy Product Leader</span>
        </p>

        <nav className="footer__links" aria-label="Elsewhere">
          <a className="footer__link" href={PORTFOLIO} target="_blank" rel="noopener">
            Portfolio
          </a>
          <span className="footer__sep" aria-hidden="true">·</span>
          <a className="footer__link" href={LINKEDIN} target="_blank" rel="noopener">
            LinkedIn
          </a>
          <span className="footer__sep" aria-hidden="true">·</span>
          {/* The address itself, not the word "Email" — matching the portfolio
              footer. A visible address can be copied without clicking, which is
              the one thing a recruiter actually wants from a footer. */}
          <a className="footer__link" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </nav>
      </div>

      <p className="footer__sibling">
        Also built:{' '}
        <a
          className="footer__link"
          href={`${PORTFOLIO}/vanish`}
          target="_blank"
          rel="noopener"
        >
          Vanish
        </a>
        <span className="footer__note">
          {' '}— find which data brokers are selling you, then make them stop.
        </span>
      </p>

      <p className="footer__copy">
        © {YEAR} Justin T. McCain. Built with respect for your attention and your data.
      </p>
    </footer>
  );
}
