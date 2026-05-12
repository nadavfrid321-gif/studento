export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-outline-variant border-t-primary"
      style={{ width: size, height: size }}
      role="status"
      aria-label="טוען"
    />
  );
}
