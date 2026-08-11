interface Props {
  loading: boolean;
  onClick: () => void;
}

export function ScrubButton({ loading, onClick }: Props) {
  return (
    <button
      type="button"
      className="scrub-button"
      onClick={onClick}
      disabled={loading}
      aria-disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="scrub-button__spinner" aria-hidden="true" />
          Stripping...
        </>
      ) : (
        'Strip it clean'
      )}
    </button>
  );
}
