import type { InterpretationResult } from "../../../contracts/interpretation";
import type { ReadingState } from "../reading.types";

export function ReadingConclusion({ result }: { result: InterpretationResult }) {
  return <div className="reading-conclusion">
    <h3>Kết luận</h3>
    <div className="message-banner">
      <span className="message-icon" aria-hidden="true">✦</span><p>{result.overview}</p>
    </div>
    <p>{result.synthesis}</p>
    <h4>Điều bạn có thể làm</h4>
    <ul className="reading-advice">{result.advice.map((advice) => <li key={advice}>{advice}</li>)}</ul>
    <p className="reading-reflection">{result.reflectionQuestion}</p>
    {result.safetyNote && <p className="reading-note">{result.safetyNote}</p>}
  </div>;
}

export function SupportMessage({ result }: { result: InterpretationResult }) {
  return <div className="support-message">
    <div className="message-banner"><p>{result.overview}</p></div>
    <p>{result.safetyNote}</p>
    <p>{result.synthesis}</p>
    <ul className="reading-advice">{result.advice.map((advice) => <li key={advice}>{advice}</li>)}</ul>
    <p className="reading-reflection">{result.reflectionQuestion}</p>
  </div>;
}

export function CardMeaning({ reading, result, index }: { reading: ReadingState; result: InterpretationResult; index: number }) {
  const item = reading.cards[index];
  const meaning = result.cards[index];
  return <article className="card-reading" data-card-reading>
    <p className="eyebrow">{item.position} · {item.isReversed ? "NGƯỢC" : "XUÔI"}</p>
    <h3>{item.card.name}</h3>
    <strong className="reading-headline">{meaning.headline}</strong>
    <p className="reading-meaning">{meaning.interpretation}</p>
  </article>;
}
