# 01 — Sản phẩm Lunara

## Mục tiêu

Ứng dụng Tarot tiếng Việt, mobile-first, cho một lần chiêm nghiệm: chọn chủ đề, nhập câu hỏi, rút bài, đọc từng thông điệp rồi lưu kết quả bằng ảnh. Tarot không dự đoán chắc chắn tương lai và không thay thế tư vấn chuyên môn.

## Phạm vi đang triển khai

- React + TypeScript + Vite; deploy frontend và Vercel Function trong cùng project.
- 78 lá theo hệ Rider–Waite–Smith; ảnh thay thế chỉ có tác dụng trang trí.
- Bốn chủ đề: Tình yêu, Sự nghiệp, Tài chính, Tổng quan.
- Câu hỏi không bắt buộc, tối đa 240 ký tự.
- Trải một lá hoặc ba lá, rút bằng Web Crypto trong trình duyệt, không trùng lá.
- Giữ lượt lật bài ban đầu sau xáo/rút (từng lá hoặc Lật tất cả); sau khi mở hết mới hiện **Bắt đầu giải nghĩa** ở dưới. Nhấn nút này gọi Gemini qua `/api/interpret`.
- Hộp thoại giải nghĩa phủ lên trang: hiện ngay đủ các lá nằm ngang (không hiệu ứng lật); chạm từng lá để xem nội dung riêng, xem đủ mới có Kết luận.
- Nút **Kết luận** xuất hiện sau khi đã mở hết bài; chỉ khi nhấn mới hiện thông điệp tổng quan, tổng hợp, lời khuyên và câu hỏi chiêm nghiệm.
- Trải một lá dùng cùng luồng với một bước.
- Sau kết luận có thể tải PNG đầy đủ nội dung, không chỉ phần đang nhìn thấy.
- Danh mục lá bài có tìm kiếm, lọc chất và popup từ khóa.

## Dữ liệu và giới hạn

Không có tài khoản, database, lịch sử, localStorage hoặc đồng bộ. Kết quả giữ trong React state; tải lại trang hoặc trải bài mới sẽ xóa phiên hiện tại.

Không gửi câu hỏi đến server trong lúc chọn chủ đề hoặc rút bài. Chỉ khi chọn **Bắt đầu giải nghĩa** mới gửi câu hỏi, ID, vị trí và chiều các lá tới Google Gemini. Thông báo xử lý tự động và quyền riêng tư ở footer; không có checkbox hay nhãn kỹ thuật trong luồng đọc bài.

Nếu dịch vụ lỗi hoặc chưa cấu hình key, giao diện thông báo rõ và cho thử lại; không dựng kết quả thay thế. Có thể xem từ khóa của lá trong danh mục. Cấu hình thật và kiểm thử provider trên Vercel vẫn do chủ dự án hoàn tất.

## Chưa triển khai

- Trải 5/10 lá (chỉ có định nghĩa tham khảo trong rule).
- Chat hỏi tiếp, tài khoản, thanh toán, lịch sử, push notification, analytics.
- Android/iOS/Kotlin Multiplatform; đây là hướng phát triển sau, không phải stack hiện tại.

## Nguyên tắc

1. Người dùng giữ quyền tự quyết; không dùng lời hù dọa hoặc định mệnh tuyệt đối.
2. Luận giải theo ID và tri thức chuẩn, không theo hình trang trí.
3. API key chỉ có ở server; hạn chế dữ liệu nhạy cảm trong câu hỏi.
4. Nội dung tạo tự động được giải thích tại mục Quyền riêng tư, không gắn nhãn nhà cung cấp lên từng lá.
5. Phải kiểm tra quyền dùng ảnh, hạn mức và chất lượng luận giải trước khi phát hành.

Xem [UX](07-frontend-ux.md), [kiến trúc](02-architecture.md), [roadmap và kiểm thử](09-roadmap-and-testing.md).
