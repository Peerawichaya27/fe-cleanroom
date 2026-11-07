export default function Loading() {
  return (
    <div
      className="store container page-section"
      role="status"
      aria-label="Loading"
    >
      <div className="skeleton heading-skeleton" />
      <div className="product-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="skeleton card-skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}
