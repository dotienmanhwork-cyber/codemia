import { C, AI_GRAD } from "@/shared/utils/constants";

export const IMGS = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrazjY4HaLTAWz5QcNl-Kxyl5-JDZbV6Ls6H9R-gKglpAni6Fjv9VrWtTJgwyrmYUufJSkzxEb96MWkV7xqyrczW7-B_AczQR6tDrcc1S77cA_Gk9tvQZ4NN9Crk-TrvKuL-87sAasuoOEuNynIhML5a7KEHx8CMn_7ZvFX5Wmhb59Vh9bFpSP3ZFC3VgzMR667FLsshnko1m6JANIrr_2xArAL_Q8EqiNATWVOVsGEvixpyAl1ih-6CSOOLfGmKS9ah1ig_am3oE",
  web:  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUVRpAL_BxZXyCjIqDW7CdoAi3zatSEaPl6e7cR2Ws7fbZmP79HLJixc-BgWT2Vpew19NdTVxm5uphIW3OwXJuOrIbUXhqwqZy_RVYNQtgP0B3R7db-ADyzqAotTIYX8uFT4b2m99VehbNDYf2wm5gRrpGtdxBhPu4riLbax2Fz6JxGbu2TNBzvZ-a81Wri-gBZagNUZeEQHcLzKcjFs_YrI2OI0AQ3puvovphDjfoHuokTJ7HoZIFRIauf1ALN0kf26ekWQfCJ6E",
  data: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDvq92dqMcr52dUvX0kATVRpqYhBcYyhMMlEfvlQWdFkWG92-NhjE-Y2MLHUeEAWpYRvo-kFcjTTVFBRmNZAFXZS6JBjKcM9TWRPubXaWXgHZGwr2pVG3i9S1b-jr6j9F-4ZOMyVP8dj0pVZzMBkstC1pzALi-6ANCubfHAJKItHCTdknOS5-zE32Oos00hILyIrEvPB24my_2JRANSLrK8UW_s6BAU-M9EsVfjpEpA_pAreWpvX93iHYPCpunLuJoUMQc2aQWXyA",
  ai:   "https://lh3.googleusercontent.com/aida-public/AB6AXuC9ijvzkcRAeSlmdg54A6kDOx0oeRuI7-bkoMQVGToeYW9409yNYRtnKZytmvUaFUF2rc6SIgyaOeRPYVSiASkYUlCl_EcRY0m2cfnN66_4S6SccGyMiPHoUDQIajFk4Auk-jILfum163fNqyCOMLNYUX2oIrBhiO_o5GZJsBf6k7nKamg0IwxlEAxaHTyB24fqV1NMgOctWN00TPYmeS2EL_lAgRNeFfkcZfgbmNaj2LvrNlY42mHEDISqWr__PFcHbtGkSNqrXkA",
  biz:  "https://lh3.googleusercontent.com/aida-public/AB6AXuB92gg1g-Q5nddwvXz0gLRqu3ys4R3pVEKntQB_tc2pHU-v4TrqrhnFCUaPl2pF9AWLwKMQ-pA45JmWRKNscYE4TsFjyYaVxq-Zn1o1XmfsTrjpB8jH7CW26VoHflhXXpHyzSjWEeiTILP66JWX0bl7ajI8Mzb-0CUKctQ4fKmGlqYJDe1ZQezIawPy6zr5jXTpUq8_ew8lsVwvcaa43f3ssQBr0WVyf978CQy0znpjfZOiNA8X6Bqbc4eNUXi8pu1HwQuopx-mmQw",
};

export const FEATURED_COURSES = [
  { id:1, cat:"Web Dev",      title:"Spring Boot thực chiến",                   instructor:"Dr. Sarah Jenkins",  rating:4.8, reviews:"1,245", price:"1,200,000đ", ai:true,  img:IMGS.web  },
  { id:2, cat:"Data Science", title:"Python Data Science Bootcamp",              instructor:"Prof. Michael Chen", rating:4.9, reviews:"3,890", price:"1,500,000đ", ai:false, img:IMGS.data },
  { id:3, cat:"AI & ML",      title:"Applied Machine Learning with TensorFlow",  instructor:"Dr. Alan Turing",    rating:4.7, reviews:"856",   price:"2,100,000đ", ai:true,  img:IMGS.ai   },
  { id:4, cat:"Business",     title:"Digital Marketing Strategy 2024",           instructor:"Emma Watson, MBA",   rating:4.6, reviews:"2,110", price:"850,000đ",   ai:false, img:IMGS.biz  },
];

