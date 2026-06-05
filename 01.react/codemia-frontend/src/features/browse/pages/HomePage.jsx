import { useState, useEffect } from "react";
import { Crown, Gift, Loader2 } from "lucide-react";
import HeroSection from "../components/HeroSection";
import FeatureHighlights from "../components/FeatureHighlights";
import CourseSection from "../components/CourseSection";
import TestimonialsSection from "../components/TestimonialsSection";
import AiTutorShowcase from "../components/AiTutorShowcase";
import { C } from "@/shared/utils/constants";
import { catalogApi } from "../api/catalog.api";
import { TESTIMONIALS } from "../__mocks__/mockData";

export default function HomePage() {
  const [courses, setCourses]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Gọi song song 2 API cho nhanh
        const [coursesData, categoriesData] = await Promise.all([
          catalogApi.getAllCourses(),
          catalogApi.getAllCategories(),
        ]);

        // --- Courses ---
        if (Array.isArray(coursesData)) {
          setCourses(coursesData);
        } else if (coursesData && Array.isArray(coursesData.content)) {
          setCourses(coursesData.content);
        } else {
          console.error("courses data không đúng định dạng:", coursesData);
          setCourses([]);
        }

        // --- Categories ---
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error("fetchAll error:", err);
        setCourses([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const safeCourses = Array.isArray(courses) ? courses : [];

  const freeCourses     = safeCourses.filter(c => c.price === 0 || c.price === null).slice(0, 4);
  const proCourses      = safeCourses.filter(c => c.price > 0).slice(0, 4);
  const featuredCourses = safeCourses.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf8f8]">
        <Loader2 className="animate-spin" size={40} style={{ color: C.secondary }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: "#fcf8f8", color: "#1c1b1b", fontFamily: "'Inter', sans-serif" }}
    >
      <main>
        <HeroSection />
        <FeatureHighlights />

        <CourseSection
          title="Khóa Học Nổi Bật"
          subtitle="Khám phá các khóa học được tích hợp công nghệ AI mới nhất"
          courses={featuredCourses}
          categories={categories}
          showCategories
        />

        <div className="mx-6 border-t" style={{ maxWidth: 1280, margin: "0 auto", borderColor: C.outline }} />

        <div style={{ backgroundColor: C.surfaceLow }}>
          <CourseSection
            title="Khóa Học Miễn Phí"
            subtitle="Bắt đầu hành trình học tập của bạn mà không tốn phí"
            courses={freeCourses}
            accentColor={C.success}
            icon={Gift}
            viewAllPath="/courses?price=free"
          />
        </div>

        <CourseSection
          title="Khóa Học Pro"
          subtitle="Nâng tầm kỹ năng với các khóa học chuyên sâu chất lượng cao"
          courses={proCourses}
          accentColor="#d4a800"
          icon={Crown}
          viewAllPath="/courses?price=pro"
        />

        <TestimonialsSection />
        <AiTutorShowcase />
      </main>
    </div>
  );
}