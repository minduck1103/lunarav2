export function SoundToggle({ enabled, loading, onToggle }: {
  enabled: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return <button className="button button-outline small sound-toggle" type="button"
    aria-pressed={enabled} aria-label={enabled ? "Tắt âm thanh" : "Bật âm thanh"} onClick={onToggle}
    title={loading ? "Đang tải âm thanh…" : enabled ? "Tắt âm thanh" : "Bật âm thanh"}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
      {enabled ? <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>
        : <path d="m16 9 5 6m0-6-5 6" />}
    </svg>
    <span>Âm thanh</span>
  </button>;
}
