# 07 — Giao diện và luồng đọc bài

## Stack và phong cách

React state và CSS thuần; không Tailwind, Framer Motion, Zustand, TanStack Query hoặc router. Các component đang nằm trong [App.tsx](../src/App.tsx).

- Nền xanh đen/tím đậm, accent gold, card glow nhẹ.
- Inter cho text cơ bản; Cormorant Garamond cho tiêu đề và tên bài.
- Shuffle, deal, flip bằng CSS; hỗ trợ `prefers-reduced-motion`.
- Ảnh tĩnh theo ID, chỉ để trang trí, không tác động nghĩa Tarot.
- Responsive mobile-first; ba lá luôn nằm ngang, thu theo chiều rộng.

## Luồng chính

### 1. Chủ đề

Chọn Tình yêu, Sự nghiệp, Tài chính hoặc Tổng quan.

### 2. Câu hỏi

Nhập tối đa 240 ký tự hoặc bỏ trống; có chip gợi ý theo chủ đề. Chưa gửi dữ liệu đến server.

### 3. Trải bài

Chọn Một lá hoặc Ba lá, nhấn **Xáo & rút bài**. Xáo tối thiểu khoảng 1,4 giây; rút bằng Web Crypto tại client. Reduced motion bỏ thời gian chờ này.

### 4. Giải nghĩa

1. Sau xáo bài: hiện các lá úp như trước. Chạm để lật từng lá hoặc chọn **Lật tất cả**; các lá đã mở tiếp tục hiện ảnh, chiều và mở được popup chi tiết. Chưa gọi API, chưa có diễn giải.
2. Khi mở hết bài mới có **Bắt đầu giải nghĩa** ở bên dưới. Nhấn nút gọi `/api/interpret`; nút chuyển **Đang giải nghĩa…**, chặn gửi trùng. Không checkbox hoặc nhãn kỹ thuật.
3. Khi có kết quả hợp lệ, một **hộp thoại phủ lên trang** (`role="dialog"`, `aria-modal`) mở ra. Hộp thoại hiện ngay tất cả 1/3 lá ở mặt ngửa trên một hàng ngang, kèm vị trí và chiều; **không có hiệu ứng lật**.
4. Chạm một lá bất kỳ để xem tên, chiều, headline và nội dung riêng. Lá đã xem có dấu ✓; lá đang chọn được viền vàng. Bộ đếm hiện `Đã xem x/n lá`. Chọn lại lá đã xem không gọi API.
5. Chỉ khi đã xem **đủ nội dung của mọi lá** mới hiện nút **Kết luận**. Nhấn nút để hiện overview, synthesis, advice, reflectionQuestion và safetyNote nếu có.
6. Sau kết luận hiện **Tải ảnh kết quả** trong hộp thoại và dưới trang. Trải một lá cũng phải chạm xem lá đó trước khi Kết luận.
7. Đóng bằng nút ×, Escape hoặc chạm nền; kết quả được giữ, nút **Xem giải nghĩa** mở lại hộp thoại. Không đóng được khi đang xuất ảnh. Focus được giữ trong hộp thoại, body không cuộn nền.
8. Lỗi/đang chờ/thử lại hiện dưới hàng bài ban đầu, không mở hộp thoại. Phản hồi `support` mở hộp thoại với nội dung hỗ trợ ngay, cho tải ảnh.

**Lật tất cả** chỉ dành cho hàng ảnh ban đầu. Không có phần nghĩa tham khảo xen giữa. Từ khóa trong danh mục vẫn dùng độc lập.

## PNG

Chụp toàn bộ `#reading-result`, không bao gồm hộp thoại, hero/danh mục/footer. Bản xuất:

- Có thương hiệu, chủ đề, câu hỏi, ảnh/chiều lá, **tất cả** phần nghĩa riêng và kết luận.
- Nội dung lấy từ khối `.export-reading` ẩn trong trang (chỉ hiện trong bản clone `.export-capture`), nên không phụ thuộc lá đang chọn trong hộp thoại.
- Không chụp hàng ảnh ban đầu để tránh lặp lại bộ bài.
- Tắt animation trong clone, không đảo ngược chữ tên bài.
- Không có nút thao tác; có disclaimer.
- Báo lỗi khi ảnh hoặc PNG không tạo được; cho thử lại.
- Khóa thao tác thay đổi nội dung trong lúc xuất.

## Lời mời ủng hộ

Sau mỗi lần tạo PNG thành công và kích hoạt tải xuống (từ trang hoặc hộp thoại giải nghĩa), mở hộp thoại cảm ơn với mã QR và lời mời ủng hộ tự nguyện. Không hiển thị nếu xuất ảnh lỗi, không yêu cầu chuyển khoản để tải ảnh, không xác nhận giao dịch.

Ảnh QR nguồn nằm tại `public/splash/qr_donate.jpg`; Vite sao chép vào `dist` khi build. Không đặt ảnh nguồn chỉ trong `dist` vì thư mục này được tạo lại.

Hộp thoại tông tím/gold, minh họa tarot bằng CSS, QR nền trắng không cắt ảnh. Có nút đóng, nút tiếp tục, Escape và chạm nền; giữ focus, khóa tương tác nền, trả về kết quả đã có khi đóng. Không đưa lời mời hoặc QR vào PNG.

## Trạng thái ngoại lệ

- Chưa có key/quota/mạng/response sai: thông báo trung tính, **Thử lại giải nghĩa**; không hiện kết quả giả.
- Đang tải mà trải bài mới: abort request client, bỏ qua response cũ.
- `status=support`: hiện nội dung hỗ trợ an toàn ngay, không hướng người dùng tiếp tục bói; cho tải nội dung này.
- Refresh/new reading: bỏ toàn bộ phiên, không có lịch sử.

## Nội dung và quyền riêng tư

Không nhắc “AI” trong text, nhãn nút, trạng thái hoặc lỗi UI. Các nút dùng **Bắt đầu giải nghĩa**, **Thử lại giải nghĩa**, **Kết luận**.

Footer có mục **Quyền riêng tư** giải thích nội dung được tạo tự động bằng Google Gemini, thời điểm gửi dữ liệu, chính sách free tier và giới hạn lưu trữ. Không gửi câu hỏi trước khi người dùng bắt đầu.

## Khả năng tiếp cận

Button dùng được bằng bàn phím, có focus-visible; sau khi nhận kết quả, focus lá đầu. Lá chưa đến lượt bị disabled; nhãn luôn có thứ tự/vị trí. Mặt trước chưa mở được ẩn khỏi accessibility tree; ảnh trang trí có `alt=""`. Trạng thái loading dùng `role=status`, lỗi dùng `role=alert`, kết luận dùng `aria-live`.
