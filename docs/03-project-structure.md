# 03 — Cấu trúc project hiện tại

Lunara là một app React + TypeScript + Vite, tổ chức feature-first, chưa phải monorepo. Không cần database hoặc đăng nhập. Rút bài chạy ở browser; giải nghĩa cần Function và provider; PNG tạo tại thiết bị sau kết luận.

AI dùng một Vercel Function trong cùng project, không cần backend riêng. Xem [hướng dẫn deploy và cấu hình key](README.md#deploy-vercel-và-cấu-hình-gemini).

```text
lunara/
  src/
    main.tsx                Entry point React
    vite-env.d.ts           Kiểu dữ liệu Vite
    app/
      App.tsx               Layout và ghép các feature
      styles/
        global.css          Giao diện, responsive và animation
    features/
      reading/
        components/
          ReadingWizard.tsx Luồng chủ đề/câu hỏi/trải bài/lật bài
          CardBack.tsx      Mặt sau lá bài và shuffle
          InterpretationDialog.tsx  Hộp thoại, lượt xem và kết luận
          ReadingContent.tsx        Nghĩa lá, kết luận, nội dung hỗ trợ
        hooks/
          useReadingFlow.ts         Điều phối reducer và rút bài
          useInterpretation.ts      Request, deadline, hủy và response cũ
        reading.reducer.ts  Trạng thái và chuyển bước thuần TypeScript
        reading.types.ts    Reading và lượt lật
        reading.config.ts   Nhãn bước, chủ đề và câu hỏi gợi ý
        reading-flow.test.tsx        Kiểm thử tương tác end-to-end với API giả lập
      card-library/
        CardLibrary.tsx     Tìm kiếm và lọc bộ bài
        CardPreviewDialog.tsx       Popup từ khóa, dùng cả cho bài đã rút
      export-reading/
        exportReadingImage.ts       html2canvas, PNG và tải xuống
        useReadingExport.ts         Trạng thái xuất, lỗi và focus trả về
      donation/
        DonationDialog.tsx  Lời mời ủng hộ sau tải PNG
      sound-settings/
        SoundToggle.tsx     Bật/tắt âm thanh trên header
        useSoundSettings.ts Lưu lựa chọn, lifecycle và lỗi audio
    domain/
      tarot/
        cards.ts            78 lá và tra cứu ID
        types.ts            TarotCard, Topic, SpreadId
        spreads.ts          Các trải bài và vị trí
        drawCards.ts        Fisher–Yates với nguồn random được truyền vào
        drawCards.test.ts   Bất biến rút bài và ranh giới chiều ngược
    contracts/
      interpretation.ts     Schema request/response và kiểm tra kết quả
    services/
      interpretationClient.ts       HTTP client nhận base URL và AbortSignal
    platform/
      assets.web.ts         Đường dẫn ảnh/sound theo Vite base URL
      audio.web.ts          Howler, preload/play/stop và lịch sound
      audio.web.test.ts     Kiểm thử mute, lịch, throttle và lỗi
      random.web.ts         Web Crypto và rejection sampling
    shared/
      audio.ts              SoundName và SoundPlayer, không phụ thuộc Howler
      ui/
        CardArt.tsx         Ảnh/fallback dùng chung trên web
  api/
    interpret.ts            Vercel Function POST /api/interpret
  server/
    interpret.ts            Gọi Gemini, timeout, giới hạn và lỗi
    rules.ts                Đọc rule và chọn tri thức đúng ID lá
  tests/
    interpret.test.ts       Kiểm thử tích hợp với provider giả lập
  public/
    cards/                  78 ảnh lá bài
    splash/                 5 ảnh nền
    sounds/                 7 effect CC0, OGG và WAV fallback
  tools/
    fetch-card-art.mjs      Công cụ tải ảnh, chạy bằng npm run art
  docs/                     Toàn bộ tài liệu mô tả, không chứa source code
    README.md               Hướng dẫn chạy/deploy và mục lục tài liệu
    01-*.md ... 10-*.md      Mô tả sản phẩm, kiến trúc, API, UX, vận hành
    11-rule-tarot           Rule văn bản được server đọc, giữ nguyên đường dẫn
    sound-assets.md         Nguồn sound, license, action và hướng chuyển storage
    licenses/              License gốc của bộ sound Kenney
    assets/
      README.md             Mô tả sơ đồ lịch sử
      system-architecture.png
      reading-flow.png
      domain-erd.png
  index.html                Trang HTML gốc
  package.json              Dependencies và lệnh npm
  package-lock.json         Khóa phiên bản dependencies
  tsconfig.json             Cấu hình TypeScript
  tsconfig.app.json         Cấu hình TypeScript frontend
  tsconfig.server.json      Kiểm tra kiểu server, local adapter và test
  vercel.json               Build, thời gian Function, đóng gói rule
  vite.config.ts            Cấu hình Vite
  vitest.config.ts          Test đồng vị trí trong src bằng jsdom
  .gitignore                Bỏ qua dependencies, build output và secrets
```

## Ranh giới phụ thuộc

- `app` ghép feature và nối callback; không chứa HTTP, thuật toán rút hoặc xử lý PNG.
- Mỗi feature sở hữu UI, hook, cấu hình và test của mình. Các feature không import implementation của nhau; app nối preview, export và donation bằng props/callback.
- `domain` và `contracts` không import React, DOM, Vite hoặc server. Server chỉ dùng hai vùng này của source frontend.
- `services` dùng contracts, nhận base URL và signal từ app/hook; không đọc biến môi trường Vite.
- `platform` chứa adapter web. `drawCards` nhận hàm `randomBelow`; hook web cung cấp implementation Web Crypto.
- Sound dùng Howler qua `SoundPlayer`; app ghép sound settings và các feature, không đưa audio vào domain/reducer.
- `shared/ui` chỉ chứa UI thật sự dùng ở nhiều nơi; hiện là `CardArt`, không phải bộ UI native dùng chung.
- Giữ CSS global nguyên trạng để tránh thay đổi giao diện. Chưa thêm provider, router, state library, database hay thư mục dự phòng.

Khi có mobile, có thể đưa domain/contracts/API client thành workspace packages và thêm adapter native. UI DOM, portal, CSS, xuất PNG vẫn cần implementation riêng; đợt refactor này chưa tạo ứng dụng Android/iOS.

## Luồng dữ liệu

1. Người dùng chọn chủ đề, nhập câu hỏi và chọn trải bài.
2. `useReadingFlow` truyền nguồn Web Crypto vào `drawCards`, không lặp lá trong cùng phiên.
3. Reducer giữ bước, kết quả và trạng thái lật bài; hook giải nghĩa giữ response/loading/lỗi, component giữ lượt xem/kết luận.
4. Sau xáo bài, hiện bài úp. Người dùng lật từng lá hoặc Lật tất cả như trước; mở hết mới hiện nút Bắt đầu giải nghĩa bên dưới. Nhấn nút mới gửi câu hỏi/ID/vị trí/chiều đến `/api/interpret`; kết quả mở trong hộp thoại (portal vào `document.body`) và một bản ẩn `.export-reading` trong `#reading-result` dùng cho PNG.
5. Function đọc nghĩa từ `docs/11-rule-tarot`, không gửi ảnh, gọi Gemini bằng key server và xác thực kết quả. Lỗi được hiển thị rõ, không giả làm thành công.
6. Client giữ một response chung; mở lần lượt các lá, nội dung riêng từng lá, rồi nút Kết luận mở phần tổng hợp. Trải một lá dùng một bước.
7. Sau kết luận, html2canvas tạo PNG toàn bộ phần kết quả tại thiết bị, bao gồm các phần nghĩa tạm ẩn trên màn hình; không chụp lặp lại hàng ảnh ban đầu.
8. Tải lại trang hoặc trải bài mới sẽ bỏ kết quả trước đó; không có lịch sử server/localStorage. Google xử lý dữ liệu theo chính sách provider; thông báo ở footer.


### Quy tắc tổ chức

* **Feature** sở hữu UI, hook và logic điều phối riêng của chức năng.
* **Domain** chứa nghiệp vụ độc lập React, DOM và Vite.
* **Contracts** chứa Zod schema và kiểu request/response dùng chung.
* **Services** xử lý HTTP, timeout, hủy request, parse response và lỗi API.
* **Platform** chứa phụ thuộc môi trường.
* **Shared UI** chỉ chứa component thực sự được dùng ở nhiều feature.

## Thư mục được sinh tự động

- `node_modules/`: dependencies do `npm install` quản lý; cần để chạy local.
- `dist/`: bản build do `npm run build` tạo, dùng khi deploy hoặc preview.

Không chỉnh tay các thư mục này. Backend Supabase, migration, metadata skin được sinh trước đây và thư mục `src/lib/` rỗng đã được loại bỏ vì không còn dùng.

## Tài liệu tham khảo

Xem [mục lục tại README](README.md#tài-liệu-sản-phẩm). Toàn bộ tài liệu nằm trong `docs/`; các tài liệu 01–11 mô tả project hiện tại, PNG trong `docs/assets/` là sơ đồ cũ, không thuộc runtime.
