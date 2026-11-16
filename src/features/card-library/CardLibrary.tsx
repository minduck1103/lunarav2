import { useState } from "react";
import { tarotDeck } from "../../domain/tarot/cards";
import type { TarotCard } from "../../domain/tarot/types";
import { CardArt } from "../../shared/ui/CardArt";

const suitFilters = [
  { id: "all", label: "Tất cả" },
  { id: "major", label: "Ẩn Chính" },
  { id: "cups", label: "Cốc" },
  { id: "pentacles", label: "Tiền" },
  { id: "swords", label: "Kiếm" },
  { id: "wands", label: "Gậy" },
];

export function CardLibrary({ onPreview, onSelect }: { onPreview: (card: TarotCard) => void; onSelect: () => void }) {
  const [cardSearch, setCardSearch] = useState("");
  const [suitFilter, setSuitFilter] = useState("all");
  const search = cardSearch.trim().toLocaleLowerCase("vi");
  const filteredCards = tarotDeck.filter((card) =>
    (suitFilter === "all" || (suitFilter === "major" ? card.arcana === "major" : card.suit === suitFilter))
    && `${card.name} ${card.english}`.toLocaleLowerCase("vi").includes(search),
  );

  return <section className="deck shell" aria-labelledby="deck-title">
    <div className="section-row">
      <h2 id="deck-title">Bộ bài <small>{filteredCards.length}/{tarotDeck.length}</small></h2>
      <input className="search" type="search" value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} placeholder="⌕ Tìm lá bài…" aria-label="Tìm lá bài" />
    </div>
    <div className="chips">
      {suitFilters.map((filter) => <button key={filter.id} data-sound-handled className={`chip ${suitFilter === filter.id ? "selected" : ""}`} onClick={() => {
        if (filter.id !== suitFilter) onSelect();
        setSuitFilter(filter.id);
      }}>{filter.label}</button>)}
    </div>
    <div className="deck-strip">
      {filteredCards.map((card) => <button className="deck-card" data-sound-handled key={card.id} onClick={() => onPreview(card)} aria-label={card.name}>
        <CardArt card={card} />
      </button>)}
      {filteredCards.length === 0 && <p className="muted">Không tìm thấy lá bài.</p>}
    </div>
  </section>;
}
