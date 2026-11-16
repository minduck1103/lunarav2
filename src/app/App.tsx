import { useState } from "react";
import { getCard } from "../domain/tarot/cards";
import type { TarotCard } from "../domain/tarot/types";
import { CardLibrary } from "../features/card-library/CardLibrary";
import { CardPreviewDialog } from "../features/card-library/CardPreviewDialog";
import { DonationDialog } from "../features/donation/DonationDialog";
import { useReadingExport } from "../features/export-reading/useReadingExport";
import { ReadingWizard } from "../features/reading/components/ReadingWizard";
import { useReadingFlow } from "../features/reading/hooks/useReadingFlow";
import { SoundToggle } from "../features/sound-settings/SoundToggle";
import { useSoundSettings } from "../features/sound-settings/useSoundSettings";
import { splashImage } from "../platform/assets.web";
import { CardArt } from "../shared/ui/CardArt";

const heroCards = ["the-star", "the-moon", "the-sun"];

function App() {
  const sound = useSoundSettings();
  const flow = useReadingFlow(sound.audio);
  const [donationOpen, setDonationOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<TarotCard | null>(null);
  const { isExporting, resultRef, returnFocusRef, downloadResult } = useReadingExport({
    readingId: flow.reading?.id ?? null,
    canExport: flow.canExport,
    onError: flow.setError,
    onSuccess: () => { sound.audio.play("success"); setDonationOpen(true); },
  });

  function scrollToReading() {
    document.getElementById("reading")?.scrollIntoView({ behavior: "smooth" });
  }

  function preview(card: TarotCard) {
    sound.audio.play("pick");
    setPreviewCard(card);
  }

  return (
    <main inert={donationOpen}>
      <header className="topbar shell">
        <a className="brand" href="#" data-sound-handled onClick={(event) => {
          if (isExporting) event.preventDefault();
          else flow.startOver();
        }} aria-label="Lunara, về trang đầu">
          <span className="brand-mark">✳</span><span>LUNARA</span>
        </a>
        <div className="topbar-actions">
          <div className="sound-control">
            <SoundToggle enabled={sound.enabled} loading={sound.loading} onToggle={sound.toggle} />
            {sound.loading && <p className="sound-message" role="status">Đang tải âm thanh…</p>}
            {sound.error && <p className="sound-message" role="alert">{sound.error}</p>}
          </div>
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

      <ReadingWizard flow={flow} resultRef={resultRef} isExporting={isExporting} downloadResult={downloadResult}
        donationOpen={donationOpen} onPreview={preview} sound={sound.audio} />
      <CardLibrary onPreview={preview} onSelect={() => sound.audio.play("select")} />

      <footer className="footer shell">
        <span className="brand"><span className="brand-mark">✳</span><span>LUNARA</span></span>
        <details className="privacy">
          <summary>Quyền riêng tư</summary>
          <p>Khi chọn “Bắt đầu giải nghĩa”, câu hỏi và các lá bài được gửi đến Google Gemini để tạo nội dung tự động.
            Dịch vụ miễn phí có thể dùng dữ liệu để cải thiện sản phẩm. Không nhập thông tin nhạy cảm.
            Lunara không lưu câu hỏi hoặc kết quả vào database; tải lại trang sẽ xóa phiên hiện tại.</p>
        </details>
      </footer>

      {previewCard && <CardPreviewDialog card={previewCard} onClose={() => setPreviewCard(null)} />}
      {donationOpen && <DonationDialog onClose={() => setDonationOpen(false)} returnFocus={returnFocusRef.current} />}
    </main>
  );
}

export default App;
