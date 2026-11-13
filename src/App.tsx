import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SyntheticEvent } from "react";
import { cardImage, splashImage } from "./data/cardArt";
import { drawCards, getCard, spreads, suitFilters, tarotDeck, topics, type SpreadId, type TarotCard, type Topic } from "./data/tarotDeck";
import { parseInterpretation, positionIds, readingRequestSchema, rulesVersion, type InterpretationResult } from "./data/interpretation";

type DrawnCard = { card: TarotCard; isReversed: boolean; position: string; revealed: boolean };
type ReadingState = { id: string; topic: Topic; question: string; spreadId: SpreadId; cards: DrawnCard[] };

const steps = ["Chủ đề", "Câu hỏi", "Trải bài", "Lật bài"];
const heroCards = ["the-star", "the-moon", "the-sun"];

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.parentElement?.classList.add("no-art");
  event.currentTarget.remove();
}

function CardArt({ card, className = "" }: { card: TarotCard; className?: string }) {
  return <span className={`card-art ${className}`}>
    <img src={cardImage(card.id)} alt="" loading="lazy" decoding="async" onError={hideBrokenImage} />
    <span className="card-art-fallback" aria-hidden="true">{card.symbol}</span>
    <span className="card-art-number">{card.arcana === "major" ? card.cardNumber : card.symbol}</span>
    <span className="card-art-name">{card.name}</span>
  </span>;
}

function CardBack() {
  return <span className="card-back-face"><span className="card-back-sigil">✳</span></span>;
}

