# 04 — Domain Tarot và rút bài

## Bộ bài

Theo Rider–Waite–Smith: 22 Ẩn chính (Strength VIII, Justice XI) và 56 Ẩn phụ. Mỗi chất `cups`, `pentacles`, `swords`, `wands` có Ace–10, Page, Knight, Queen, King.

Nguồn dữ liệu:

- [tarotDeck.ts](../src/data/tarotDeck.ts): `TarotCard`, ID, tên, từ khóa, nghĩa ngắn dùng trong danh mục.
- [11-rule-tarot](11-rule-tarot): nghĩa riêng 78 lá, xuôi/ngược, theo chủ đề, lời khuyên và quy tắc cho provider.
- [cardArt.ts](../src/data/cardArt.ts): đường dẫn ảnh theo ID. Ảnh trang trí không là nguồn tri thức luận giải.

Hai bộ nghĩa không giống nhau: nghĩa ngắn Ẩn phụ trong TypeScript vẫn được sinh từ khung số/chất; luận giải Gemini phải dùng nghĩa chi tiết trong rule. Không coi từ khóa ngắn là nội dung đã được provider tạo.

## Model frontend

`TarotCard` có `id`, `name`, `english`, `cardNumber`, `arcana`, `suit`, `symbol`, `keywords`, `uprightKeywords`, `reversedKeywords`, `uprightMeaning`, `reversedMeaning`.

Một reading giữ `id`, `topic`, `question`, `spreadId` và các lá `{ card, position, isReversed, revealed }` trong React state. `revealed` là lượt lật ảnh ban đầu. Trạng thái lá đã xem/đang chọn, hộp thoại mở/đóng và kết luận nằm riêng trong component giải nghĩa. Không lưu timestamp, seed, audit hoặc lịch sử.

## Trải bài đang có

| spreadId | Số lá | Nhãn giao diện | positionId gửi API |
|---|---:|---|---|
| `one-card` | 1 | Thông điệp | `message` |
| `three-card` | 3 | Quá khứ · Hiện tại · Tương lai | `past`, `present`, `future` |

Tương lai là xu hướng có điều kiện, không phải tương lai cố định. Quy tắc cho 5/10 lá mới là dự phòng trong tài liệu, API và UI hiện chỉ chấp nhận 1/3 lá.

## Ngẫu nhiên

`drawCards` xáo bộ bài bằng Fisher–Yates với `crypto.getRandomValues`. Hàm `randomBelow` dùng rejection sampling tránh modulo bias. Lấy các lá đầu theo số vị trí; không trùng trong cùng trải bài. Mỗi lá có xác suất ngược 35%.

Không dùng `Math.random()`; không gọi server để rút bài. Tải lại trang không tái lập reading trước.

## Bất biến

1. ID dùng thống nhất giữa app, rule và ảnh; tên có thể có bí danh (ví dụ Death / Chuyển Hóa).
2. API kiểm tra đúng số lá, đúng thứ tự vị trí, ID tồn tại, không trùng, chiều hợp lệ.
3. Provider không được thay ID, chiều hoặc vị trí; server và client đều xác thực lại.
4. Hộp thoại giải nghĩa hiện đủ các lá; xem lá theo thứ tự bất kỳ, xem lại không rút/gọi provider lại.
5. Nội dung nguy cơ cao chuyển sang `status=support`, không luận giải các lá.
6. Artwork phải được cấp quyền phù hợp trước khi phát hành.
