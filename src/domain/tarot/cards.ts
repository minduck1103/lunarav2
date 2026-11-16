import type { TarotCard } from "./types.js";

const majorCards: Array<[string, string, string, string, string, string]> = [
  ["the-fool", "Kẻ Khờ", "The Fool", "✦", "Khởi đầu, tự do, niềm tin", "Bốc đồng, do dự, thiếu chuẩn bị"],
  ["the-magician", "Nhà Ảo Thuật", "The Magician", "☿", "Chủ động, sáng tạo, tập trung", "Trì hoãn, phân tán, tiềm năng chưa dùng"],
  ["the-high-priestess", "Nữ Tư Tế", "The High Priestess", "☾", "Trực giác, tĩnh lặng, bí ẩn", "Nhiễu loạn, bỏ quên tiếng nói nội tâm"],
  ["the-empress", "Hoàng Hậu", "The Empress", "♀", "Nuôi dưỡng, phong phú, sáng tạo", "Quá bảo bọc, cạn năng lượng"],
  ["the-emperor", "Hoàng Đế", "The Emperor", "♔", "Cấu trúc, vững vàng, trách nhiệm", "Cứng nhắc, kiểm soát quá mức"],
  ["the-hierophant", "Giáo Hoàng", "The Hierophant", "♧", "Học hỏi, giá trị, người dẫn đường", "Lối mòn, hoài nghi khuôn mẫu"],
  ["the-lovers", "Những Người Yêu", "The Lovers", "♡", "Kết nối, lựa chọn, đồng điệu", "Lệch nhịp, lưỡng lự, thiếu thống nhất"],
  ["the-chariot", "Cỗ Xe", "The Chariot", "☼", "Ý chí, tiến lên, định hướng", "Mất phương hướng, gắng sức quá mức"],
  ["strength", "Sức Mạnh", "Strength", "∞", "Can đảm, kiên nhẫn, dịu dàng", "Tự nghi ngờ, cạn sức, nóng vội"],
  ["the-hermit", "Ẩn Sĩ", "The Hermit", "✧", "Chiêm nghiệm, tìm kiếm, sáng tỏ", "Cô lập, né tránh, cần kết nối"],
  ["wheel-of-fortune", "Bánh Xe Số Phận", "Wheel of Fortune", "◉", "Chu kỳ, thay đổi, cơ hội", "Kháng cự thay đổi, vòng lặp cũ"],
  ["justice", "Công Lý", "Justice", "⚖", "Cân bằng, trung thực, hệ quả", "Thiếu công bằng, né tránh trách nhiệm"],
  ["the-hanged-man", "Người Treo Ngược", "The Hanged Man", "⌁", "Góc nhìn mới, buông lỏng, chờ đợi", "Trì trệ, níu giữ, hy sinh vô ích"],
  ["death", "Chuyển Hóa", "Death", "☼", "Khép lại, đổi thay, tái sinh", "Bám víu, sợ kết thúc, chậm chuyển mình"],
  ["temperance", "Tiết Chế", "Temperance", "△", "Điều độ, hòa hợp, chữa lành", "Mất cân bằng, thiếu kiên nhẫn"],
  ["the-devil", "Ác Quỷ", "The Devil", "⛓", "Ràng buộc, ham muốn, nhận diện", "Giải phóng, lấy lại quyền lựa chọn"],
  ["the-tower", "Tòa Tháp", "The Tower", "ϟ", "Sự thật, thức tỉnh, phá vỡ", "Chống lại đổi thay, bất ổn âm ỉ"],
  ["the-star", "Ngôi Sao", "The Star", "☆", "Hy vọng, cảm hứng, hồi phục", "Mất niềm tin, cần chăm sóc bản thân"],
  ["the-moon", "Mặt Trăng", "The Moon", "☽", "Cảm xúc, trực giác, điều chưa rõ", "Sương mù tan dần, đối diện nỗi sợ"],
  ["the-sun", "Mặt Trời", "The Sun", "☀", "Niềm vui, sáng rõ, sức sống", "Niềm vui nhỏ, kỳ vọng quá cao"],
  ["judgement", "Phán Xét", "Judgement", "♬", "Thức tỉnh, nhìn lại, tiếng gọi", "Tự phán xét, ngần ngại bước tiếp"],
  ["the-world", "Thế Giới", "The World", "◎", "Hoàn thành, kết nối, trọn vẹn", "Việc còn dang dở, cần khép vòng"],
];

const majorNumbers = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

