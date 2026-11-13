import { z } from "zod";
import { setTimeout as delay } from "node:timers/promises";
import { interpretationSchema, parseInterpretation, readingRequestSchema } from "../src/data/interpretation";
import { buildSystemInstruction } from "./rules";

const maxBodyBytes = 4096;
const upstreamSchema = z.object({
  candidates: z.array(z.object({
    finishReason: z.string().optional(),
    content: z.object({ parts: z.array(z.object({
      text: z.string().optional(),
      thought: z.boolean().optional(),
    })) }).optional(),
  })).optional(),
});

class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

async function readBody(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ApiError(415, "CONTENT_TYPE", "Yêu cầu phải dùng JSON.");
  }
  if (Number(request.headers.get("content-length")) > maxBodyBytes) {
    throw new ApiError(413, "BODY_TOO_LARGE", "Yêu cầu quá lớn.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "INVALID_REQUEST", "Thiếu dữ liệu trải bài.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBodyBytes) {
      await reader.cancel();
      throw new ApiError(413, "BODY_TOO_LARGE", "Yêu cầu quá lớn.");
    }
    chunks.push(value);
  }
  const parsed = readingRequestSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  if (!parsed.success) throw new ApiError(400, "INVALID_REQUEST", "Dữ liệu trải bài không hợp lệ.");
  return parsed.data;
}

export function createInterpretHandler({
  env = process.env,
  fetcher = fetch,
  now = Date.now,
  timeoutMs = 45_000,
}: {
  env?: { GEMINI_API_KEY?: string; GEMINI_MODEL?: string };
  fetcher?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
} = {}) {
  const clients = new Map<string, { count: number; reset: number }>();
  let total = { count: 0, reset: 0 };

  return async function interpret(request: Request): Promise<Response> {
    try {
      if (request.method !== "POST") {
        return json({ error: "Chỉ hỗ trợ POST.", code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "POST" });
      }
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) {
        throw new ApiError(403, "ORIGIN", "Nguồn yêu cầu không được phép.");
      }
      const reading = await readBody(request);
      if (!env.GEMINI_API_KEY?.trim()) {
        throw new ApiError(503, "NOT_CONFIGURED", "Tính năng giải nghĩa chưa được cấu hình. Vui lòng thử lại sau.");
      }
      const model = env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
      if (!/^[a-z0-9][a-z0-9._-]{0,100}$/u.test(model)) throw new Error("Invalid server model configuration.");

      // Best-effort per-instance limits only. Configure Vercel Firewall for deployment-wide abuse protection.
      const time = now();
      for (const [key, limit] of clients) if (limit.reset <= time) clients.delete(key);
      const client = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
      const limit = clients.get(client) ?? { count: 0, reset: time + 60_000 };
      if (total.reset <= time) total = { count: 0, reset: time + 60_000 };
      if (limit.count >= 3 || total.count >= 20 || (!clients.has(client) && clients.size >= 1000)) {
        throw new ApiError(429, "RATE_LIMITED", "Bạn đang gửi quá nhanh. Vui lòng đợi một phút rồi thử lại.");
      }
      limit.count++;
      total.count++;
      clients.set(client, limit);
      const controller = new AbortController();
      const cancel = () => controller.abort();
      request.signal.addEventListener("abort", cancel, { once: true });
      if (request.signal.aborted) controller.abort();
      const timer = setTimeout(cancel, timeoutMs);
      try {
        const systemInstruction = buildSystemInstruction(reading);
        let invalidResponses = 0;
        let busyRetries = 0;
        for (let attempt = 0; attempt < 3; attempt++) {
          controller.signal.throwIfAborted();
          let upstream: Response;
          try {
            upstream = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
              signal: controller.signal,
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: "user", parts: [{ text: JSON.stringify(reading) }] }],
                generationConfig: {
                  maxOutputTokens: 4096,
                  ...(model === "gemini-3.6-flash" ? { thinkingConfig: { thinkingLevel: "LOW" } } : {}),
                  responseMimeType: "application/json",
                  responseJsonSchema: z.toJSONSchema(interpretationSchema),
                },
              }),
            });
          } catch (error) {
            if (controller.signal.aborted) throw error;
            throw new ApiError(502, "PROVIDER_UNAVAILABLE", "Không kết nối được dịch vụ giải nghĩa. Vui lòng thử lại sau.");
          }
          controller.signal.throwIfAborted();
          if (!upstream.ok) {
            // Never log provider bodies, headers, questions or credentials.
            console.warn("Gemini request rejected", { status: upstream.status, attempt: attempt + 1 });
            if (upstream.status === 503) {
              await upstream.body?.cancel();
              if (attempt < 2) {
                const waitMs = 1000 * 2 ** busyRetries++ + Math.floor(Math.random() * 250);
                await delay(waitMs, undefined, { signal: controller.signal });
                continue;
              }
              throw new ApiError(503, "PROVIDER_BUSY", "Dịch vụ giải nghĩa đang quá tải hoặc tạm thời không khả dụng. Vui lòng đợi một lát rồi thử lại.");
            }
            if (upstream.status === 429) throw new ApiError(429, "PROVIDER_QUOTA", "Dịch vụ đang bận hoặc đã đạt hạn mức. Vui lòng thử lại sau.");
            if (upstream.status === 401 || upstream.status === 403) {
              throw new ApiError(503, "PROVIDER_AUTH", "Dịch vụ giải nghĩa chưa sẵn sàng. Vui lòng thử lại sau.");
            }
            throw new ApiError(502, "PROVIDER_ERROR", "Dịch vụ không xử lý được yêu cầu. Vui lòng thử lại sau.");
          }
          try {
            const payload = upstreamSchema.parse(await upstream.json());
            const candidate = payload.candidates?.[0];
            if (candidate?.finishReason !== "STOP") throw new Error("Incomplete or blocked output.");
            const output = candidate.content?.parts.filter((part) => !part.thought).map((part) => part.text ?? "").join("");
            if (!output) throw new Error("Empty provider response.");
            const interpretation = parseInterpretation(JSON.parse(output), reading);
            controller.signal.throwIfAborted();
            return json(interpretation);
          } catch (error) {
            if (controller.signal.aborted) throw error;
            console.warn("Gemini response failed validation", { attempt: attempt + 1 });
            invalidResponses++;
            if (invalidResponses >= 2) break;
          }
        }
        throw new ApiError(502, "INVALID_RESPONSE", "Kết quả giải nghĩa chưa hợp lệ. Vui lòng thử lại.");
      } finally {
        clearTimeout(timer);
        request.signal.removeEventListener("abort", cancel);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.warn("Interpretation request failed", { code: error.code, status: error.status });
        return json({ error: error.message, code: error.code }, error.status,
          error.status === 429 ? { "Retry-After": "60" }
            : error.code === "PROVIDER_BUSY" ? { "Retry-After": "30" } : {});
      }
      if (error instanceof SyntaxError) {
        return json({ error: "JSON không hợp lệ.", code: "INVALID_JSON" }, 400);
      }
      if (error instanceof Error && error.name === "AbortError") {
        return json({ error: "Giải nghĩa mất nhiều thời gian hơn dự kiến hoặc đã bị hủy. Vui lòng thử lại.", code: "TIMEOUT" }, 504);
      }
      console.error("Interpretation failed", { code: "INTERNAL_ERROR" });
      return json({ error: "Không thể giải nghĩa lúc này. Vui lòng thử lại.", code: "INTERNAL_ERROR" }, 500);
    }
  };
}
