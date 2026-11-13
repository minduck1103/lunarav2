import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, test, vi } from "vitest";
import { act } from "react";
import { readingRequestSchema, rulesVersion, type ReadingRequest } from "../src/data/interpretation";

const { capture } = vi.hoisted(() => ({ capture: vi.fn() }));
vi.mock("html2canvas", () => ({ default: capture }));

Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
Object.defineProperty(window, "matchMedia", { value: () => ({ matches: true }) });

const { createRoot } = await import("react-dom/client");
const { default: App } = await import("../src/App");
const originalFetch = globalThis.fetch;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let requests: ReadingRequest[];

function response(request: ReadingRequest) {
  return {
    rulesVersion, status: "interpreted", overview: "Thông điệp tổng quan của trải bài.",
    cards: request.cards.map((card, index) => ({
      ...card, headline: `Thông điệp lá ${index + 1}`, interpretation: `Nội dung riêng lá ${index + 1}.`,
    })),
    synthesis: "Kết nối của các lá cho thấy bạn có thể cân nhắc một bước nhỏ.",
    advice: ["Dành thời gian suy ngẫm"],
    reflectionQuestion: "Bạn muốn thay đổi điều gì?",
    safetyNote: null,
  };
}

beforeEach(async () => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  requests = [];
  globalThis.fetch = async (_input, init) => {
    const request = readingRequestSchema.parse(JSON.parse(String(init?.body)));
    requests.push(request);
    return Response.json(response(request));
  };
  await act(async () => { root.render(<App />); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function dialog() {
  return document.body.querySelector<HTMLElement>('[role="dialog"]');
}

function button(name: string) {
  const found = Array.from(document.body.querySelectorAll("button")).find((item) =>
    (item.getAttribute("aria-label") ?? item.textContent ?? "").includes(name));
  assert.ok(found, `Missing button: ${name}`);
  return found;
}

function hasButton(name: string) {
  return Array.from(document.body.querySelectorAll("button")).some((item) => item.textContent?.includes(name));
}

async function click(name: string) {
  await act(async () => {
    button(name).click();
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

async function draw(count: 1 | 3, reveal = true) {
  await click("Tổng quan");
  await click("Tiếp tục");
  await click(count === 1 ? "Một lá" : "Ba lá");
  await click("Xáo & rút bài");
  if (reveal) await click("Lật tất cả");
}

function visibleReading() {
  return dialog()?.querySelector("[data-card-reading]")?.textContent ?? "";
}

test("dialog shows all cards face-up and requires viewing each before the conclusion", async () => {
  await draw(3, false);
  assert.equal(hasButton("Bắt đầu giải nghĩa"), false);
  await click("Lật lá bài Quá khứ");
  assert.equal(container.querySelectorAll(".drawn-cards .tarot-card.flipped").length, 1);
  assert.equal(hasButton("Bắt đầu giải nghĩa"), false);
  await click("Lật tất cả");
  assert.equal(container.querySelectorAll('input[type="checkbox"]').length, 0);
  assert.doesNotMatch(container.textContent ?? "", /\bAI\b|Nghĩa tham khảo có sẵn|Tôi đồng ý/);
  assert.equal(dialog(), null);
  assert.equal(hasButton("Tải ảnh"), false);
  await click("Bắt đầu giải nghĩa");
  assert.equal(requests.length, 1);
  assert.equal(requests[0].cards.length, 3);
  const modal = dialog();
  assert.ok(modal);
  assert.equal(modal.getAttribute("aria-modal"), "true");
  assert.equal(modal.querySelectorAll(".reading-card img").length, 3);
  assert.equal(modal.querySelectorAll(".tarot-card, .card-flip-inner, .card-side-back").length, 0);
  assert.equal(visibleReading(), "");
  await click("Xem lá 3");
  assert.match(visibleReading(), /Nội dung riêng lá 3/);
  assert.equal(hasButton("Kết luận"), false);
  await click("Xem lá 1");
  assert.match(visibleReading(), /Nội dung riêng lá 1/);
  assert.equal(modal.querySelectorAll("[data-card-reading]").length, 1);
  assert.equal(hasButton("Kết luận"), false);
  await click("Xem lá 2");
  assert.equal(modal.querySelector(".reading-conclusion"), null);
  await click("Kết luận");
  assert.match(modal.querySelector(".reading-conclusion")?.textContent ?? "", /Kết nối của các lá/);
  assert.equal(hasButton("Tải ảnh"), true);
  const exportBlock = container.querySelector(".export-reading");
  assert.equal(exportBlock?.querySelectorAll("[data-card-reading]").length, 3);
  assert.match(exportBlock?.textContent ?? "", /Kết nối của các lá/);
  await click("Đóng giải nghĩa");
  assert.equal(dialog(), null);
  await click("Xem giải nghĩa");
  assert.ok(dialog()?.querySelector(".reading-conclusion"));
  await act(async () => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
  assert.equal(dialog(), null);
  assert.equal(requests.length, 1);
});

test("one-card spread requires viewing its card before the conclusion", async () => {
  await draw(1);
  await click("Bắt đầu giải nghĩa");
  assert.equal(requests[0].cards[0].positionId, "message");
  assert.equal(dialog()?.querySelectorAll(".journey-cards li").length, 1);
  assert.equal(hasButton("Kết luận"), false);
  await click("Xem lá 1");
  await click("Kết luận");
  assert.equal(hasButton("Tải ảnh"), true);
  await click("Đóng giải nghĩa");
  await click("Trải bài mới");
  assert.equal(dialog(), null);
  assert.equal(document.body.querySelector(".reading-conclusion"), null);
  assert.equal(hasButton("Tải ảnh"), false);
});

test("failed requests show neutral errors and retry without fabricated meanings", async () => {
  await draw(3);
  const successFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    error: "Dịch vụ đang bận. Vui lòng thử lại.", code: "PROVIDER_QUOTA",
  }, { status: 429 });
  await click("Bắt đầu giải nghĩa");
  assert.match(container.querySelector('[role="alert"]')?.textContent ?? "", /Dịch vụ đang bận/);
  assert.equal(dialog(), null);
  assert.equal(document.body.querySelectorAll("[data-card-reading]").length, 0);
  assert.doesNotMatch(container.textContent ?? "", /\bAI\b/);
  globalThis.fetch = successFetch;
  await click("Thử lại giải nghĩa");
  assert.ok(dialog());
  assert.equal(button("Xem lá 1").disabled, false);
});

test("starting over aborts pending requests and discards late results", async () => {
  await draw(3);
  let resolveResponse: ((response: Response) => void) | undefined;
  let captured: ReadingRequest | undefined;
  let signal: AbortSignal | null | undefined;
  globalThis.fetch = async (_input, init) => {
    captured = readingRequestSchema.parse(JSON.parse(String(init?.body)));
    signal = init?.signal;
    return new Promise((resolve) => { resolveResponse = resolve; });
  };
  await click("Bắt đầu giải nghĩa");
  assert.equal(button("Đang giải nghĩa").disabled, true);
  await click("Trải bài mới");
  assert.equal(signal?.aborted, true);
  assert.ok(captured && resolveResponse);
  const completed = Response.json(response(captured));
  const finish = resolveResponse;
  await act(async () => { finish(completed); });
  assert.equal(dialog(), null);
  assert.equal(document.body.querySelector(".reading-conclusion"), null);
});

test("support responses open directly in the dialog and can be saved immediately", async () => {
  await draw(3);
  globalThis.fetch = async (_input, init) => {
    const request = readingRequestSchema.parse(JSON.parse(String(init?.body)));
    return Response.json({
      ...response(request), status: "support", cards: [],
      overview: "Sự an toàn của bạn là điều quan trọng nhất.",
      safetyNote: "Hãy liên hệ người tin cậy để được hỗ trợ.",
    });
  };
  await click("Bắt đầu giải nghĩa");
  assert.match(dialog()?.textContent ?? "", /Sự an toàn của bạn/);
  assert.equal(dialog()?.querySelector(".journey-cards"), null);
  assert.equal(hasButton("Kết luận"), false);
  assert.equal(hasButton("Tải ảnh"), true);
});

test("each successful download opens the optional donation dialog without losing the reading", async () => {
  const NativeImage = Image;
  vi.spyOn(window, "Image").mockImplementation(function () {
    const image = new NativeImage();
    Object.defineProperty(image, "src", {
      set() { queueMicrotask(() => image.dispatchEvent(new Event("load"))); },
    });
    return image;
  });
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:reading");
    static revokeObjectURL = vi.fn();
  });
  const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  capture.mockResolvedValue({
    toBlob: (callback: BlobCallback) => callback(new Blob(["png"], { type: "image/png" })),
  });

  await draw(1);
  await click("Bắt đầu giải nghĩa");
  await click("Xem lá 1");
  await click("Kết luận");
  const readingDialog = dialog();
  const downloadButton = readingDialog?.querySelector<HTMLButtonElement>(".flow-actions button");
  assert.ok(downloadButton);
  downloadButton.focus();
  await act(async () => { downloadButton.click(); await new Promise((resolve) => setTimeout(resolve, 20)); });
  const donation = document.querySelector<HTMLElement>('[aria-labelledby="donation-title"]');
  assert.ok(donation);
  assert.equal(download.mock.calls.length, 1);
  assert.match(donation.querySelector("img")?.getAttribute("src") ?? "", /splash\/qr_donate\.jpg$/);
  assert.equal(container.querySelector("#reading-result .donation-dialog"), null);
  assert.equal(readingDialog?.parentElement?.hasAttribute("inert"), true);
  assert.equal(document.activeElement, donation.querySelector(".modal-close"));
  const last = donation.querySelector<HTMLButtonElement>(".donation-thanks");
  assert.ok(last);
  last.focus();
  await act(async () => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", cancelable: true })); });
  assert.equal(document.activeElement, donation.querySelector(".modal-close"));
  await act(async () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
  assert.equal(document.querySelector(".donation-dialog"), null);
  assert.ok(readingDialog?.isConnected);
  assert.equal(document.activeElement, downloadButton);
  assert.equal(readingDialog?.parentElement?.hasAttribute("inert"), false);
  await act(async () => { downloadButton.click(); await new Promise((resolve) => setTimeout(resolve, 20)); });
  assert.ok(document.querySelector(".donation-dialog"));
  assert.equal(download.mock.calls.length, 2);
  await click("Cảm ơn bạn · Tiếp tục khám phá");
  assert.equal(document.querySelector(".donation-dialog"), null);
  await click("Đóng giải nghĩa");
  assert.equal(document.body.style.overflow, "");

  capture.mockRejectedValueOnce(new Error("Không tạo được ảnh PNG."));
  await click("Tải ảnh kết quả");
  assert.equal(document.querySelector(".donation-dialog"), null);
  assert.match(container.querySelector('[role="alert"]')?.textContent ?? "", /Không tạo được ảnh PNG/);
  await click("Tải ảnh kết quả");
  assert.ok(document.querySelector(".donation-dialog"));
  await act(async () => { document.querySelector(".donation-qr img")?.dispatchEvent(new Event("error")); });
  assert.match(document.querySelector('.donation-dialog [role="alert"]')?.textContent ?? "", /Không tải được mã QR/);
  await act(async () => { document.querySelector<HTMLElement>(".donation-backdrop")?.click(); });
  assert.equal(document.querySelector(".donation-dialog"), null);
  assert.equal(requests.length, 1);
});