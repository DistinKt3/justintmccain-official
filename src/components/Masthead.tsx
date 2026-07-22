import { PrivacyBadge } from './PrivacyBadge';

export function Masthead() {
  return (
    <div className="masthead">
      <span className="masthead__name">
        metadata-scrubber
        <span className="masthead__sep" aria-hidden="true"> · </span>
        <span className="masthead__version">v0.1</span>
      </span>
      <PrivacyBadge />
    </div>
  );
}
