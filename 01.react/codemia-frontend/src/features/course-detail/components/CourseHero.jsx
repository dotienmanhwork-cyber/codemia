// src/features/course-detail/components/CourseHero.jsx

const Icon = ({ name, filled = false, size = 18, style = {} }) => (
  <span 
    className={`cd-ms${filled ? " cd-ms-fill" : ""}`} 
    style={{ fontSize: size, ...style }}
  >
    {name}
  </span>
);

// Render sao dựa trên averageRating (0–5)
function StarDisplay({ rating = 0, size = 16 }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rating);
        const half   = !filled && i === Math.ceil(rating) && rating % 1 >= 0.25;
        return (
          <Icon
            key={i}
            name={half ? "star_half" : "star"}
            filled={filled || half}
            size={size}
          />
        );
      })}
    </div>
  );
}

export default function CourseHero({ course }) {
  const categoryName = course.category?.name || "Lập trình";

  // updatedAt từ BE: "2024-11-15T..." → "11/2024"
  const updatedLabel = course.updatedAt
    ? (() => {
        const d = new Date(course.updatedAt);
        return `${d.getMonth() + 1}/${d.getFullYear()}`;
      })()
    : null;

  const rating      = course.averageRating ?? null;
  const reviewCount = course.reviewCount   ?? 0;

  return (
    <section className="bg-[var(--cd-hero-bg)] text-[var(--cd-on-s)] pt-7 pb-14">
      <div className="max-w-[1184px] mx-auto px-6">
        <div className="grid grid-cols-1 min-[901px]:grid-cols-[1fr_340px] gap-12 max-[900px]:gap-6 items-start">
          {/* Content Left */}
          <div className="cd-hero-left">
            {/* 1. Breadcrumbs */}
            <nav className="inline-flex items-center gap-2 text-sm mb-[18px]">
              <a href="/" className="text-[var(--cd-purple)] font-semibold no-underline hover:underline">Phát triển</a>
              <Icon name="chevron_right" size={14} style={{color: '#959699'}} />
              <a href="/courses" className="text-[var(--cd-purple)] font-semibold no-underline hover:underline">{categoryName}</a>
            </nav>

            {/* 2. Title & Subtitle */}
            <h1 className="text-[40px] max-[900px]:text-[32px] font-extrabold m-0 mb-3.5 leading-[1.15] tracking-tight">{course.title}</h1>
            <p className="text-lg leading-[1.55] m-0 mb-[18px] text-[#3c3f42] max-w-[760px]">{course.description}</p>

            {/* 3. Ratings */}
            <div className="flex items-center flex-wrap gap-2.5 mb-3 text-sm">
              {rating != null ? (
                <>
                  <b className="text-[var(--cd-warn)] font-extrabold mr-[2px]">{Number(rating).toFixed(1)}</b>
                  <StarDisplay rating={rating} size={16} />
                  <a href="#reviews" className="text-[var(--cd-purple)] no-underline font-semibold hover:underline">
                    ({reviewCount.toLocaleString("vi-VN")} xếp hạng)
                  </a>
                </>
              ) : (
                <span className="text-sm text-gray-400">Chưa có đánh giá</span>
              )}
            </div>

            {/* 4. Instructor */}
            <div className="text-sm mb-3.5 text-[var(--cd-on-s)]">
              Được tạo bởi <a href="#teacher" className="text-[var(--cd-purple)] font-semibold no-underline hover:underline">{course.teacherName ?? "Codemia Team"}</a>
            </div>

            {/* 5. Meta Info */}
            <div className="flex flex-wrap gap-[18px] text-sm text-[var(--cd-on-s)] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-2 [&_span]:text-[#2d2f31] [&_.cd-ms]:text-[#2d2f31] [&_.cd-ms]:opacity-75">
              {updatedLabel && (
                <span>
                  <Icon name="update" size={16} />
                  Cập nhật lần cuối {updatedLabel}
                </span>
              )}
              <span>
                <Icon name="language" size={16} />
                Tiếng Việt
              </span>
              <span>
                <Icon name="closed_caption" size={16} />
                Tiếng Việt [Tự động]
              </span>
            </div>
          </div>

          {/* Cột phải để trống cho Sidebar đè lên */}
          <div className="cd-hero-right" />
        </div>
      </div>
    </section>
  );
}