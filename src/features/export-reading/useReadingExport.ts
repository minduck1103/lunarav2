import { useRef, useState } from "react";
import { exportReadingImage } from "./exportReadingImage";

export function useReadingExport({ readingId, canExport, onError, onSuccess }: {
  readingId: string | null;
  canExport: boolean;
  onError: (error: string) => void;
  onSuccess: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);

  async function downloadResult() {
    if (!resultRef.current || !canExport || isExporting || !readingId) return;
    returnFocusRef.current = document.activeElement;
    setIsExporting(true);
    onError("");
    try {
      await exportReadingImage(resultRef.current, readingId);
      onSuccess();
    } catch (caught) {
      onError(caught instanceof Error ? `Không tải được ảnh: ${caught.message}` : "Không tải được ảnh kết quả. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  }

  return { isExporting, resultRef, returnFocusRef, downloadResult };
}
