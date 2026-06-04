// src/features/course-detail/pages/CourseDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { courseApi } from "../api/course.api";
import CourseHero from "../components/CourseHero";
import CourseSidebar from "../components/CourseSidebar";
import CourseLearnItems from "../components/CourseLearnItems";
import CourseCurriculum from "../components/CourseCurriculum";
import ReviewSection from "../components/ReviewSection";

export default function CourseDetailPage() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await courseApi.getCourseDetail(slug);
        setCourse(data);
      } catch (error) {
        console.error("Lỗi tải trang chi tiết", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchCourse();
  }, [slug]);

  if (loading) return <div>Đang tải...</div>;
  if (!course) return <div>Không tìm thấy khóa học</div>;

  const realLearnItems = course.learnObjectives
    ? course.learnObjectives.split("\n").filter((item) => item.trim() !== "")
    : [];

  return (
    <div className="font-['Inter'] text-[var(--cd-on-s)]">
      <CourseHero course={course} />

      <main className="max-w-[1184px] mx-auto px-6">
        <div className="grid grid-cols-1 min-[901px]:grid-cols-[1fr_340px] gap-12 relative items-start">
          <div className="py-8">
            <CourseLearnItems items={realLearnItems} />

            <CourseCurriculum sections={course.sections} />

            {/* ── Reviews ── */}
            <ReviewSection
              courseSlug={slug}
              enrolled={course.enrolled ?? false}
              averageRating={course.averageRating}
              reviewCount={course.reviewCount}
            />
          </div>

          <aside className="sticky top-6 z-10 -mt-[100px] max-[900px]:static max-[900px]:mt-5">
            <CourseSidebar course={course} />
          </aside>
        </div>
      </main>
    </div>
  );
}