import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardArt } from "../../../shared/ui/CardArt";
import type { SoundPlayer } from "../../../shared/audio";
import { useInterpretation } from "../hooks/useInterpretation";
import type { ReadingState } from "../reading.types";
import { CardMeaning, ReadingConclusion, SupportMessage } from "./ReadingContent";

export function InterpretationDialog({ reading, onComplete, exporting, canExport, onDownload, overlayOpen, sound }: {
  reading: ReadingState;
  onComplete: (complete: boolean) => void;
  exporting: boolean;
  canExport: boolean;
  onDownload: () => void;
  overlayOpen: boolean;
  sound: SoundPlayer;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewed, setViewed] = useState<number[]>([]);
  const [showConclusion, setShowConclusion] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const conclusionRef = useRef<HTMLDivElement>(null);
  const allViewed = viewed.length === reading.cards.length;
  const { result, pending, interpretationError, interpret } = useInterpretation(reading, (parsed) => {
    setOpen(true);
    if (parsed.status === "support") onComplete(true);
  });

  useEffect(() => {
    if (!open || overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>(".reading-card, .modal-close")?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open, overlayOpen]);

  useEffect(() => {
    if (!open || overlayOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !exporting) closeDialog();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, exporting, overlayOpen]);

  useEffect(() => {
    if (showConclusion) conclusionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [showConclusion]);

  function closeDialog() {
    setOpen(false);
    window.setTimeout(() => reopenRef.current?.focus({ preventScroll: true }));
  }

  function viewCard(index: number) {
    if (exporting) return;
    if (index !== activeIndex) sound.play("select");
    setActiveIndex(index);
    setViewed((current) => current.includes(index) ? current : [...current, index]);
  }

  function conclude() {
    if (!showConclusion) sound.play("conclusion");
    setShowConclusion(true);
    onComplete(true);
  }

  const isSupport = result?.status === "support";

  return <section className="interpretation" aria-label="Giải nghĩa trải bài">
    {!result && <div className="interpret-controls" data-html2canvas-ignore>
      <button className="button button-gold" onClick={() => { if (!exporting) void interpret(); }} disabled={pending || exporting}>
        {pending ? "Đang giải nghĩa…" : interpretationError ? "Thử lại giải nghĩa" : "Bắt đầu giải nghĩa"}
      </button>
      {pending && <p className="reading-note" role="status">Đang kết nối thông điệp của các lá bài…</p>}
      {interpretationError && <p className="interpret-error" role="alert">{interpretationError}</p>}
    </div>}

    {result && <div className="interpret-controls" data-html2canvas-ignore>
      <button ref={reopenRef} className="button button-gold" onClick={() => setOpen(true)} disabled={exporting}>✦ Xem giải nghĩa</button>
    </div>}

    {result && <div className="export-reading">
      {isSupport ? <SupportMessage result={result} /> : <>
        <ol className={`journey-cards count-${reading.cards.length}`}>
          {reading.cards.map((item) => <li className="drawn-card" key={item.card.id}>
            <span className="position-label">{item.position}</span>
            <span className={`reading-card ${item.isReversed ? "reversed" : ""}`}><CardArt card={item.card} /></span>
            <span className={`orientation ${item.isReversed ? "is-reversed" : ""}`}>{item.isReversed ? "↓ Ngược" : "↑ Xuôi"}</span>
          </li>)}
        </ol>
        {reading.cards.map((item, index) => <CardMeaning key={item.card.id} reading={reading} result={result} index={index} />)}
        {showConclusion && <ReadingConclusion result={result} />}
      </>}
    </div>}

    {open && result && createPortal(<div className="modal-backdrop reading-backdrop" inert={overlayOpen}
      aria-hidden={overlayOpen || undefined} onClick={() => { if (!exporting && !overlayOpen) closeDialog(); }}>
      <div className="reading-dialog" role="dialog" aria-modal="true" aria-labelledby="reading-dialog-title"
        ref={dialogRef} onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={closeDialog} disabled={exporting} aria-label="Đóng giải nghĩa">×</button>
        <h2 className="reading-dialog-title" id="reading-dialog-title">Thông điệp trải bài</h2>
        {isSupport ? <SupportMessage result={result} /> : <>
          <p className="journey-progress" aria-live="polite">Đã xem {viewed.length}/{reading.cards.length} lá</p>
          <ol className={`journey-cards count-${reading.cards.length}`} aria-label="Các lá bài">
            {reading.cards.map((item, index) => {
              const isViewed = viewed.includes(index);
              return <li className={`drawn-card ${index === activeIndex ? "current" : ""} ${isViewed ? "viewed" : ""}`} key={item.card.id}>
                <span className="position-label">{item.position}</span>
                <button className={`reading-card ${item.isReversed ? "reversed" : ""}`} data-sound-handled onClick={() => viewCard(index)}
                  aria-pressed={index === activeIndex} aria-label={`Xem lá ${index + 1}: ${item.card.name}`} disabled={exporting}>
                  <CardArt card={item.card} />
                  {isViewed && <span className="viewed-mark" aria-hidden="true">✓</span>}
                </button>
                <span className={`orientation ${item.isReversed ? "is-reversed" : ""}`}>{item.isReversed ? "↓ Ngược" : "↑ Xuôi"}</span>
              </li>;
            })}
          </ol>
          {activeIndex === null
            ? <p className="reading-note">Chạm từng lá để xem thông điệp.</p>
            : <CardMeaning reading={reading} result={result} index={activeIndex} />}
          {activeIndex !== null && !allViewed && <p className="reading-note">
            Chạm các lá còn lại để xem tiếp · {viewed.length}/{reading.cards.length}
          </p>}
          {allViewed && !showConclusion && <div className="flow-actions center">
            <button className="button button-gold" data-sound-handled onClick={conclude}>Kết luận</button>
          </div>}
          {showConclusion && <div ref={conclusionRef}><ReadingConclusion result={result} /></div>}
        </>}
        {canExport && <div className="flow-actions center">
          <button className="button button-gold" onClick={onDownload} disabled={exporting}>{exporting ? "Đang tạo ảnh…" : "↓ Tải ảnh kết quả"}</button>
        </div>}
      </div>
    </div>, document.body)}
  </section>;
}