function App() {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [question, setQuestion] = useState("");
  const [spreadId, setSpreadId] = useState<SpreadId>("three-card");
  const [reading, setReading] = useState<ReadingState | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const donationReturnFocusRef = useRef<Element | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [cardSearch, setCardSearch] = useState("");
  const [suitFilter, setSuitFilter] = useState("all");
  const [previewCard, setPreviewCard] = useState<TarotCard | null>(null);

  const activeTopic = topics.find((item) => item.id === topic);
  const revealedCount = reading?.cards.filter((item) => item.revealed).length ?? 0;
  const allRevealed = Boolean(reading && revealedCount === reading.cards.length);
  const search = cardSearch.trim().toLocaleLowerCase("vi");
  const filteredCards = tarotDeck.filter((card) =>
    (suitFilter === "all" || (suitFilter === "major" ? card.arcana === "major" : card.suit === suitFilter))
    && `${card.name} ${card.english}`.toLocaleLowerCase("vi").includes(search),
  );

  useEffect(() => {
    if (!previewCard) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPreviewCard(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [previewCard]);

  function chooseTopic(value: Topic) {
    setTopic(value);
    setError("");
    setStep(2);
  }

  function handleQuestionContinue() {
    if (!topic) {
      setStep(1);
      return;
    }
    if (question.trim().length > 240) {
      setError("Câu hỏi tối đa 240 ký tự.");
      return;
    }
    setError("");
    setStep(3);
  }

  async function startReading() {
    if (!topic || isDrawing) return;
    setIsDrawing(true);
    setError("");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimumShuffle = new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : 1400));
    try {
      await minimumShuffle;
      const cards = drawCards(spreadId).map((item) => ({ ...item, revealed: false }));
      setReading({ id: crypto.randomUUID(), topic, question: question.trim(), spreadId, cards });
      setStep(4);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể rút bài lúc này. Vui lòng thử lại.");
    } finally {
      setIsDrawing(false);
    }
  }

  function revealCard(index: number) {
    setReading((current) => current && ({
      ...current,
      cards: current.cards.map((card, cardIndex) => cardIndex === index ? { ...card, revealed: true } : card),
    }));
  }

  function revealAll() {
    setReading((current) => current && ({
      ...current, cards: current.cards.map((card) => ({ ...card, revealed: true })),
    }));
  }

  function startOver() {
    setStep(1);
    setReading(null);
    setQuestion("");
    setError("");
    setCanExport(false);
  }

  async function downloadResult() {
    if (!resultRef.current || !canExport || isExporting || !reading) return;
    donationReturnFocusRef.current = document.activeElement;
    setIsExporting(true);
    setError("");
    try {
      const element = resultRef.current;
      const { default: html2canvas } = await import("html2canvas");
      await document.fonts.ready;
      await Promise.all(Array.from(element.querySelectorAll("img")).map((image) => new Promise<void>((resolve, reject) => {
        const preload = new Image();
        const timeout = window.setTimeout(() => {
          reject(new Error("Ảnh lá bài tải quá lâu. Vui lòng thử lại."));
        }, 15_000);
        preload.onload = () => { window.clearTimeout(timeout); resolve(); };
        preload.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error("Không tải được ảnh lá bài."));
        };
        preload.src = image.src;
      })));
      const canvas = await html2canvas(element, {
        backgroundColor: "#151127",
        scale: 2,
        onclone: (documentClone) => {
          documentClone.getElementById("reading-result")?.classList.add("export-capture");
        },
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Không tạo được ảnh PNG.")), "image/png");
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lunara-${reading.id}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setDonationOpen(true);
    } catch (caught) {
      setError(caught instanceof Error ? `Không tải được ảnh: ${caught.message}` : "Không tải được ảnh kết quả. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  }

  function scrollToReading() {
    document.getElementById("reading")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main inert={donationOpen}>
      <header className="topbar shell">
        <a className="brand" href="#" onClick={(event) => {
          if (isExporting) event.preventDefault();
          else startOver();
        }} aria-label="Lunara, về trang đầu">
          <span className="brand-mark">✳</span><span>LUNARA</span>
        </a>
        <div className="topbar-actions">
          <button className="button button-gold small" onClick={scrollToReading}>Rút bài</button>
        </div>
      </header>

      <section className="hero" style={{ backgroundImage: `url(${splashImage("hero")})` }}>
        <div className="hero-inner shell">
          <div className="hero-copy">
            <p className="eyebrow">✦ LẮNG NGHE TRỰC GIÁC ✦</p>
            <h1>Lá bài nào<br /><em>đang gọi tên bạn?</em></h1>
            <button className="button button-gold" onClick={scrollToReading}>Bắt đầu trải bài <span>→</span></button>
          </div>
          <div className="hero-fan" aria-hidden="true">
            {heroCards.map((id) => <span className="hero-fan-card" key={id}><CardArt card={getCard(id)} /></span>)}
          </div>
        </div>
      </section>

      <section className="reading-section shell" id="reading">
        <div className="reading-panel">
          <ol className="progress" aria-label={`Bước ${step} trên 4`}>
            {steps.map((label, index) => <li key={label} className={`${step === index + 1 ? "active" : ""} ${step > index + 1 ? "complete" : ""}`}>
              <span className="progress-dot">{step > index + 1 ? "✓" : index + 1}</span><span className="progress-label">{label}</span>
            </li>)}
          </ol>

          {!reading && step === 1 && <div className="flow">
            <h3 className="flow-title">Bạn muốn hỏi về điều gì?</h3>
            <div className="topic-grid">
              {topics.map((item) => <button key={item.id} className="topic-tile" onClick={() => chooseTopic(item.id)} style={{ backgroundImage: `url(${splashImage(item.id)})` }}>
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
              {spreads.map((spread) => <button key={spread.id} className={`spread-option ${spreadId === spread.id ? "selected" : ""}`} onClick={() => setSpreadId(spread.id)} aria-pressed={spreadId === spread.id}>
                <span className={`spread-preview count-${spread.positions.length}`}>{spread.positions.map((position) => <i key={position} />)}</span>
                <strong>{spread.label}</strong>
                <small>{spread.positions.join(" · ")}</small>
              </button>)}
            </div>}
            <div className="flow-actions">
              <button className="text-button" onClick={() => setStep(2)} disabled={isDrawing}>← Quay lại</button>
              <button className="button button-gold" onClick={startReading} disabled={isDrawing}>{isDrawing ? "Đang xáo bài…" : <>✧ Xáo & rút bài</>}</button>
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
                  disabled={isExporting}
                  onClick={() => item.revealed ? setPreviewCard(item.card) : revealCard(index)}
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
              <button className="text-button" onClick={revealAll}>Lật tất cả</button>
            </div>}
            {allRevealed && <Interpretation key={reading.id} reading={reading} onComplete={setCanExport}
              exporting={isExporting} canExport={canExport} onDownload={downloadResult} overlayOpen={donationOpen} />}
            <p className="export-disclaimer">Tarot mang tính giải trí & suy ngẫm, không thay thế tư vấn chuyên môn.</p>
            <div className="flow-actions center" data-html2canvas-ignore>
              {canExport && <button className="button button-gold" onClick={downloadResult} disabled={isExporting}>{isExporting ? "Đang tạo ảnh…" : "↓ Tải ảnh kết quả"}</button>}
              <button className="button button-outline" onClick={startOver} disabled={isExporting}>↻ Trải bài mới</button>
            </div>
          </div>}

          {error && <div className="error-message" role="alert"><span>!</span>{error}<button onClick={() => setError("")} aria-label="Đóng thông báo">×</button></div>}
        </div>
        <p className="disclaimer">✧ Tarot mang tính giải trí & suy ngẫm, không thay thế tư vấn chuyên môn.</p>
      </section>

      <section className="deck shell" aria-labelledby="deck-title">
        <div className="section-row">
          <h2 id="deck-title">Bộ bài <small>{filteredCards.length}/{tarotDeck.length}</small></h2>
          <input className="search" type="search" value={cardSearch} onChange={(event) => setCardSearch(event.target.value)} placeholder="⌕ Tìm lá bài…" aria-label="Tìm lá bài" />
        </div>
        <div className="chips">
          {suitFilters.map((filter) => <button key={filter.id} className={`chip ${suitFilter === filter.id ? "selected" : ""}`} onClick={() => setSuitFilter(filter.id)}>{filter.label}</button>)}
        </div>
        <div className="deck-strip">
          {filteredCards.map((card) => <button className="deck-card" key={card.id} onClick={() => setPreviewCard(card)} aria-label={card.name}>
            <CardArt card={card} />
          </button>)}
          {filteredCards.length === 0 && <p className="muted">Không tìm thấy lá bài.</p>}
        </div>
      </section>

      <footer className="footer shell">
        <span className="brand"><span className="brand-mark">✳</span><span>LUNARA</span></span>
        <details className="privacy">
          <summary>Quyền riêng tư</summary>
          <p>Khi chọn “Bắt đầu giải nghĩa”, câu hỏi và các lá bài được gửi đến Google Gemini để tạo nội dung tự động.
            Dịch vụ miễn phí có thể dùng dữ liệu để cải thiện sản phẩm. Không nhập thông tin nhạy cảm.
            Lunara không lưu câu hỏi hoặc kết quả vào database; tải lại trang sẽ xóa phiên hiện tại.</p>
        </details>
      </footer>

      {previewCard && <CardModal card={previewCard} onClose={() => setPreviewCard(null)} />}
      {donationOpen && <DonationModal onClose={() => setDonationOpen(false)} returnFocus={donationReturnFocusRef.current} />}
    </main>
  );
}

function DonationModal({ onClose, returnFocus }: { onClose: () => void; returnFocus: Element | null }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    const previousFocus = returnFocus;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>(".modal-close")?.focus({ preventScroll: true });
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button");
      if (!buttons?.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => {
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
      });
    };
  }, []);

  return createPortal(<div className="modal-backdrop donation-backdrop" onClick={onClose}>
    <div className="donation-dialog" ref={dialogRef} role="dialog" aria-modal="true"
      aria-labelledby="donation-title" aria-describedby="donation-description" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Đóng lời mời ủng hộ">×</button>
      <span className="eyebrow">MỘT CHÚT YÊU THƯƠNG CHO LUNARA</span>
      <h2 id="donation-title">Cảm ơn bạn đã ghé thăm <span aria-hidden="true">✦</span></h2>
      <div className="donation-art" aria-hidden="true">
        <span className="donation-orbit">☾</span>
        <div className="donation-fan"><i>✧</i><i>✳</i><i>✧</i></div>
      </div>
      <h3>Mời Lunara một ly cà phê nhé!</h3>
      <p id="donation-description">Nếu trải bài vừa rồi mang đến cho bạn một chút cảm hứng hay sự đồng cảm,
        bạn có thể gửi một lời động viên để Lunara tiếp tục phát triển.</p>
      <figure className="donation-qr">
        {qrError
          ? <p role="alert">Không tải được mã QR. Bạn hãy đóng hộp thoại và thử lại nhé.</p>
          : <img src={`${import.meta.env.BASE_URL}splash/qr_donate.jpg`} alt="Mã QR chuyển khoản ủng hộ Lunara"
            onError={() => setQrError(true)} />}
        <figcaption>Quét mã QR để ủng hộ <span>Hoàn toàn tự nguyện · Một chút cũng thật quý</span></figcaption>
      </figure>
      <p className="donation-gratitude">Mỗi sự ủng hộ đều là động lực để Lunara tỏa sáng hơn <span aria-hidden="true">♥</span></p>
      <button className="button donation-thanks" onClick={onClose}>Cảm ơn bạn · Tiếp tục khám phá <span aria-hidden="true">✧</span></button>
      <p className="donation-footnote">Bạn luôn có thể tiếp tục mà không cần ủng hộ.</p>
    </div>
  </div>, document.body);
}

