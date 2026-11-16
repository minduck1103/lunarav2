import { useEffect } from "react";
import type { TarotCard } from "../../domain/tarot/types";
import { CardArt } from "../../shared/ui/CardArt";

export function CardPreviewDialog({ card, onClose }: { card: TarotCard; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={card.name} onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Đóng" autoFocus>×</button>
      <CardArt card={card} className="large" />
      <div className="modal-info">
        <span className="eyebrow">{card.arcana === "major" ? `ẨN CHÍNH · ${card.cardNumber}` : `ẨN PHỤ · ${card.suit?.toUpperCase()}`}</span>
        <h3>{card.name}</h3>
        <p className="muted">{card.english}</p>
        <div className="keyword-group"><span className="keyword-label">↑ Xuôi</span><div className="chips">{card.uprightKeywords.map((word) => <span className="chip static" key={word}>{word}</span>)}</div></div>
        <div className="keyword-group"><span className="keyword-label reversed">↓ Ngược</span><div className="chips">{card.reversedKeywords.map((word) => <span className="chip static dim" key={word}>{word}</span>)}</div></div>
      </div>
    </div>
  </div>;
}