export const FREE_COURSES = [
  { id:5,  cat:"Lập trình",   title:"Nhập môn Lập trình với C",                  instructor:"Trần Nam",           rating:4.7, reviews:"5,210", price:null, ai:false, img:IMGS.web  },
  { id:6,  cat:"Data",        title:"Cấu trúc dữ liệu & Giải thuật cơ bản",      instructor:"Trần Thị Hương",     rating:4.8, reviews:"3,940", price:null, ai:false, img:IMGS.data },
  { id:7,  cat:"AI & ML",     title:"Kiến thức nền tảng về AI",                  instructor:"Codemia AI Tours",   rating:4.9, reviews:"7,102", price:null, ai:true,  img:IMGS.ai   },
  { id:8,  cat:"Kỹ năng",     title:"Kỹ năng quản lý thời gian hiệu quả",        instructor:"Nguyễn Minh Anh",    rating:4.5, reviews:"2,880", price:null, ai:false, img:IMGS.biz  },
];

export const PRO_COURSES = [
  { id:9,  cat:"Backend",     title:"Chuyên gia Hệ thống Phân tán",              instructor:"Robert Martin",      rating:4.9, reviews:"1,340", price:"2,500,000đ", ai:true,  img:IMGS.web,  isPro:true },
  { id:10, cat:"AI",          title:"Lãnh đạo trong kỷ nguyên AI",               instructor:"Sheryl Sandberg",    rating:4.8, reviews:"980",   price:"2,500,000đ", ai:true,  img:IMGS.ai,   isPro:true },
  { id:11, cat:"Deep Learning",title:"Deep Learning & Neural Networks",           instructor:"Andrew Ng",          rating:5.0, reviews:"4,220", price:"3,000,000đ", ai:true,  img:IMGS.data, isPro:true },
  { id:12, cat:"Finance",     title:"Phân tích tài chính cao cấp",               instructor:"Warren Buffett Jr.", rating:4.7, reviews:"756",   price:"2,500,000đ", ai:false, img:IMGS.biz,  isPro:true },
];

export const FEATURES = [
  { iconName: "Route",      iconBg:"#f3daff",   title:"Lộ trình cá nhân hóa",  desc:"AI phân tích phong cách học và mục tiêu của bạn để tạo con đường học tập độc nhất, tối ưu hóa thời gian và hiệu quả.", highlight:false },
  { iconName: "Bot",        iconBg:AI_GRAD,    title:"Gia sư AI 24/7",        desc:"Mắc kẹt ở bài toán khó? Gia sư AI luôn sẵn sàng giải đáp thắc mắc, tóm tắt bài giảng và hỗ trợ bạn mọi lúc mọi nơi.", highlight:true  },
  { iconName: "BadgeCheck", iconBg:C.surfaceHigh, title:"Chứng chỉ uy tín", desc:"Nhận chứng chỉ được công nhận bởi các đối tác doanh nghiệp hàng đầu sau khi hoàn thành khóa học.", highlight:false },
];

export const CATS = ["Tất cả","Web Development","Data Science","AI & Machine Learning","Business"];

export const TESTIMONIALS = [
  { text:"Khóa học đã làm rất tốt việc giải thích AI - từ phát triển đến ứng dụng. Tôi đánh giá cao các quan điểm khác nhau được trình bày.", name:"Cris M.",          role:"Tốt nghiệp Google AI Essentials",                  link:"Xem các khóa học AI",          avatar:"https://i.pravatar.cc/40?img=1" },
  { text:"Udemy thực sự là người thay đổi cuộc chơi và là một hướng dẫn tuyệt vời cho tôi khi đưa Dimensional vào cuộc sống.",              name:"Alvin Lim",          role:"Đồng sáng lập kỹ thuật, CTO tại Dimensional",      link:"Xem khóa học iOS & Swift này", avatar:"https://i.pravatar.cc/40?img=3" },
  { text:"Codemia cung cấp cho bạn khả năng kiên trì. Tôi đã học được chính xác những gì tôi cần biết trong thế giới thực.",                  name:"William A. Wachlin", role:"Người quản lý tài khoản tại Amazon Web Services",  link:"Xem khóa học AWS này",         avatar:"https://i.pravatar.cc/40?img=5" },
  { text:"Tôi thích khóa học về AI Studio. Không biết công cụ của Google, nhưng sau khi tham gia, tôi đã đưa nó vào sử dụng trong 24 giờ.", name:"Ben C.",             role:"Tốt nghiệp Chứng chỉ Chuyên nghiệp AI của Google", link:"Xem Chứng chỉ AI của Google",  avatar:"https://i.pravatar.cc/40?img=7" },
];
