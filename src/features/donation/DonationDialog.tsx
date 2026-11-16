import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { donationQrImage } from "../../platform/assets.web";

export function DonationDialog({ onClose, returnFocus }: { onClose: () => void; returnFocus: Element | null }) {
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
          : <img src={donationQrImage} alt="Mã QR chuyển khoản ủng hộ Lunara"
            onError={() => setQrError(true)} />}
        <figcaption>Quét mã QR để ủng hộ <span>Hoàn toàn tự nguyện · Một chút cũng thật quý</span></figcaption>
      </figure>
      <p className="donation-gratitude">Mỗi sự ủng hộ đều là động lực để Lunara tỏa sáng hơn <span aria-hidden="true">♥</span></p>
      <button className="button donation-thanks" onClick={onClose}>Cảm ơn bạn · Tiếp tục khám phá <span aria-hidden="true">✧</span></button>
      <p className="donation-footnote">Bạn luôn có thể tiếp tục mà không cần ủng hộ.</p>
    </div>
  </div>, document.body);
}
