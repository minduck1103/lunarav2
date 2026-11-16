import type { Topic } from "../../domain/tarot/types";

export const steps = ["Chủ đề", "Câu hỏi", "Trải bài", "Lật bài"];

export const topics: Array<{ id: Topic; label: string; english: string; symbol: string; description: string; suggestions: string[] }> = [
  { id: "love", label: "Tình yêu", english: "Love", symbol: "♡", description: "Các mối quan hệ & kết nối", suggestions: ["Người ấy nghĩ gì về mình?", "Mối quan hệ này sẽ đi về đâu?", "Mình cần yêu thương bản thân thế nào?"] },
  { id: "career", label: "Sự nghiệp", english: "Career", symbol: "✧", description: "Công việc & hướng đi", suggestions: ["Có nên đổi công việc không?", "Điều gì giúp mình thăng tiến?", "Dự án sắp tới sẽ ra sao?"] },
  { id: "finance", label: "Tài chính", english: "Finance", symbol: "◇", description: "Nguồn lực & sự đủ đầy", suggestions: ["Tài chính tháng này thế nào?", "Mình nên chú ý gì khi chi tiêu?", "Có nên đầu tư lúc này?"] },
  { id: "general", label: "Tổng quan", english: "General", symbol: "☼", description: "Điều bạn cần lắng nghe", suggestions: ["Thông điệp cho mình hôm nay?", "Mình cần buông bỏ điều gì?", "Năng lượng tuần này của mình?"] },
];
