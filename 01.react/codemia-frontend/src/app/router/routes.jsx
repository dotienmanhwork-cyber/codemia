import { createBrowserRouter } from "react-router-dom";

import PublicLayout from "../../layouts/PublicLayout";
import HomePage from "../../features/browse/pages/HomePage";
import CourseDetailPage from "../../features/course-detail/pages/CourseDetailPage";
import LoginPage from "../../features/auth/pages/LoginPage";
import LearningPage from "../../features/learning/pages/LearningPage";
import ExercisePage from "../../features/learning/pages/ExercisePage";
import CertificatePage from "../../features/learning/pages/CertificatePage";
import TeachOnCodemia from "../../features/browse/pages/TeachOnCodemia";
import CoursesPage    from "../../features/browse/pages/CoursesPage";
import ProfilePage    from "../../features/auth/pages/ProfilePage";
import CartPage           from "../../features/checkout/pages/CartPage";
import PaymentResultPage  from "../../features/checkout/pages/PaymentResultPage";
import MyCoursesPage from "../../features/learning/pages/MyCoursesPage";
import MyCertificatesPage from "../../features/learning/pages/MyCertificatesPage";
// Dashboard
import DashboardLayout from "../../layouts/DashboardLayout";

// Admin pages
import AdminDashboard    from "../../features/admin/pages/AdminDashboard";
import AdminUsers        from "../../features/admin/pages/AdminUsers";
import AdminUserDetail   from "../../features/admin/pages/AdminUserDetail";
import AdminRoles        from "../../features/admin/pages/AdminRoles";
import AdminCourses      from "../../features/admin/pages/AdminCourses";
import AdminCourseDetail from "../../features/admin/pages/AdminCourseDetail";
import AdminFinance      from "../../features/admin/pages/AdminFinance";
import AdminSettings     from "../../features/admin/pages/AdminSettings";
import AdminCategories   from "../../features/admin/pages/AdminCategories";
import AdminAiConfig     from "../../features/admin/pages/AdminAiConfig";   // ← new

// Teacher pages
import TeacherDashboard  from "../../features/teacher/pages/TeacherDashboard";
import TeacherCourses    from "../../features/teacher/pages/TeacherCourses";
import TeacherCourseEdit from "../../features/teacher/pages/TeacherCourseEdit";
import TeacherExercises  from "../../features/teacher/pages/TeacherExercises";
import TeacherStudents   from "../../features/teacher/pages/TeacherStudents";
import TeacherFinance    from "../../features/teacher/pages/TeacherFinance";

export const router = createBrowserRouter([
  // ── Public ──
  {
    element: <PublicLayout />,
    children: [
      { path: "/",             element: <HomePage />        },
      { path: "/courses/:slug", element: <CourseDetailPage /> },
      { path: "/login",        element: <LoginPage />        },
      { path: "/register",     element: <LoginPage />        },
      { path: "/teach",        element: <TeachOnCodemia />   },
      { path: "/courses",      element: <CoursesPage />      },
      { path: "/profile",          element: <ProfilePage />         },
      { path: "/cart",             element: <CartPage />            },
      { path: "/payment/result",   element: <PaymentResultPage />   },
      { path: "/my-courses", element: <MyCoursesPage /> },
      { path: "/my-certificates", element: <MyCertificatesPage /> },
    ],
  },

  // ── Learning (no layout shell) ──
  {
    path: "/learning-workspace/:courseSlug",
    element: <LearningPage />,
  },
  {
    path: "/exercise-workspace/:lessonId",
    element: <ExercisePage />,
  },
  {
    path: "/courses/:courseSlug/certificate",
    element: <CertificatePage />,
  },

  // ── Teacher ──
  {
    path: "/teacher",
    element: <DashboardLayout role="teacher" />,
    children: [
      { index: true,              element: <TeacherDashboard />  },
      { path: "courses",          element: <TeacherCourses />    },
      { path: "courses/:id/edit", element: <TeacherCourseEdit /> },
      { path: "exercises",        element: <TeacherExercises />  },
      { path: "students",         element: <TeacherStudents />   },
      { path: "finance",          element: <TeacherFinance />    },
    ],
  },

  // ── Admin ──
  {
    path: "/admin",
    element: <DashboardLayout role="admin" />,
    children: [
      { index: true,          element: <AdminDashboard />   },
      { path: "users",        element: <AdminUsers />       },
      { path: "users/:id",    element: <AdminUserDetail />  },
      { path: "roles",        element: <AdminRoles />       },
      { path: "courses",      element: <AdminCourses />     },
      { path: "courses/:id",  element: <AdminCourseDetail /> },
      { path: "finance",      element: <AdminFinance />     },
      { path: "categories",   element: <AdminCategories />  },
      { path: "settings",     element: <AdminSettings />    },
      { path: "ai-config",    element: <AdminAiConfig />    },  // ← new
    ],
  },
]);