package vn.codemia.api.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.entity.Course;
import vn.codemia.api.entity.Enrollment;
import vn.codemia.api.entity.User;
import vn.codemia.api.enums.CourseStatus;
import vn.codemia.api.exception.AppException;
import vn.codemia.api.exception.ErrorCode;
import vn.codemia.api.repository.*;
import vn.codemia.api.service.TeacherService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final SubmissionRepository submissionRepository;
    private final ExerciseRepository exerciseRepository;
    private final ReviewRepository reviewRepository;

    // ─── Helper ───────────────────────────────────────────────────────────────
    private User getCurrentTeacher() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private TeacherCourseResponse mapToCourseResponse(Course course) {
        long totalStudents = enrollmentRepository.countByCourseId(course.getId());
        double revenue = orderDetailRepository.sumRevenueByCourseId(course.getId());
        long totalLessons = lessonRepository.countByCourseId(course.getId());
        Integer categoryId = course.getCategory() != null ? course.getCategory().getId() : null;
        String categoryName = course.getCategory() != null ? course.getCategory().getName() : null;

        return TeacherCourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .slug(course.getSlug())
                .thumbnail(course.getThumbnailUrl())
                .price(course.getPrice())
                .description(course.getDescription())
                .totalStudents(totalStudents)
                .rating(reviewRepository.findAverageRatingByCourseId(course.getId()))
                .revenue(revenue)
                .status(course.getStatus() != null ? course.getStatus().name() : CourseStatus.DRAFT.name())
                .rejectedReason(course.getRejectedReason())
                .categoryId(categoryId)
                .categoryName(categoryName)
                .totalLessons(totalLessons)
                .createdAt(course.getCreatedAt())
                .build();
    }

    private TeacherStudentResponse mapToStudentResponse(Enrollment enrollment) {
        User student = enrollment.getStudent();
        Course course = enrollment.getCourse();

        long totalLessons = lessonRepository.countByCourseId(course.getId());
        long completedLessons = lessonProgressRepository.countCompletedLessonsByStudentAndCourse(
                student.getId(), course.getId());
        int progress = totalLessons == 0 ? 0
                : (int) Math.round((double) completedLessons / totalLessons * 100);

        LocalDateTime lastActive = lessonProgressRepository
                .findLastActivAtByStudentAndCourse(student.getId(), course.getId())
                .orElse(enrollment.getEnrolledAt());

        long exercisesSubmitted = submissionRepository.countByStudentIdAndCourseId(
                student.getId(), course.getId());

        String name = (student.getProfile() != null && student.getProfile().getFullName() != null)
                ? student.getProfile().getFullName() : student.getEmail();
        String avatar = student.getProfile() != null ? student.getProfile().getAvatarUrl() : null;

        // Status logic đồng bộ với FE deriveStatus():
        // progress == 100           → COMPLETED
        // progress == 0             → NOT_STARTED
        // lastActive > 7 ngày trước → INACTIVE
        // còn lại                   → ACTIVE
        String status;
        if (progress == 100) {
            status = "COMPLETED";
        } else if (progress == 0) {
            status = "NOT_STARTED";
        } else if (lastActive != null && lastActive.isBefore(LocalDateTime.now().minusDays(7))) {
            status = "INACTIVE";
        } else {
            status = "ACTIVE";
        }

        return TeacherStudentResponse.builder()
                .userId(student.getId())
                .name(name)
                .email(student.getEmail())
                .avatar(avatar)
                .courseName(course.getTitle())
                .courseId(course.getId())
                .progress(progress)
                .exercisesSubmitted(exercisesSubmitted)
                .enrolledAt(enrollment.getEnrolledAt())
                .lastActiveAt(lastActive)
                .status(status)
                .build();
    }

    // ─── Dashboard Stats ───────────────────────────────────────────────────────
    @Override
    public TeacherStatsResponse getDashboardStats() {
        User teacher = getCurrentTeacher();
        String teacherId = teacher.getId();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);

        long totalStudents = enrollmentRepository.countDistinctStudentsByTeacherId(teacherId);
        long totalCourses = courseRepository.countByTeacherId(teacherId);
        long draftCourses = courseRepository.countByTeacherIdAndStatus(teacherId, CourseStatus.DRAFT);
        double averageRating = courseRepository.findAverageRatingByTeacherId(teacherId);

        double revenueThisMonth = orderDetailRepository.sumRevenueByTeacherIdAndPeriod(
                teacherId, startOfThisMonth, now);
        double revenueLastMonth = orderDetailRepository.sumRevenueByTeacherIdAndPeriod(
                teacherId, startOfLastMonth, startOfThisMonth);

        long studentsThisMonth = enrollmentRepository.countStudentsByTeacherIdAndPeriod(
                teacherId, startOfThisMonth, now);
        long studentsLastMonth = enrollmentRepository.countStudentsByTeacherIdAndPeriod(
                teacherId, startOfLastMonth, startOfThisMonth);

        double revenueGrowth = revenueLastMonth == 0 ? 100.0
                : ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
        double studentGrowth = studentsLastMonth == 0 ? 100.0
                : ((double)(studentsThisMonth - studentsLastMonth) / studentsLastMonth) * 100;

        return TeacherStatsResponse.builder()
                .totalStudents(totalStudents)
                .totalCourses(totalCourses)
                .draftCourses(draftCourses)
                .monthlyRevenue(revenueThisMonth)
                .revenueGrowth(Math.round(revenueGrowth * 10.0) / 10.0)
                .studentGrowth(Math.round(studentGrowth * 10.0) / 10.0)
                .averageRating(Math.round(averageRating * 100.0) / 100.0)
                .build();
    }

    // ─── Courses ──────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public List<TeacherCourseResponse> getMyCourses() {
        User teacher = getCurrentTeacher();
        return courseRepository.findAllByTeacherId(teacher.getId()).stream()
                .map(this::mapToCourseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherCourseResponse> getMyCoursesWithFilter(String status, String keyword) {
        User teacher = getCurrentTeacher();
        CourseStatus courseStatus = null;
        if (status != null && !status.isBlank()) {
            courseStatus = CourseStatus.valueOf(status.toUpperCase());
        }
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return courseRepository.findByTeacherIdWithFilter(teacher.getId(), courseStatus, kw).stream()
                .map(this::mapToCourseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherCourseResponse getCourseById(String id) {
        User teacher = getCurrentTeacher();

        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.getTeacher().getId().equals(teacher.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return mapToCourseResponse(course);
    }

    // ─── Students ─────────────────────────────────────────────────────────────
    @Override
    public List<TeacherStudentResponse> getRecentStudents(int limit) {
        User teacher = getCurrentTeacher();
        return enrollmentRepository.findRecentByTeacherId(teacher.getId(), PageRequest.of(0, limit))
                .stream().map(this::mapToStudentResponse).collect(Collectors.toList());
    }

    @Override
    public TeacherStudentStatsResponse getStudentStats() {
        User teacher = getCurrentTeacher();
        String teacherId = teacher.getId();

        long totalStudents = enrollmentRepository.countTotalStudentsByTeacherId(teacherId);
        long completedStudents = enrollmentRepository.countCompletedStudentsByTeacherId(teacherId);
        double averageProgress = enrollmentRepository.findAverageProgressByTeacherId(teacherId);

        // Đếm ACTIVE trực tiếp từ DB: progress > 0%, chưa hoàn thành, hoạt động trong 7 ngày
        long activeStudents = enrollmentRepository.countActiveStudentsByTeacherId(
                teacherId, LocalDateTime.now().minusDays(7));

        return TeacherStudentStatsResponse.builder()
                .totalStudents(totalStudents)
                .activeStudents(activeStudents)
                .completedStudents(completedStudents)
                .averageProgress(Math.round(averageProgress * 10.0) / 10.0)
                .build();
    }

    /**
     * Lấy danh sách học viên với filter courseId + status + keyword, có phân trang.
     *
     * Luồng xử lý:
     * 1. DB query với courseId + keyword + Pageable (giới hạn số row load lên)
     * 2. Map enrollment → response (tính progress, status per row)
     * 3. Filter status in-memory sau khi map
     *
     * Lưu ý: filter status in-memory sau paginate có thể khiến trang trả về ít hơn
     * `size` items — chấp nhận được ở mức MVP. Khi cần pagination chính xác 100%,
     * cần push điều kiện status xuống DB dạng subquery (xem countCompletedStudentsByTeacherId
     * làm ví dụ).
     *
     * TODO: Khi BE deploy NOT_STARTED, FE có thể bỏ filter client-side và
     * gửi params.status = statusFilter trực tiếp lên đây.
     */
    @Override
    @Transactional(readOnly = true)
    public List<TeacherStudentResponse> getStudentsWithFilter(
            String courseId, String status, String keyword, int page, int size) {
        User teacher = getCurrentTeacher();
        String cId = (courseId != null && !courseId.isBlank()) ? courseId.trim() : null;
        String kw  = (keyword  != null && !keyword.isBlank())  ? keyword.trim()  : null;

        // Dùng Pageable overload — chỉ load `size` rows từ DB thay vì toàn bộ
        List<TeacherStudentResponse> result = enrollmentRepository
                .findByTeacherIdWithFilter(teacher.getId(), cId, kw, PageRequest.of(page, size))
                .stream()
                .map(this::mapToStudentResponse)
                .collect(Collectors.toList());

        // Filter status in-memory (sau khi đã paginate ở DB)
        if (status != null && !status.isBlank()) {
            result = result.stream()
                    .filter(s -> s.getStatus().equalsIgnoreCase(status.trim()))
                    .collect(Collectors.toList());
        }

        return result;
    }

    // ─── Finance ──────────────────────────────────────────────────────────────
    @Override
    public TeacherFinanceStatsResponse getFinanceStats() {
        User teacher = getCurrentTeacher();
        String teacherId = teacher.getId();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfThisMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfLastMonth = startOfThisMonth.minusMonths(1);

        // FIX: sumTotalRevenueByTeacherId đã được sửa dùng od.teacher.id,
        // không còn bỏ sót rows có od.course = NULL sau khi Admin xóa course.
        double totalRevenue = orderDetailRepository.sumTotalRevenueByTeacherId(teacherId);
        double thisMonthRevenue = orderDetailRepository.sumRevenueByTeacherIdAndPeriod(
                teacherId, startOfThisMonth, now);
        double lastMonthRevenue = orderDetailRepository.sumRevenueByTeacherIdAndPeriod(
                teacherId, startOfLastMonth, startOfThisMonth);

        long totalCourses = courseRepository.countByTeacherId(teacherId);
        double averagePerCourse = totalCourses == 0 ? 0 : totalRevenue / totalCourses;

        double revenueGrowth = lastMonthRevenue == 0 ? 100.0
                : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

        return TeacherFinanceStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .thisMonthRevenue(thisMonthRevenue)
                .lastMonthRevenue(lastMonthRevenue)
                .averagePerCourse(Math.round(averagePerCourse * 100.0) / 100.0)
                .revenueGrowth(Math.round(revenueGrowth * 10.0) / 10.0)
                .build();
    }

    @Override
    public List<TeacherMonthlyRevenueResponse> getMonthlyRevenue(int months) {
        User teacher = getCurrentTeacher();
        LocalDateTime from = LocalDateTime.now().minusMonths(months).withDayOfMonth(1)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);

        List<Object[]> rows = orderDetailRepository.findMonthlyRevenueByTeacherId(
                teacher.getId(), from);

        return rows.stream().map(row -> TeacherMonthlyRevenueResponse.builder()
                .month((String) row[0])
                .revenue(((Number) row[1]).doubleValue())
                .build()
        ).collect(Collectors.toList());
    }

    @Override
    public List<TeacherCourseRevenueResponse> getRevenueByCourse() {
        User teacher = getCurrentTeacher();

        List<Object[]> rows = orderDetailRepository.findRevenueGroupedByCourse(teacher.getId());

        return rows.stream().map(row -> {
            String courseId = (String) row[0];
            String courseName = (String) row[1];
            double revenue = ((Number) row[2]).doubleValue();
            long totalStudents = enrollmentRepository.countByCourseId(courseId);

            return TeacherCourseRevenueResponse.builder()
                    .courseId(courseId)
                    .courseName(courseName)
                    .revenue(revenue)
                    .totalStudents(totalStudents)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<TeacherTransactionResponse> getTransactions(int page, int size, String keyword) {
        User teacher = getCurrentTeacher();
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;

        return orderDetailRepository.findTransactionsByTeacherIdWithFilter(
                        teacher.getId(), kw, PageRequest.of(page, size))
                .stream().map(od -> {
                    User student = od.getOrder().getUser();
                    String name = (student.getProfile() != null && student.getProfile().getFullName() != null)
                            ? student.getProfile().getFullName() : student.getEmail();
                    String avatar = student.getProfile() != null ? student.getProfile().getAvatarUrl() : null;

                    // FIX: od.getCourse() có thể NULL nếu Admin đã xóa course sau khi transaction này tồn tại.
                    // Dùng snapshot tên từ od để tránh NPE — hiện tại query chưa trả về rows có course=NULL,
                    // nhưng defensive check này bảo vệ khi query được mở rộng về sau.
                    String courseName = od.getCourse() != null
                            ? od.getCourse().getTitle() : "[Khóa học đã bị xóa]";
                    String courseId = od.getCourse() != null
                            ? od.getCourse().getId() : null;

                    return TeacherTransactionResponse.builder()
                            .orderId(od.getOrder().getId())
                            .studentName(name)
                            .studentEmail(student.getEmail())
                            .studentAvatar(avatar)
                            .courseName(courseName)
                            .courseId(courseId)
                            .amount(od.getPriceAtPurchase().doubleValue())
                            .type("Enrollment")
                            .createdAt(od.getOrder().getCreatedAt())
                            .build();
                }).collect(Collectors.toList());
    }

    @Override
    public long countTransactions(String keyword) {
        User teacher = getCurrentTeacher();
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        return orderDetailRepository.countTransactionsByTeacherIdWithFilter(teacher.getId(), kw);
    }

    // ─── Revenue widget (Dashboard) ───────────────────────────────────────────
    @Override
    public List<TeacherRevenueResponse> getRecentRevenue(int limit) {
        User teacher = getCurrentTeacher();
        return orderDetailRepository.findRecentByTeacherId(teacher.getId(), PageRequest.of(0, limit))
                .stream().map(od -> {
                    // FIX: od.getCourse() có thể NULL nếu Admin đã xóa course.
                    // Defensive null-check tránh NPE khi render widget dashboard.
                    String courseId   = od.getCourse() != null ? od.getCourse().getId()    : null;
                    String courseName = od.getCourse() != null ? od.getCourse().getTitle() : "[Khóa học đã bị xóa]";

                    return TeacherRevenueResponse.builder()
                            .orderId(od.getOrder().getId())
                            .courseId(courseId)
                            .courseName(courseName)
                            .amount(od.getPriceAtPurchase().doubleValue())
                            .type("ENROLLMENT")
                            .status(od.getOrder().getStatus().name())
                            .createdAt(od.getOrder().getCreatedAt())
                            .build();
                }).collect(Collectors.toList());
    }

    // ─── Exercises ────────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public TeacherExerciseStatsResponse getExerciseStats() {
        User teacher = getCurrentTeacher();
        String teacherId = teacher.getId();

        long totalExercises   = exerciseRepository.countByTeacherIdAndType(teacherId, null);
        long quizExercises    = exerciseRepository.countByTeacherIdAndType(teacherId, "QUIZ");
        long codeExercises    = exerciseRepository.countByTeacherIdAndType(teacherId, "CODE");
        long totalSubmissions = submissionRepository.countTotalSubmissionsByTeacherId(teacherId);

        return TeacherExerciseStatsResponse.builder()
                .totalExercises(totalExercises)
                .quizExercises(quizExercises)
                .codeExercises(codeExercises)
                .totalSubmissions(totalSubmissions)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherExerciseResponse> getExercises(String type, String keyword) {
        User teacher = getCurrentTeacher();
        String t  = (type    != null && !type.isBlank())    ? type.trim().toUpperCase() : null;
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim()            : null;

        return exerciseRepository.findByTeacherIdWithFilter(teacher.getId(), t, kw)
                .stream()
                .map(e -> {
                    long submissions = submissionRepository.countByExerciseId(e.getId());
                    return TeacherExerciseResponse.builder()
                            .id(e.getId())
                            .title(e.getTitle())
                            .type(e.getType())
                            .difficulty(e.getDifficulty())
                            .courseId(e.getLesson().getSection().getCourse().getId())
                            .courseName(e.getLesson().getSection().getCourse().getTitle())
                            .lessonId(e.getLesson().getId())
                            .lessonTitle(e.getLesson().getTitle())
                            .totalSubmissions(submissions)
                            .build();
                })
                .collect(Collectors.toList());
    }
}