/**
 * Empty state only. Two lines: why it matters, then what it does.
 *
 * Vanish earns a longer "What this is & isn't" preamble because sending
 * legal removal requests on your own behalf genuinely needs framing. This
 * tool does not -- you drop a file and it comes back clean -- so the
 * description stays at two sentences and gets out of the way.
 *
 * The trust promise is deliberately NOT restated here; it already lives in
 * the TopBar chip, and saying it twice on one screen makes it sound like a
 * claim rather than a fact.
 */
export function Intro() {
  return (
    <div className="intro">
      <p className="intro__why">
        Every photo carries hidden metadata: where you stood, what device you
        used, the second you pressed the shutter.
      </p>
      <p className="intro__what">Scrubber strips it out before you share.</p>
    </div>
  );
}
