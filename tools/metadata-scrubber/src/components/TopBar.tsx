import { Wordmark } from './Wordmark';
import { PrivacyBadge } from './PrivacyBadge';

/**
 * Replaces the old Masthead. The trust line is promoted from a footnote to
 * permanent chrome: it is the app's entire promise, so it earns the position
 * and stays on screen in every state.
 *
 * PrivacyBadge is reused rather than re-stated so the string lives in exactly
 * one place. It renders lowercase in the DOM and is uppercased visually via
 * text-transform.
 */
export function TopBar() {
  return (
    <div className="topbar">
      <Wordmark />
      <PrivacyBadge />
    </div>
  );
}