const ranks: Array<[string, string, string, string]> = [
  ["ace", "Át", "Khởi nguồn, tiềm năng, một cánh cửa", "Bỏ lỡ cơ hội, năng lượng chưa được khơi thông"],
  ["two", "Hai", "Cân nhắc, kết nối, một lựa chọn", "Do dự, lệch nhịp, cần nhìn lại ưu tiên"],
  ["three", "Ba", "Hợp tác, phát triển, niềm vui chung", "Thiếu đồng thuận, kế hoạch chưa thành hình"],
  ["four", "Bốn", "Ổn định, nghỉ ngơi, nền móng", "Bất an, trì trệ, cần đổi nhịp"],
  ["five", "Năm", "Thử thách, xung đột, điều cần học", "Hòa giải, hồi phục, vượt qua khó khăn"],
  ["six", "Sáu", "Tiến triển, sẻ chia, sự hài hòa", "Chậm lại, lưu luyến, mất cân bằng cho nhận"],
  ["seven", "Bảy", "Kiên trì, đánh giá, chọn hướng đi", "Nản lòng, thiếu chiến lược, cần điều chỉnh"],
  ["eight", "Tám", "Chuyển động, rèn luyện, tập trung", "Phân tán, mắc kẹt, cần tháo gỡ"],
  ["nine", "Chín", "Gần chạm đích, tự chủ, trưởng thành", "Quá tải, thiếu tin tưởng, nên tìm hỗ trợ"],
  ["ten", "Mười", "Hoàn tất, trách nhiệm, một chu kỳ", "Khép lại điều cũ, san sẻ gánh nặng"],
  ["page", "Tiểu Đồng", "Tò mò, học hỏi, tín hiệu mới", "Thiếu kinh nghiệm, cần thử từng bước"],
  ["knight", "Kỵ Sĩ", "Hành động, theo đuổi, nhiều động lực", "Vội vàng, thiếu bền bỉ, cần cân nhắc"],
  ["queen", "Hoàng Hậu", "Thấu cảm, tự tin, làm chủ năng lượng", "Thu mình, quá nhạy cảm, cần ranh giới"],
  ["king", "Nhà Vua", "Lãnh đạo, chín chắn, định hướng rõ", "Cứng nhắc, áp lực quyền lực, cần lắng nghe"],
];

const rankNamesEnglish: Record<string, string> = {
  ace: "Ace",
  two: "Two",
  three: "Three",
  four: "Four",
  five: "Five",
  six: "Six",
  seven: "Seven",
  eight: "Eight",
  nine: "Nine",
  ten: "Ten",
  page: "Page",
  knight: "Knight",
  queen: "Queen",
  king: "King",
};

const suits: Array<[string, string, string, string, string]> = [
  ["cups", "Cốc", "Cups", "♡", "cảm xúc, các mối quan hệ và sự gắn kết"],
  ["pentacles", "Tiền", "Pentacles", "◇", "công việc, nguồn lực và những điều hữu hình"],
  ["swords", "Kiếm", "Swords", "⌁", "suy nghĩ, giao tiếp và cách nhìn vấn đề"],
  ["wands", "Gậy", "Wands", "✧", "đam mê, sáng kiến và nguồn năng lượng hành động"],
];

export const tarotDeck: TarotCard[] = [
  ...majorCards.map(([id, name, english, symbol, uprightMeaning, reversedMeaning], index) => ({
    id,
    name,
    english,
    cardNumber: majorNumbers[index],
    arcana: "major" as const,
    suit: null,
    symbol,
    keywords: uprightMeaning.split(", "),
    uprightKeywords: uprightMeaning.split(", "),
    reversedKeywords: reversedMeaning.split(", "),
    uprightMeaning,
    reversedMeaning,
  })),
  ...suits.flatMap(([suitId, suitName, suitEnglish, symbol, theme]) =>
    ranks.map(([rankId, rankName, upright, reversed], index) => ({
      id: `${rankId}-of-${suitId}`,
      name: `${rankName} ${suitName}`,
      english: `${rankNamesEnglish[rankId]} of ${suitEnglish}`,
      cardNumber: String(index + 1),
      arcana: "minor" as const,
      suit: suitId,
      symbol,
      keywords: [upright.split(", ")[0], theme.split(", ")[0]],
      uprightKeywords: upright.split(", "),
      reversedKeywords: reversed.split(", "),
      uprightMeaning: `${upright} trong lĩnh vực ${theme}.`,
      reversedMeaning: `${reversed} liên quan đến ${theme}.`,
    })),
  ),
];

export function getCard(id: string): TarotCard {
  const card = tarotDeck.find((item) => item.id === id);
  if (!card) throw new Error(`Không tìm thấy lá bài: ${id}`);
  return card;
}

