# Lunara — Tarot & tĩnh tâm

MVP web app Tarot bằng tiếng Việt, responsive ưu tiên mobile. Giao diện theo hướng nền midnight blue/tím đậm, ánh vàng nhẹ, hiệu ứng lật bài và trải nghiệm đọc bài 4 bước:

1. Chọn chủ đề: tình yêu, sự nghiệp, tài chính hoặc tổng quan.
2. Nhập câu hỏi (không bắt buộc).
3. Chọn trải bài một lá hoặc ba lá, rồi rút bài.
4. Lật các lá vừa rút như trước (hoặc **Lật tất cả**); ảnh các lá vẫn hiển thị. Bên dưới xuất hiện **Bắt đầu giải nghĩa**.
5. Nhấn **Bắt đầu giải nghĩa** để mở hộp thoại phủ lên trang với đủ các lá; chạm từng lá để xem nội dung riêng.
6. Sau lá cuối, chọn **Kết luận** để xem tổng hợp; sau đó **Tải ảnh kết quả** để tải PNG đầy đủ câu hỏi, các lá và nội dung.

## Công nghệ

- React, TypeScript, Vite.
- Không cần database, tài khoản hoặc cấu hình Supabase.
- Rút bài ngay trong trình duyệt bằng Web Crypto, không lặp lá trong cùng phiên.
- Kết quả chỉ tồn tại trong bộ nhớ: tải lại trang hoặc trải bài mới sẽ mất kết quả cũ. Không lưu câu hỏi/kết quả vào localStorage hoặc database.
- Xuất PNG bằng html2canvas, xử lý tại thiết bị; ảnh gồm toàn bộ phần kết quả và nghĩa của mọi lá, không chỉ lá đang chọn/vùng đang nhìn thấy. Nút tải xuất hiện sau khi mở kết luận; nút thao tác không nằm trong ảnh.
- Tích hợp Gemini qua Vercel Function `/api/interpret` ngay trong project. Chỉ gửi câu hỏi và các lá đến server/Google khi chọn **Bắt đầu giải nghĩa**; không gửi ảnh. Khi dịch vụ lỗi hoặc chưa cấu hình key, giao diện báo lỗi và cho thử lại, không dựng kết quả thay thế.
- Giữ nguyên lượt lật bài ban đầu sau xáo/rút; nút Bắt đầu giải nghĩa chỉ xuất hiện khi đã mở hết bài. Sau đó hộp thoại phủ trang hiện ngay 1 hoặc 3 lá nằm ngang, không hiệu ứng lật; chạm lá nào xem lá đó, có dấu đã xem. Nút Kết luận chỉ hiện khi đã xem đủ mọi lá và không gọi API thêm. Đóng được và mở lại bằng Xem giải nghĩa.
- Không có nhãn “AI”, nghĩa tham khảo hoặc checkbox trong luồng. Footer có **Quyền riêng tư** giải thích nội dung tạo tự động, dữ liệu gửi đến Gemini và chính sách free tier.

## Chạy giao diện

Yêu cầu Node.js 20.19+ hoặc 22.12+.