function CardModal({ card, onClose }: { card: TarotCard; onClose: () => void }) {
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

function ReadingConclusion({ result }: { result: InterpretationResult }) {
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

function SupportMessage({ result }: { result: InterpretationResult }) {
  return <div className="support-message">
    <div className="message-banner"><p>{result.overview}</p></div>
    <p>{result.safetyNote}</p>
    <p>{result.synthesis}</p>
    <ul className="reading-advice">{result.advice.map((advice) => <li key={advice}>{advice}</li>)}</ul>
    <p className="reading-reflection">{result.reflectionQuestion}</p>
  </div>;
}

function CardMeaning({ reading, result, index }: { reading: ReadingState; result: InterpretationResult; index: number }) {
  const item = reading.cards[index];
  const meaning = result.cards[index];
  return <article className="card-reading" data-card-reading>
    <p className="eyebrow">{item.position} · {item.isReversed ? "NGƯỢC" : "XUÔI"}</p>
    <h3>{item.card.name}</h3>
    <strong className="reading-headline">{meaning.headline}</strong>
    <p className="reading-meaning">{meaning.interpretation}</p>
  </article>;
}

function Interpretation({ reading, onComplete, exporting, canExport, onDownload, overlayOpen }: {
  reading: ReadingState;
  onComplete: (complete: boolean) => void;
  exporting: boolean;
  canExport: boolean;
  onDownload: () => void;
  overlayOpen: boolean;
}) {
  const [result, setResult] = useState<InterpretationResult | null>(null);
  const [pending, setPending] = useState(false);
  const [interpretationError, setInterpretationError] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [viewed, setViewed] = useState<number[]>([]);
  const [showConclusion, setShowConclusion] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const conclusionRef = useRef<HTMLDivElement>(null);
  const allViewed = viewed.length === reading.cards.length;

  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

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

  async function interpret() {
    if (result || exporting || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setPending(true);
    setInterpretationError("");
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 52_000);
    try {
      const request = readingRequestSchema.parse({
        rulesVersion,
        topic: reading.topic,
        question: reading.question,
        spreadId: reading.spreadId,
        cards: reading.cards.map((item, index) => ({
          cardId: item.card.id,
          positionId: positionIds[reading.spreadId][index],
          orientation: item.isReversed ? "reversed" : "upright",
        })),
      });
      const response = await fetch(`${import.meta.env.BASE_URL}api/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Tính năng giải nghĩa chưa sẵn sàng. Vui lòng thử lại sau.");
      }
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
          ? payload.error : "Không thể giải nghĩa lúc này. Vui lòng thử lại.";
        throw new Error(message);
      }
      let parsed: InterpretationResult;
      try {
        parsed = parseInterpretation(payload, request);
      } catch {
        throw new Error("Kết quả giải nghĩa chưa hợp lệ. Vui lòng thử lại.");
      }
      if (controllerRef.current === controller) {
        setResult(parsed);
        setOpen(true);
        if (parsed.status === "support") onComplete(true);
      }
    } catch (caught) {
      if (controllerRef.current === controller) {
        setInterpretationError(timedOut ? "Giải nghĩa mất nhiều thời gian hơn dự kiến. Vui lòng thử lại."
          : caught instanceof SyntaxError ? "Dữ liệu trả về không hợp lệ. Vui lòng thử lại."
            : caught instanceof TypeError ? "Không thể kết nối dịch vụ. Vui lòng kiểm tra mạng và thử lại."
              : caught instanceof Error ? caught.message : "Không thể giải nghĩa. Vui lòng thử lại.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setPending(false);
      }
    }
  }

  function viewCard(index: number) {
    if (exporting) return;
    setActiveIndex(index);
    setViewed((current) => current.includes(index) ? current : [...current, index]);
  }

  function conclude() {
    setShowConclusion(true);
    onComplete(true);
  }

  const isSupport = result?.status === "support";

  return <section className="interpretation" aria-label="Giải nghĩa trải bài">
    {!result && <div className="interpret-controls" data-html2canvas-ignore>
      <button className="button button-gold" onClick={interpret} disabled={pending || exporting}>
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
                <button className={`reading-card ${item.isReversed ? "reversed" : ""}`} onClick={() => viewCard(index)}
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
            <button className="button button-gold" onClick={conclude}>Kết luận</button>
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

export default App;
