import type { SyntheticEvent } from "react";
import type { TarotCard } from "../../domain/tarot/types";
import { cardImage } from "../../platform/assets.web";

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.parentElement?.classList.add("no-art");
  event.currentTarget.remove();
}

export function CardArt({ card, className = "" }: { card: TarotCard; className?: string }) {
  return <span className={`card-art ${className}`}>
    <img src={cardImage(card.id)} alt="" loading="lazy" decoding="async" onError={hideBrokenImage} />
    <span className="card-art-fallback" aria-hidden="true">{card.symbol}</span>
    <span className="card-art-number">{card.arcana === "major" ? card.cardNumber : card.symbol}</span>
    <span className="card-art-name">{card.name}</span>
  </span>;
}
