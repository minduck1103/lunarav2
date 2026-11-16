import { useEffect, type RefObject } from "react";
import { spreads } from "../../../domain/tarot/spreads";
import type { TarotCard } from "../../../domain/tarot/types";
import { splashImage } from "../../../platform/assets.web";
import { CardArt } from "../../../shared/ui/CardArt";
import type { SoundPlayer } from "../../../shared/audio";
import type { useReadingFlow } from "../hooks/useReadingFlow";
import { steps, topics } from "../reading.config";
import { CardBack } from "./CardBack";
import { InterpretationDialog } from "./InterpretationDialog";

export function ReadingWizard({ flow, resultRef, isExporting, downloadResult, donationOpen, onPreview, sound }: {
  flow: ReturnType<typeof useReadingFlow>;
  resultRef: RefObject<HTMLDivElement | null>;
  isExporting: boolean;
  downloadResult: () => void;
  donationOpen: boolean;
  onPreview: (card: TarotCard) => void;
  sound: SoundPlayer;
}) {
  const { step, topic, question, spreadId, reading, isDrawing, error, canExport,
    chooseTopic, setStep, setQuestion, setSpreadId, setError, setCanExport,
    revealCard, revealAll, startOver, handleQuestionContinue, startReading } = flow;
  const activeTopic = topics.find((item) => item.id === topic);
  const revealedCount = reading?.cards.filter((item) => item.revealed).length ?? 0;
  const allRevealed = Boolean(reading && revealedCount === reading.cards.length);

  useEffect(() => {
    if (!reading) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) sound.play("deal");
    else reading.cards.forEach((_card, index) => sound.play("deal", index * 120));
    return () => sound.stop("deal");
  }, [reading?.id, sound]);

  return <section className="reading-section shell" id="reading">
    <div className="reading-panel">
      <ol className="progress" aria-label={`Bước ${step} trên 4`}>
        {steps.map((label, index) => <li key={label} className={`${step === index + 1 ? "active" : ""} ${step > index + 1 ? "complete" : ""}`}>
          <span className="progress-dot">{step > index + 1 ? "✓" : index + 1}</span><span className="progress-label">{label}</span>
        </li>)}
      </ol>

      {!reading && step === 1 && <div className="flow">
        <h3 className="flow-title">Bạn muốn hỏi về điều gì?</h3>
        <div className="topic-grid">
          {topics.map((item) => <button key={item.id} data-sound-handled className="topic-tile" onClick={() => chooseTopic(item.id)} style={{ backgroundImage: `url(${splashImage(item.id)})` }}>
            <span className="topic-symbol">{item.symbol}</span>
            <span className="topic-label">{item.label}</span>
          </button>)}
        </div>
      </div>}

      {!reading && step === 2 && <div className="flow narrow">
        <button className="chip chip-topic" onClick={() => setStep(1)}>{activeTopic?.symbol} {activeTopic?.label} <span>✎</span></button>
        <h3 className="flow-title">Câu hỏi của bạn</h3>
        <div className="question-box">
          <textarea id="question" aria-label="Câu hỏi của bạn" maxLength={240} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Viết câu hỏi… (không bắt buộc)" />
          <span className="counter">{question.length}/240</span>
        </div>
        <div className="chips">
          {activeTopic?.suggestions.map((suggestion) => <button key={suggestion} className={`chip ${question === suggestion ? "selected" : ""}`} onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
        </div>
        <div className="flow-actions">
          <button className="text-button" onClick={() => setStep(1)}>← Quay lại</button>
          <button className="button button-gold" onClick={handleQuestionContinue}>Tiếp tục <span>→</span></button>
        </div>
      </div>}

      {!reading && step === 3 && <div className="flow narrow">
        <h3 className="flow-title">Chọn kiểu trải bài</h3>
        {isDrawing ? <div className="shuffle-stage" role="status" aria-label="Đang xáo bài">
          {Array.from({ length: 6 }, (_, index) => <span className="shuffle-card" key={index} style={{ animationDelay: `${index * -0.18}s` }}><CardBack /></span>)}
        </div> : <div className="spread-options">
          {spreads.map((spread) => <button key={spread.id} data-sound-handled className={`spread-option ${spreadId === spread.id ? "selected" : ""}`} onClick={() => setSpreadId(spread.id)} aria-pressed={spreadId === spread.id}>
            <span className={`spread-preview count-${spread.positions.length}`}>{spread.positions.map((position) => <i key={position} />)}</span>
            <strong>{spread.label}</strong>
            <small>{spread.positions.join(" · ")}</small>
          </button>)}
        </div>}
        <div className="flow-actions">
          <button className="text-button" onClick={() => setStep(2)} disabled={isDrawing}>← Quay lại</button>
          <button className="button button-gold" data-sound-handled onClick={startReading} disabled={isDrawing}>{isDrawing ? "Đang xáo bài…" : <>✧ Xáo & rút bài</>}</button>
        </div>
      </div>}

      {reading && <div className="flow cards-flow" id="reading-result" ref={resultRef}>
        <div className="export-heading brand">✳ LUNARA</div>
        <div className="reading-question">
          <span className="chip chip-topic static">{topics.find((item) => item.id === reading.topic)?.symbol} {topics.find((item) => item.id === reading.topic)?.label}</span>
          {reading.question && <p>“{reading.question}”</p>}
        </div>
        <div className={`drawn-cards count-${reading.cards.length}`} data-html2canvas-ignore>
          {reading.cards.map((item, index) => <div className="drawn-card" key={`${reading.id}-${item.card.id}`} style={{ animationDelay: `${index * 0.12}s` }}>
            <span className="position-label">{item.position}</span>
            <button className={`tarot-card ${item.revealed ? "flipped" : ""} ${item.isReversed ? "reversed" : ""}`}
              data-sound-handled
              disabled={isExporting}
              onClick={() => item.revealed ? onPreview(item.card) : revealCard(index)}
              aria-label={item.revealed ? `${item.card.name}${item.isReversed ? ", ngược" : ""} — xem chi tiết` : `Lật lá bài ${item.position}`}>
              <span className="card-flip-inner" aria-hidden="true">
                <span className="card-side card-side-back"><CardBack /></span>
                <span className="card-side card-side-front"><CardArt card={item.card} /></span>
              </span>
            </button>
            {item.revealed && <span className={`orientation ${item.isReversed ? "is-reversed" : ""}`}>{item.isReversed ? "↓ Ngược" : "↑ Xuôi"}</span>}
          </div>)}
        </div>
        {!allRevealed && <div className="flow-actions center" data-html2canvas-ignore>
          <span className="muted">Chạm để lật · {revealedCount}/{reading.cards.length}</span>
          <button className="text-button" data-sound-handled onClick={revealAll}>Lật tất cả</button>
        </div>}
        {allRevealed && <InterpretationDialog key={reading.id} reading={reading} onComplete={setCanExport}
          exporting={isExporting} canExport={canExport} onDownload={downloadResult} overlayOpen={donationOpen} sound={sound} />}
        <p className="export-disclaimer">Tarot mang tính giải trí & suy ngẫm, không thay thế tư vấn chuyên môn.</p>
        <div className="flow-actions center" data-html2canvas-ignore>
          {canExport && <button className="button button-gold" onClick={downloadResult} disabled={isExporting}>{isExporting ? "Đang tạo ảnh…" : "↓ Tải ảnh kết quả"}</button>}
          <button className="button button-outline" data-sound-handled onClick={startOver} disabled={isExporting}>↻ Trải bài mới</button>
        </div>
      </div>}

      {error && <div className="error-message" role="alert"><span>!</span>{error}<button onClick={() => setError("")} aria-label="Đóng thông báo">×</button></div>}
    </div>
    <p className="disclaimer">✧ Tarot mang tính giải trí & suy ngẫm, không thay thế tư vấn chuyên môn.</p>
  </section>;
}
