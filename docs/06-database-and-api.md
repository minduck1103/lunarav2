# 06 — Dữ liệu và API hiện tại

## Không dùng database

Không có Supabase/PostgreSQL, schema, migration, seed database, auth hay REST CRUD. Không có `/api/v1`, history hoặc health endpoint. Ảnh là file tĩnh, không truy vấn database để tải ảnh.

| Dữ liệu | Vị trí |
|---|---|
| ID, tên và nghĩa ngắn 78 lá | `src/data/tarotDeck.ts` |
| Rule và nghĩa chi tiết cho Gemini | `docs/11-rule-tarot` |
| Ảnh lá và nền | `public/cards/`, `public/splash/` |
| Phiên, kết quả và bước đang xem | React state, mất khi refresh |
| Ảnh xuất | PNG tạo tại thiết bị, tải về theo thao tác người dùng |
| API key / model | Biến môi trường server trên Vercel; local có thể dùng `gemini.local.json` đã bỏ qua bởi Git và chặn tải qua Vite |

## `POST /api/interpret`

Endpoint cùng origin, `Content-Type: application/json`, body tối đa 4.096 byte.

```json
{
  "rulesVersion": "lunara-tarot-rules@1.0",
  "topic": "love",
  "question": "Tôi nên chú ý điều gì trong mối quan hệ?",
  "spreadId": "three-card",
  "cards": [
    { "cardId": "two-of-cups", "positionId": "past", "orientation": "upright" },
    { "cardId": "the-moon", "positionId": "present", "orientation": "reversed" },
    { "cardId": "the-star", "positionId": "future", "orientation": "upright" }
  ]
}
```

- Topic: `love`, `career`, `finance`, `general`.
- Question có thể rỗng, trim, tối đa 240 ký tự.
- `one-card`: đúng một lá ở `message`.
- `three-card`: đúng ba lá ở `past`, `present`, `future`, theo thứ tự.
- ID phải tồn tại, không trùng; chỉ `upright` hoặc `reversed`.
- Không chấp nhận field lạ, ảnh hoặc nghĩa lá do client cung cấp.

## Response 200

Schema đầy đủ nằm trong [interpretation.ts](../src/data/interpretation.ts), ví dụ JSON ở [rule A9/A11](11-rule-tarot).

| Trường | Nội dung |
|---|---|
| rulesVersion | `lunara-tarot-rules@1.0` |
| status | `interpreted` hoặc `support` |
| overview | Thông điệp chính, chỉ hiện khi mở kết luận |
| cards | cardId, positionId, orientation, headline, interpretation |
| synthesis | Tổng hợp mối liên hệ, hiện khi mở kết luận |
| advice | 1–3 hành động gợi ý |
| reflectionQuestion | Câu hỏi chiêm nghiệm |
| safetyNote | Chuỗi hoặc null |

`interpreted` giữ nguyên danh tính/thứ tự lá. `support` có `cards=[]` và safetyNote bắt buộc, dùng cho hỗ trợ an toàn thay vì bói bài.

## Lỗi

Body: `{ "error": "Thông báo tiếng Việt", "code": "MÃ_LỖI" }`. Không có stack trace, provider body hoặc credentials.

| HTTP | Mã / trường hợp |
|---|---|
| 400 | `INVALID_JSON`, `INVALID_REQUEST` |
| 403 | `ORIGIN` |
| 405 | `METHOD_NOT_ALLOWED`, header `Allow: POST` |
| 413 | `BODY_TOO_LARGE` |
| 415 | `CONTENT_TYPE` |
| 429 | `RATE_LIMITED`, `PROVIDER_QUOTA`; `Retry-After: 60` |
| 502 | `PROVIDER_UNAVAILABLE`, `PROVIDER_ERROR`, `INVALID_RESPONSE` |
| 503 | `NOT_CONFIGURED`, `PROVIDER_AUTH`, `PROVIDER_BUSY`; `PROVIDER_BUSY` có `Retry-After: 30` |
| 504 | `TIMEOUT` |
| 500 | `INTERNAL_ERROR`; local adapter có thể trả `LOCAL_API_ERROR` |

Mọi response từ handler dùng `Cache-Control: no-store`. Không có xác thực người dùng hoặc chống replay/idempotency toàn hệ thống. Header Origin không ngăn script ngoài trình duyệt; cần giới hạn phía Vercel trước khi public.
