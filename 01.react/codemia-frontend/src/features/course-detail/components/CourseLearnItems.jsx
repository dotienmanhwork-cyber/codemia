export default function CourseLearnItems({ items = [] }) {
  if (items.length === 0) return null; // Nếu không có dữ liệu thì ẩn luôn box này

  return (
    <section className="bg-[#f9f9fb] border border-[#e1e7ec] rounded-xl p-[28px_32px] mb-10">
      <h2 className="text-2xl font-bold mb-5 text-[#1c1b1b]">Nội dung bạn sẽ tìm hiểu</h2>
      <div className="grid grid-cols-2 gap-[16px_32px]">
        {items.map((item, index) => (
          <div key={index} className="flex gap-3 text-[14.5px] leading-relaxed items-start text-[#333]">
            <span className="cd-ms text-[var(--cd-purple)] font-bold mt-[2px]">check</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}