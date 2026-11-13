# 10 — Quyết định hiện tại và câu hỏi còn mở

## Quyết định đã chốt

| Quyết định | Trạng thái / lý do |
|---|---|
| Lunara, tiếng Việt, mobile-first | Trải nghiệm ít chữ, dark purple/navy, gold, typography dễ đọc |
| React + TypeScript + Vite | Source hiện tại; CSS thuần và React state |
| Không database/tài khoản/lịch sử | Mỗi phiên chỉ nằm trong bộ nhớ; người dùng lưu PNG |
| Rút bài tại browser | Web Crypto, không trùng, 35% ngược; không server draw |
| Một lá và ba lá | Ba lá: Quá khứ, Hiện tại, Tương lai; không tương lai cố định |
| Gemini qua Vercel Function cùng project | Không VPS hoặc backend riêng; key chỉ ở server |
| Rule là nguồn tri thức luận giải | ID/vị trí/chiều cố định, không suy diễn ảnh thay thế |
| Một request cho toàn trải bài | Lật và kết luận là mở nội dung đã nhận, không gọi thêm |
| Hộp thoại giải nghĩa phủ trang | Hiện đủ lá ngay, không flip; xem đủ mọi lá mới có Kết luận; PNG chụp bản ẩn trong trang |
| Giữ lượt lật ảnh ban đầu | Sau xáo/rút, mở bài như trước; Bắt đầu giải nghĩa chỉ xuất hiện bên dưới khi mở hết |
| Giữ trải một lá | Một bước rồi Kết luận |
| Bỏ nhãn kỹ thuật trong UI | Nút Bắt đầu giải nghĩa; thông báo tự động/quyền riêng tư ở footer |
| Chỉ tải ảnh sau kết luận | PNG phải có đủ nghĩa từng lá, không chỉ article đang chọn |

Thiết kế Ktor/Supabase/server draw/history trong bộ tài liệu cũ đã bị thay thế. Không dùng chúng làm yêu cầu triển khai hiện tại.

## Còn phải xác nhận

1. Domain và cấu hình project Vercel production.
2. Key Gemini mới đã được tự cấu hình chưa, model tài khoản cho phép, free quota và ngân sách dự phòng.
3. Quyền sử dụng artwork trước khi phát hành công khai/thương mại.
4. Duyệt nghĩa bổ sung 78 lá và kiểm thử chất lượng/safety bằng provider thật.
5. Gói Vercel và cơ chế rate limit toàn hệ thống khi có tải thực.
6. Chính sách quyền riêng tư/pháp lý khi phục vụ người dùng thật.
7. Có chọn KMP/Compose cho Android/iOS hay không; chưa tạo project mobile.

## Không nằm trong scope hiện tại

Auth, thanh toán, subscription, database migration, chat, lưu lịch sử, phân tích usage riêng và push notification. Chỉ triển khai nếu có yêu cầu mới; không tự đưa trở lại MVP.
