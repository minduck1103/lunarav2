# 08 — Bảo mật và vận hành

## Secrets

- Key Gemini chỉ đọc ở Vercel Function từ `GEMINI_API_KEY`.
- Khi chạy local, middleware có thể đọc `gemini.local.json` trong thư mục gốc; biến môi trường được ưu tiên. File nằm trong `.gitignore`, bị chặn tải bởi Vite và không được đóng gói vào frontend. Sau khi sửa file cần khởi động lại server.
- Không dùng `VITE_*` cho key; không đặt key trong source, chat, screenshot hoặc log.
- Key từng bị chia sẻ phải thu hồi, tạo mới và tự cấu hình trong Vercel → Settings → Environment Variables.
- `GEMINI_MODEL` tùy chọn, mặc định `gemini-3.6-flash`; phải chọn model có quyền truy cập và phù hợp hạn mức tài khoản.
- Thay biến môi trường cần redeploy. Không có key thật được cấu hình bởi test.

## Lớp bảo vệ đang có

- HTTPS do Vercel cung cấp khi deploy; API cùng origin.
- POST-only, JSON-only, body tối đa 4 KB, question 240 ký tự.
- Zod kiểm tra dữ liệu, ID, số lượng, vị trí và chiều; không nhận nghĩa/ảnh từ client.
- Kiểm tra Origin nếu có; không bật CORS cho origin ngoài.
- Câu hỏi được đưa vào user data; rule ở system instruction.
- JSON output được kiểm tra lại cả server và client, gồm fidelity và một số cụm từ bị cấm.
- 45 giây/server, 52 giây/client, 60 giây/Function; output 4.096 token mỗi lần tạo.
- Không tự retry HTTP quota/auth/network; tối đa một lần tạo lại output không hợp lệ. Riêng HTTP 503 được backoff 1 giây, 2 giây cộng jitter dưới 250 ms; ngân sách chung tối đa 3 lần gọi provider, không tăng deadline 45 giây hoặc tự chuyển model. Retry có thể tăng usage; theo dõi quota/chi phí provider.
- Hết retry 503 trả `PROVIDER_BUSY`/HTTP 503 và `Retry-After: 30`; không giả lập thành công hoặc trả lỗi 502 chung.
- `Cache-Control: no-store`; không ghi log key, câu hỏi, nội dung, prompt hoặc provider error body. Log có mã lỗi, status và số thứ tự lần gọi.

## Hạn chế cần hiểu rõ

- Rate limit trong bộ nhớ: 3 request/phút/IP, 20/phút/instance; bộ đếm mất khi instance mới hoặc scale-out.
- IP/Origin không là xác thực người dùng; client ngoài browser có thể bỏ Origin. Không có auth, global quota, idempotency phân tán hoặc chống replay.
- Cần cấu hình Vercel Firewall/rate limiting cho `/api/interpret` trước khi mở public; tính năng phụ thuộc gói Vercel.
- Prompt và kiểm tra chuỗi không bảo đảm tuyệt đối về nội dung. Cần đánh giá các câu hỏi nhạy cảm, lá ngược, mâu thuẫn và prompt injection.
- Chưa có usage/cost dashboard riêng; theo dõi trong Google AI Studio và Vercel.

## Quyền riêng tư

Reading chỉ ở React state, không database/localStorage, không lịch sử tài khoản. Chọn **Bắt đầu giải nghĩa** mới gửi câu hỏi và các lá đến server và Google Gemini; không gửi ảnh.

Mục **Quyền riêng tư** ở footer giải thích xử lý tự động và việc free tier có thể dùng dữ liệu để cải thiện sản phẩm. Không khuyến khích nhập dữ liệu nhạy cảm. Không coi việc app không lưu database là đồng nghĩa nhà cung cấp không xử lý/lưu dữ liệu; cần xem [điều khoản Google](https://aistudio.google.com/docs/terms) trước khi phát hành.

## Deploy và giám sát

1. Theo [README](../README.md#deploy-vercel-và-cấu-hình-gemini): preset Vite, `dist`, Node 22.x/24.x, key server mới, redeploy.
2. Chạy `npm test` và `npm run build`.
3. Kiểm tra request thật từ domain production, model/quota, đóng gói rule, lỗi 429/503 và luồng tải PNG.
4. Theo dõi status/latency/chi phí qua dashboard Vercel/Google; log ứng dụng hiện chỉ có mã lỗi và status, không có trace ID/health route riêng.
5. Khi nghi lộ key: thu hồi, thay key, redeploy, kiểm tra usage. Khi hết quota: giao diện báo lỗi, không tự chuyển sang model trả phí.

Không có database để backup, không migration hoặc Docker để triển khai. Bảo toàn source/rule/ảnh; kết quả người dùng chỉ có thể giữ qua PNG tải về. Quyền dùng artwork là điều kiện riêng cần chốt trước public.
