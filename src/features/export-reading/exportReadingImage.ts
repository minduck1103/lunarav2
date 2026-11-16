export async function exportReadingImage(element: HTMLDivElement, readingId: string) {
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
  link.download = `lunara-${readingId}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
