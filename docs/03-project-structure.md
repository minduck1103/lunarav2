# 03 — Cấu trúc project hiện tại

Lunara là một app React + TypeScript + Vite, không phải monorepo. Không cần database hoặc đăng nhập. Rút bài chạy ở browser; giải nghĩa cần Function và provider; PNG tạo tại thiết bị sau kết luận.

AI dùng một Vercel Function trong cùng project, không cần backend riêng. Xem [hướng dẫn deploy và cấu hình key](../README.md#deploy-vercel-và-cấu-hình-gemini).

```text
tarot-platform-docs/
  src/
    main.tsx                Entry point React
    App.tsx                 Luồng đọc bài, thư viện lá bài, modal, xuất PNG
    styles.css              Giao diện, responsive và animation
    vite-env.d.ts           Kiểu dữ liệu Vite
    data/
      tarotDeck.ts          78 lá, chủ đề, trải bài, rút bài Web Crypto
      cardArt.ts            Đường dẫn ảnh lá bài và ảnh nền
      interpretation.ts     Schema request/response và kiểm tra kết quả AI
  api/
    interpret.ts            Vercel Function POST /api/interpret
  server/
    interpret.ts            Gọi Gemini, timeout, giới hạn và lỗi
    rules.ts                Đọc rule và chọn tri thức đúng ID lá
  tests/
    interpret.test.ts       Kiểm thử tích hợp với provider giả lập
    reading-flow.test.tsx    Kiểm thử UI từng lá/kết luận/lỗi/hủy request
  public/
    cards/                  78 ảnh lá bài
    splash/                 5 ảnh nền
  tools/
    fetch-card-art.mjs      Công cụ tải ảnh, chạy bằng npm run art
  docs/                     Tài liệu yêu cầu và thiết kế tham khảo
  assets/                   Sơ đồ của thiết kế ban đầu
  index.html                Trang HTML gốc
  package.json              Dependencies và lệnh npm
  package-lock.json         Khóa phiên bản dependencies
  tsconfig.json             Cấu hình TypeScript
  tsconfig.app.json         Cấu hình TypeScript frontend
  tsconfig.server.json      Kiểm tra kiểu server, local adapter và test
  vercel.json               Build, thời gian Function, đóng gói rule
  vite.config.ts            Cấu hình Vite
  vitest.config.ts          Cấu hình test UI bằng jsdom
  .gitignore                Bỏ qua dependencies, build output và secrets
  README.md                 Hướng dẫn và mục lục tài liệu
```

## Luồng dữ liệu

1. Người dùng chọn chủ đề, nhập câu hỏi và chọn trải bài.
2. `drawCards` chọn lá bằng Web Crypto, không lặp trong cùng phiên.
3. React state giữ kết quả và trạng thái lật bài.
4. Sau xáo bài, hiện bài úp. Người dùng lật từng lá hoặc Lật tất cả như trước; mở hết mới hiện nút Bắt đầu giải nghĩa bên dưới. Nhấn nút mới gửi câu hỏi/ID/vị trí/chiều đến `/api/interpret`; kết quả mở trong hộp thoại (portal vào `document.body`) và một bản ẩn `.export-reading` trong `#reading-result` dùng cho PNG.
5. Function đọc nghĩa từ `docs/11-rule-tarot`, không gửi ảnh, gọi Gemini bằng key server và xác thực kết quả. Lỗi được hiển thị rõ, không giả làm thành công.
6. Client giữ một response chung; mở lần lượt các lá, nội dung riêng từng lá, rồi nút Kết luận mở phần tổng hợp. Trải một lá dùng một bước.
7. Sau kết luận, html2canvas tạo PNG toàn bộ phần kết quả tại thiết bị, bao gồm các phần nghĩa tạm ẩn trên màn hình; không chụp lặp lại hàng ảnh ban đầu.
8. Tải lại trang hoặc trải bài mới sẽ bỏ kết quả trước đó; không có lịch sử server/localStorage. Google xử lý dữ liệu theo chính sách provider; thông báo ở footer.

## Thư mục được sinh tự động

- `node_modules/`: dependencies do `npm install` quản lý; cần để chạy local.
- `dist/`: bản build do `npm run build` tạo, dùng khi deploy hoặc preview.

Không chỉnh tay các thư mục này. Backend Supabase, migration, metadata skin được sinh trước đây và thư mục `src/lib/` rỗng đã được loại bỏ vì không còn dùng.

## Tài liệu tham khảo

Xem [mục lục tại README](../README.md#tài-liệu-sản-phẩm). Các tài liệu 01–11 mô tả project hiện tại; PNG trong assets là sơ đồ cũ, không thuộc runtime.
