import { parseInterpretation, readingRequestSchema, type ReadingRequest } from "../contracts/interpretation";

export async function requestInterpretation(request: ReadingRequest, { baseUrl, signal }: {
  baseUrl: string;
  signal: AbortSignal;
}) {
  const validated = readingRequestSchema.parse(request);
  const response = await fetch(`${baseUrl}api/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validated),
    signal,
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
  try {
    return parseInterpretation(payload, validated);
  } catch {
    throw new Error("Kết quả giải nghĩa chưa hợp lệ. Vui lòng thử lại.");
  }
}
