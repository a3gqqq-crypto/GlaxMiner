// The Facet: a cut Glaxite crystal. The notch on the right reads as a G.
export function FacetMark({ size = 32, mono, title }) {
  if (mono) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
        <polygon points="32,4 52,16 52,28 38,28 38,36 52,36 52,48 32,60 12,48 12,16" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <polygon points="32,4 32,60 12,48 12,16" fill="#6A42D9" />
      <polygon points="32,4 52,16 52,28 38,28 38,36 52,36 52,48 32,60" fill="#9B74FF" />
      <polygon points="12,16 32,4 52,16 32,25" fill="#FFFFFF" fillOpacity="0.18" />
      <line x1="32" y1="4" x2="32" y2="60" stroke="#E9E1FF" strokeOpacity="0.55" strokeWidth="1" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <FacetMark size={22} />
      <span>GLAXMINER</span>
    </span>
  );
}