```powershell
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal. Không cần khóa API hoặc database để rút bài và xem danh mục. Giải nghĩa và mở kết quả cần cấu hình key hợp lệ.

Vite có middleware local cho cùng endpoint `/api/interpret`. Muốn thử AI thật, tự cấu hình biến môi trường server `GEMINI_API_KEY` (và tùy chọn `GEMINI_MODEL`) trong tiến trình chạy Vite rồi khởi động lại. Không dùng biến `VITE_*` cho key. `npm run preview` chỉ phục vụ frontend tĩnh, không chạy Function.

Nếu muốn chỉnh key trực tiếp trong project, tạo hoặc sửa `gemini.local.json` ở thư mục gốc:

```json
{
  "GEMINI_API_KEY": "DAN_KEY_MOI_CUA_BAN_VAO_DAY"
}
```

Sau khi lưu, khởi động lại `npm run dev`. Có thể thêm `GEMINI_MODEL` kiểu chuỗi nếu cần đổi model. Biến môi trường được ưu tiên hơn file này. File chỉ được middleware server local đọc, đã nằm trong `.gitignore`; không commit, không đặt trong `public/` hoặc import vào `src/`. Khi clone repo mới, cần tự tạo lại file. Vercel vẫn dùng Environment Variables, không dùng cấu hình local này.

## Hình ảnh lá bài (skin Liên Minh Huyền Thoại)

Mỗi lá trong 78 lá được gán một skin tướng LMHT, ưu tiên dòng skin Arcana, Star Guardian, Spirit Blossom… Ảnh đã được tải sẵn vào `public/cards/` (ảnh loading dọc) và `public/splash/` (ảnh nền chủ đề/hero), không gọi CommunityDragon khi người dùng xem bài. Ảnh chỉ để trang trí, không gửi tới Gemini. App chưa có service worker/offline cache; Gemini cần mạng, font hiện tải từ Google Fonts.

- Đổi tướng/skin: sửa danh sách trong `tools/fetch-card-art.mjs`, xóa ảnh cần thay trong `public/cards/` (hoặc `public/splash/` nếu thay nền), rồi chạy `npm run art` (nguồn: CommunityDragon).
- Sau proxy công ty: đặt `HTTPS_PROXY` và `NODE_USE_ENV_PROXY=1` trước khi chạy.
- Ảnh hỏng hoặc thiếu sẽ tự động hiển thị biểu tượng dự phòng.

> Hình ảnh thuộc bản quyền Riot Games; tải từ CommunityDragon không tự cấp quyền sử dụng. Cần xác minh chính sách/quyền dùng trước khi public hoặc thương mại hóa; nếu chưa rõ, thay bằng artwork có giấy phép phù hợp. Nguồn gốc này chỉ ghi trong tài liệu, không đưa nhân vật/trò chơi vào luận giải.

## Cấu trúc source

- [`src/App.tsx`](src/App.tsx): giao diện, luồng đọc bài và tải PNG.
- [`src/styles.css`](src/styles.css): typography, responsive và animation.
- [`src/data/tarotDeck.ts`](src/data/tarotDeck.ts): dữ liệu 78 lá và logic rút bài.
- [`src/data/cardArt.ts`](src/data/cardArt.ts): đường dẫn tài nguyên hình ảnh.
- [`src/data/interpretation.ts`](src/data/interpretation.ts): hợp đồng request/response và kiểm tra kết quả.
- [`api/interpret.ts`](api/interpret.ts): entry point Vercel Function.
- [`server/`](server/): gọi Gemini và chọn kiến thức từ rule; không đóng gói vào frontend.
- [`tests/interpret.test.ts`](tests/interpret.test.ts): kiểm thử endpoint, rule, schema, timeout và giới hạn yêu cầu.
- [`tests/reading-flow.test.tsx`](tests/reading-flow.test.tsx): kiểm thử hộp thoại, xem đủ lá mới có kết luận, một lá, lỗi/retry và hủy request.
- [`public/`](public/): ảnh dùng trực tiếp bởi app.
- [`tools/fetch-card-art.mjs`](tools/fetch-card-art.mjs): công cụ tải/cập nhật ảnh.
- [`docs/`](docs/): tài liệu yêu cầu và thiết kế tham khảo.
- [`assets/`](assets/): sơ đồ thiết kế ban đầu, không phải tài nguyên chạy app.

Chi tiết: [03 — Cấu trúc project](docs/03-project-structure.md). Backend Supabase và migration không còn dùng đã được xóa.

## Deploy Vercel và cấu hình Gemini

Không cần project/backend riêng, database hoặc VPS:

1. **Thu hồi ngay key đã từng chia sẻ trong chat/source**, tạo key mới trong [Google AI Studio](https://aistudio.google.com/apikey). Không gửi key mới vào chat.
2. Import project vào Vercel; chọn thư mục chứa `package.json` làm Root Directory và preset **Vite**. Chọn Node.js **22.x** hoặc **24.x**. Cấu hình trong `vercel.json` đã chỉ định build và thư mục `dist`.
3. Vercel → **Project Settings → Environment Variables**:
   - `GEMINI_API_KEY`: key mới, chỉ dùng ở server, bật cho Production (và Preview nếu cần).
   - `GEMINI_MODEL`: tùy chọn; mặc định `gemini-3.6-flash`. Chọn model tài khoản của bạn được phép dùng; free tier và hạn mức có thể thay đổi.
4. Deploy/redeploy sau khi thay biến môi trường.
5. Xem thông tin tại **Quyền riêng tư**, trải bài, mở hết các lá ban đầu rồi chọn **Bắt đầu giải nghĩa** ở dưới. Trong hộp thoại, chạm xem từng lá rồi chọn **Kết luận**. PNG chứa toàn bộ kết quả, không lặp lại hàng ảnh ban đầu; chưa thể xuất trước khi mở kết luận. Nội dung hỗ trợ an toàn (`status=support`) hiển thị ngay, không qua các bước luận giải.
6. Trước khi mở công khai, cấu hình **Vercel Firewall/rate limiting** cho đường dẫn `/api/interpret`, kiểm tra quota Gemini và giới hạn chi tiêu Vercel. Không bật billing Gemini nếu chỉ muốn dùng free tier.

API giới hạn JSON 4 KB, câu hỏi 240 ký tự, chỉ nhận 1 hoặc 3 lá hợp lệ không trùng, kiểm tra Origin khi có header. Chỉ gửi Phần A, khung tri thức và nghĩa của các lá đã rút từ `docs/11-rule-tarot`. Đầu ra JSON được xác thực, sai định dạng/nội dung kiểm tra sẽ tạo lại tối đa một lần. Lỗi Gemini HTTP 503 được thử lại với khoảng chờ 1 giây rồi 2 giây, cộng jitter dưới 250 ms; tổng tối đa 3 lần gọi provider cho mỗi yêu cầu, tính cả tạo lại output. Không tự retry lỗi quota/auth/network, không tự đổi model. Nếu vẫn 503, trả `PROVIDER_BUSY` với `Retry-After: 30`, không đổi thành lỗi 502 chung. Deadline server 45 giây bao gồm cả thời gian chờ/retry, client 52 giây, Function tối đa 60 giây; giới hạn output 4.096 token mỗi lần gọi. Không gửi temperature tùy chỉnh để tương thích Gemini 3.6+. Riêng `gemini-3.6-flash` dùng `thinkingLevel: LOW` để giảm độ trễ và tiêu hao token suy luận; model tùy chỉnh giữ mức suy luận mặc định của provider.

Giới hạn trong bộ nhớ là **best-effort theo từng Function instance** (3 yêu cầu/phút/IP, 20/phút/instance), không phải quota toàn hệ thống: instance mới/scale-out sẽ có bộ đếm mới; header IP cũng không phải xác thực người dùng. Origin không ngăn được client ngoài trình duyệt. Cần lớp Firewall phía Vercel trước khi dùng public; khả năng/rate-limit rule phụ thuộc gói Vercel.

Không ghi log key, câu hỏi hoặc nội dung luận giải; chỉ log mã lỗi/status. Response dùng `Cache-Control: no-store`. Tuy nhiên Google xử lý câu hỏi và free tier có thể dùng dữ liệu để cải thiện sản phẩm: tránh dữ liệu nhạy cảm, xem [điều khoản Gemini](https://aistudio.google.com/docs/terms). Các kiểm tra mã không thể bảo đảm mọi quy tắc ngữ nghĩa; cần đánh giá thêm với dữ liệu thử trước khi phát hành.

Tích hợp đã có trong source, không đồng nghĩa đã deploy hoặc kiểm thử bằng key thật. Chủ dự án tự cấu hình key mới và xác minh model/quota trên Vercel.

## Lệnh kiểm tra

```powershell
npm test
npm run build
npm run preview
```

`npm test` chạy Node/tsx cho API và Vitest/jsdom cho tương tác UI. `npm run build` kiểm tra kiểu frontend/server/test rồi build Vite. Không dùng key thật trong các test; browser/PNG và provider thật cần kiểm tra riêng.

## Tài liệu sản phẩm

Các tài liệu [`docs/`](docs/) đã được cập nhật theo source hiện tại: React + Vercel Function, không database, đọc từng lá rồi kết luận, lưu PNG. Chỉ các sơ đồ PNG trong [`assets/`](assets/) còn là tài liệu lịch sử. Kotlin Multiplatform là Tương lai rộng, chưa triển khai.

| Tài liệu | Nội dung / trạng thái |
|---|---|
| [01 — Product overview](docs/01-product-overview.md) | Phạm vi MVP và giới hạn hiện tại |
| [02 — Architecture](docs/02-architecture.md) | Kiến trúc React + Vercel Function |
| [03 — Project structure](docs/03-project-structure.md) | Cấu trúc source và luồng dữ liệu hiện tại |
| [04 — Tarot domain](docs/04-tarot-domain.md) | Quy tắc bộ bài và trải bài |
| [05 — AI interpretation](docs/05-ai-interpretation.md) | Pipeline Gemini, rule, validation và giới hạn |
| [06 — Database and API](docs/06-database-and-api.md) | Vị trí dữ liệu, hợp đồng POST /api/interpret và mã lỗi |
| [07 — Frontend UX](docs/07-frontend-ux.md) | Hộp thoại giải nghĩa, kết luận, PNG và quyền riêng tư |
| [08 — Security and operations](docs/08-security-and-operations.md) | Secrets, deploy, hạn mức và rủi ro còn lại |
| [09 — Roadmap and testing](docs/09-roadmap-and-testing.md) | Test hiện có và việc cần làm trước public |
| [10 — Decisions and open questions](docs/10-decisions-and-open-questions.md) | Quyết định đã chốt và câu hỏi còn mở |
| [11 — Quy tắc Tarot](docs/11-rule-tarot) | Bộ quy tắc luận giải cho AI (`lunara-tarot-rules@1.0`): nguyên tắc, giới hạn an toàn, vị trí trải bài, định dạng JSON đầu ra và kho tri thức đầy đủ 78 lá theo ID |
| [Sơ đồ](assets/README.md) | Sơ đồ tham khảo thiết kế ban đầu |
