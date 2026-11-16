# Sound effects

## Nguồn và giấy phép

Hiệu ứng Kenney được tải từ bên ngoài; nhạc nền và tiếng button được tổng hợp trong project. Tất cả lưu tại `public/sounds/`, không gọi website của tác giả khi người dùng đọc bài.

- [Kenney Casino Audio 1.1](https://kenney.nl/assets/casino-audio), Kenney Vleugels.
- [Kenney Interface Sounds 1.0](https://kenney.nl/assets/interface-sounds), Kenney.
- Cả hai bộ dùng [Creative Commons Zero (CC0)](https://creativecommons.org/publicdomain/zero/1.0/): cho phép dùng, sửa và phân phối trong project cá nhân/thương mại, không bắt buộc ghi công.
- License gốc: [Casino Audio](licenses/casino-audio.txt), [Interface Sounds](licenses/interface-sounds.txt).
- Nhạc ambient và tiếng button là âm thanh nguyên bản được tổng hợp trong project bằng [generate-ambient.mjs](../tools/generate-ambient.mjs), không lấy giai điệu hoặc bản thu từ bên thứ ba. Tạo lại bằng `node tools/generate-ambient.mjs`; không cần thư viện bổ sung.

## File đã chọn

| Action | File tại public/sounds | File gốc | Bộ |
|---|---|---|---|
| Các button thông thường, điều hướng, đóng dialog | button.wav | Tổng hợp tiếng chạm ngắn 85 ms | Nguyên bản |
| Pick thẻ trong Bộ bài hoặc mở preview | select.ogg / select.wav | card-slide-1.ogg, phát ở tốc độ 1.25x | Casino Audio |
| Nhạc nền Moonlit Ambient | moonlit-ambient.wav | Giai điệu chuông mềm, echo và pad nhẹ, loop 64 giây | Nguyên bản |
| Chọn chủ đề, trải bài, filter hoặc xem giải nghĩa lá | select.ogg / select.wav | card-slide-1.ogg | Casino Audio |
| Xáo bài | shuffle.ogg / shuffle.wav | card-shuffle.ogg | Casino Audio |
| Chia bài | deal.ogg / deal.wav | card-place-1.ogg | Casino Audio |
| Lật một lá | flip.ogg / flip.wav | card-slide-4.ogg | Casino Audio |
| Lật tất cả | reveal-all.ogg / reveal-all.wav | card-fan-1.ogg | Casino Audio |
| Mở kết luận | conclusion.ogg / conclusion.wav | confirmation_001.ogg | Interface Sounds |
| Tạo PNG thành công | success.ogg / success.wav | confirmation_003.ogg | Interface Sounds |

Các OGG của Kenney được giữ nguyên nội dung từ file gốc, chỉ đổi tên. WAV tương ứng là bản chuyển đổi PCM 16-bit, giữ sample rate và số kênh. WAV là fallback cho browser không giải mã được Ogg Vorbis. Howler chọn định dạng browser hỗ trợ, không tải cả hai bản. Hai file nguyên bản `moonlit-ambient.wav` và `button.wav` dùng PCM 16-bit mono, 24 kHz. Moonlit Ambient thay bản pad `ambient.wav` trước đây, có giai điệu chậm và tiếng chuông nổi rõ hơn, không có lời hoặc trống.

## Hành vi

- Howler nằm trong [adapter web](../src/platform/audio.web.ts); các feature chỉ dùng [SoundPlayer](../src/shared/audio.ts).
- Mỗi lần vào/reload trang đều mặc định bật, không đọc hoặc lưu lựa chọn âm thanh vào localStorage. Tắt chỉ áp dụng cho phiên hiện tại. Nút chỉ có icon và chữ “Âm thanh”; icon, `aria-pressed`, aria-label và tooltip thể hiện trạng thái.
- Preload và thử phát nhạc khi vào trang. Nếu browser chặn autoplay có tiếng, nhạc chờ thao tác đầu tiên để mở khóa; không thể vượt qua chính sách autoplay bằng code. Nhạc fade-in 1.2 giây, âm lượng 12%, loop liền mạch.
- Thông báo tải/lỗi nằm dạng overlay trong header, không chèn dòng vào bố cục giữa header và hero. Tắt/bật không làm dịch chuyển trang.
- Khi sound đang tải hoặc audio context chưa được mở khóa, không xếp hàng action để phát bất ngờ sau đó.
- Sound xáo chạy ở tốc độ **1.8x**, dừng khi rút xong; không thay thời lượng animation xáo. Sound chia đi theo nhịp 120 ms của các lá, hủy khi lật bài/reset.
- Reduced motion bỏ sound xáo và chỉ phát một tiếng chia bài; không kéo dài flow để chờ audio.
- Lật tất cả dùng một effect. Chạm lại lá đang xem hoặc kiểu trải đang chọn không phát lại.
- Mỗi sound chỉ có một lượt phát đồng thời; chặn phát lặp cùng effect trong 70 ms, không chặn kết luận ngay sau chọn lá.
- Nhạc nền giữ ID ngay khi yêu cầu phát, kể cả Howler đang chờ resume; không xếp hàng nhiều loop. Nút tắt dùng master mute của Howler trước khi stop/unload các sound của app, ngắt đầu ra ngay và loại bỏ lượt phát chờ. Bật lại tạo các Howl mới, không phát lại effect cũ.
- Trong development, hot reload giữ lựa chọn tắt của phiên; chỉ truy cập/reload cả trang mới mặc định bật lại.
- Rút lại/reset chỉ dừng các effect, không ngắt nhạc nền. Tắt sound, ẩn tab hoặc rời trang dừng toàn bộ playback/hủy lịch; quay lại tab tiếp tục nhạc nếu browser cho phép và chưa tắt. Unmount giải phóng các Howl.
- Lỗi tải/phát được log và thông báo rõ trên trang, tắt audio nhưng không ngăn đọc bài. Bật lại để thử tải lại.
- Button có action sound riêng dùng `data-sound-handled` để tránh chồng thêm tiếng button chung. Listener ở document hỗ trợ cả button trong dialog portal, chuột và bàn phím, bỏ qua control bị disabled/inert và nút bật/tắt loa.
- Không phát effect khi nhập câu hỏi, hover, glow/float lặp hoặc chờ Gemini.

## Thay asset hoặc chuyển lên storage

[assets.web.ts](../src/platform/assets.web.ts) tập trung URL, âm lượng, tốc độ và loop của từng sound. Có thể thay các URL local bằng URL HTTPS trên storage/CDN, giữ nguyên tên action và adapter.

Nên lưu file ảnh/audio trong object storage và dùng database để lưu metadata/URL, thay vì lưu toàn bộ binary trong các bảng dữ liệu. Chưa triển khai database hoặc CDN trong thay đổi này. Nếu dùng khác origin, storage cần CORS phù hợp để Howler tải và giải mã sound bằng Web Audio.
