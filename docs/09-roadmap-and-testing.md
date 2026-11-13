# 09 — Trạng thái, kiểm thử và việc tiếp theo

## Đã có trong source

- React/Vite tiếng Việt, responsive, 78 lá, bốn chủ đề, một/ba lá.
- Rút bài Web Crypto, shuffle/flip, thư viện lọc/tìm và popup từ khóa.
- Vercel Function cùng project, Gemini, rule đầy đủ 78 ID, JSON Schema.
- Luồng **Xáo & rút → lật ảnh ban đầu → Bắt đầu giải nghĩa → hộp thoại hiện đủ các lá, chạm xem từng lá → Kết luận → tải PNG**.
- Xem lại từng lá, xử lý lỗi/thử lại, hủy và bỏ response cũ khi trải bài mới.
- Không database, auth, localStorage hoặc lịch sử.
- Test endpoint và UI; type-check frontend/server và production build.

Có mã tích hợp không đồng nghĩa đã xác minh live Gemini hoặc đã deploy production. Việc này cần key mới do chủ dự án cấu hình.

## Test tự động

```powershell
npm test
npm run build
```

`npm test` chạy hai nhóm:

1. [interpret.test.ts](../tests/interpret.test.ts), Node test + tsx: 78 ID, context chỉ chứa lá đã rút, request/response fidelity, hỗ trợ an toàn, method/Origin/body, thiếu key, cấu hình local và chặn tải file key, retry output/503 cùng ngân sách 3 lần, phục hồi và quá tải kéo dài, quota/auth không retry, hủy/backoff/timeout và giới hạn instance.
2. [reading-flow.test.tsx](../tests/reading-flow.test.tsx), Vitest + jsdom: gọi khi bắt đầu, hộp thoại hiện đủ lá không flip, nội dung từng lá, kết luận chỉ sau khi xem đủ, đóng/mở lại, khối PNG, một lá, lỗi/retry, hủy request và response cũ.

Provider trong test là giả lập, không dùng key thật hoặc tính phí. Build kiểm tra TypeScript cả frontend, server, test/config rồi chạy Vite.

## Checklist trình duyệt

- [ ] Ba lá: giữ lượt lật ảnh ban đầu, Bắt đầu giải nghĩa chỉ hiện sau khi mở hết; trước khi bấm không có request hoặc nghĩa tự động.
- [ ] Đang tải: nút khóa, có status; thao tác lặp không gửi trùng.
- [ ] Hộp thoại phủ trang hiện ngay mọi lá mặt ngửa, không flip; chạm lá nào cũng hiện đúng nội dung, có dấu đã xem.
- [ ] Kết luận chỉ hiện khi đã xem đủ mọi lá (thứ tự bất kỳ) và sau khi nhấn nút; không gọi API lần nữa.
- [ ] Đóng bằng ×/Escape/nền, mở lại bằng Xem giải nghĩa; mobile 320px không tràn ngang.
- [ ] Một lá cũng phải chạm xem rồi Kết luận.
- [ ] Lỗi: không dựng nghĩa giả; retry dùng lại đúng bộ bài.
- [ ] Trải bài mới/refresh xóa kết quả; request cũ không cập nhật phiên mới.
- [ ] `support`: hiện hỗ trợ ngay, không đi qua bói/kết luận.
- [ ] Mobile 320/390 px: ba lá ngang, không tràn trang; bàn phím và reduced motion hoạt động.
- [ ] PNG chứa đủ mọi lá/ý nghĩa/kết luận dù màn hình đang xem một lá; không có nút.
- [ ] UI không có nhãn kỹ thuật bị yêu cầu bỏ; footer có Quyền riêng tư.

Checklist là hướng dẫn kiểm tra lại mỗi lần phát hành, không phải báo cáo mọi mục đã kiểm thử production.

## Việc cần làm trước public

1. Thu hồi key lộ, cấu hình key mới/model và kiểm tra live Gemini trên Vercel.
2. Kiểm tra quyền sử dụng hoặc thay artwork được cấp phép phù hợp.
3. Thiết lập Vercel Firewall, quota/cost limits; thử nhiều người dùng đồng thời.
4. Duyệt nội dung mới trong rule và đánh giá tiếng Việt, từng chủ đề, lá ngược, mâu thuẫn, câu hỏi nguy cơ cao.
5. Xác minh chính sách quyền riêng tư, thời gian phản hồi và PNG trên Safari/iOS, Chrome/Android.

## Mở rộng sau, chưa triển khai

- Android/iOS với KMP/Compose Multiplatform; cần xây lại UI/logic Kotlin và hợp đồng API dùng chung.
- Tách kho tri thức thành JSON độc lập để chia sẻ dễ hơn, nếu chọn hướng mobile.
- Spread 5/10 lá, hỏi tiếp, tối ưu ảnh hoặc giới hạn phân tán khi có nhu cầu thực tế.
- Chỉ thêm tài khoản/database nếu chủ dự án muốn lịch sử/đồng bộ; không phải điều kiện chạy MVP.
