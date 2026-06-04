package vn.codemia.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.response.*;
import vn.codemia.api.service.CourseService;
import vn.codemia.api.service.TeacherService;

import java.util.List;
import java.util.Map;
import vn.codemia.api.dto.request.WithdrawalRequest;
import vn.codemia.api.dto.response.TeacherBalanceResponse;
import vn.codemia.api.dto.response.WithdrawalResponse;
import vn.codemia.api.service.WithdrawalService;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {

    private final TeacherService teacherService;
    private final CourseService courseService;
    private final WithdrawalService withdrawalService;

    // ─── Dashboard ────────────────────────────────────────────────────────────
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<TeacherStatsResponse>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.<TeacherStatsResponse>builder()
                .code(1000).result(teacherService.getDashboardStats()).build());
    }

    // ─── Courses ──────────────────────────────────────────────────────────────
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse<List<TeacherCourseResponse>>> getMyCourses() {
        return ResponseEntity.ok(ApiResponse.<List<TeacherCourseResponse>>builder()
                .code(1000).result(teacherService.getMyCourses()).build());
    }

    @GetMapping("/courses/filter")
    public ResponseEntity<ApiResponse<List<TeacherCourseResponse>>> getMyCoursesWithFilter(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TeacherCourseResponse>>builder()
                .code(1000).result(teacherService.getMyCoursesWithFilter(status, keyword)).build());
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<ApiResponse<TeacherCourseResponse>> getCourseById(
            @PathVariable String id
    ) {
        return ResponseEntity.ok(ApiResponse.<TeacherCourseResponse>builder()
                .code(1000).result(teacherService.getCourseById(id)).build());
    }

    @PatchMapping("/courses/{id}/status")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourseStatus(
            @PathVariable String id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(ApiResponse.<CourseResponse>builder()
                .code(1000).result(courseService.updateStatus(id, status)).build());
    }

    @PatchMapping("/courses/{id}/submit")
    public ResponseEntity<ApiResponse<Void>> submitCourse(@PathVariable String id) {
        courseService.submitCourse(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000).message("Course submitted for review").build());
    }

    @PatchMapping("/courses/{id}/cancel-pending")
    public ResponseEntity<ApiResponse<Void>> cancelPendingCourse(@PathVariable String id) {
        courseService.cancelPendingCourse(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000).message("Course withdrawn from review").build());
    }

    @PatchMapping("/courses/{id}/unpublish")
    public ResponseEntity<ApiResponse<Void>> unpublishCourse(@PathVariable String id) {
        courseService.unpublishCourse(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000).message("Course unpublished").build());
    }

    @PatchMapping("/courses/{id}/republish")
    public ResponseEntity<ApiResponse<Void>> republishCourse(@PathVariable String id) {
        courseService.republishCourse(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000).message("Course republished").build());
    }

    // ─── Students ─────────────────────────────────────────────────────────────
    @GetMapping("/students/stats")
    public ResponseEntity<ApiResponse<TeacherStudentStatsResponse>> getStudentStats() {
        return ResponseEntity.ok(ApiResponse.<TeacherStudentStatsResponse>builder()
                .code(1000).result(teacherService.getStudentStats()).build());
    }

    @GetMapping("/students/recent")
    public ResponseEntity<ApiResponse<List<TeacherStudentResponse>>> getRecentStudents(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TeacherStudentResponse>>builder()
                .code(1000).result(teacherService.getRecentStudents(limit)).build());
    }

    /**
     * GET /api/teacher/students
     *
     * Params:
     *   courseId  — filter theo khóa học (optional)
     *   status    — ACTIVE | COMPLETED | INACTIVE | NOT_STARTED (optional)
     *   keyword   — tìm theo tên / email (optional)
     *   page      — trang hiện tại, bắt đầu từ 0 (default: 0)
     *   size      — số item mỗi trang (default: 20)
     *
     * Lưu ý: filter status làm in-memory sau khi paginate ở DB, nên số item
     * trả về có thể ít hơn size khi status filter loại bớt. FE nên dùng
     * length của array trả về thay vì so sánh với size để detect last page.
     */
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<TeacherStudentResponse>>> getStudentsWithFilter(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TeacherStudentResponse>>builder()
                .code(1000)
                .result(teacherService.getStudentsWithFilter(courseId, status, keyword, page, size))
                .build());
    }

    // ─── Finance ──────────────────────────────────────────────────────────────
    @GetMapping("/finance/stats")
    public ResponseEntity<ApiResponse<TeacherFinanceStatsResponse>> getFinanceStats() {
        return ResponseEntity.ok(ApiResponse.<TeacherFinanceStatsResponse>builder()
                .code(1000).result(teacherService.getFinanceStats()).build());
    }

    @GetMapping("/finance/monthly")
    public ResponseEntity<ApiResponse<List<TeacherMonthlyRevenueResponse>>> getMonthlyRevenue(
            @RequestParam(defaultValue = "7") int months
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TeacherMonthlyRevenueResponse>>builder()
                .code(1000).result(teacherService.getMonthlyRevenue(months)).build());
    }

    @GetMapping("/finance/by-course")
    public ResponseEntity<ApiResponse<List<TeacherCourseRevenueResponse>>> getRevenueByCourse() {
        return ResponseEntity.ok(ApiResponse.<List<TeacherCourseRevenueResponse>>builder()
                .code(1000).result(teacherService.getRevenueByCourse()).build());
    }

    @GetMapping("/finance/transactions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword
    ) {
        List<TeacherTransactionResponse> transactions = teacherService.getTransactions(page, size, keyword);
        long total = teacherService.countTransactions(keyword);
        return ResponseEntity.ok(ApiResponse.<Map<String, Object>>builder()
                .code(1000)
                .result(Map.of(
                        "transactions", transactions,
                        "total", total,
                        "page", page,
                        "size", size
                )).build());
    }

    @GetMapping("/finance/balance")
    public ResponseEntity<ApiResponse<TeacherBalanceResponse>> getMyBalance() {
        return ResponseEntity.ok(ApiResponse.<TeacherBalanceResponse>builder()
                .code(1000).result(withdrawalService.getMyBalance()).build());
    }

    @PostMapping("/finance/withdraw")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> requestWithdrawal(
            @RequestBody WithdrawalRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.<WithdrawalResponse>builder()
                .code(1000).result(withdrawalService.requestWithdrawal(request.getAmount())).build());
    }

    @GetMapping("/finance/withdrawals")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> getMyWithdrawals() {
        return ResponseEntity.ok(ApiResponse.<List<WithdrawalResponse>>builder()
                .code(1000).result(withdrawalService.getMyWithdrawals()).build());
    }

    // ─── Revenue widget ───────────────────────────────────────────────────────
    @GetMapping("/revenue/recent")
    public ResponseEntity<ApiResponse<List<TeacherRevenueResponse>>> getRecentRevenue(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TeacherRevenueResponse>>builder()
                .code(1000).result(teacherService.getRecentRevenue(limit)).build());
    }

    // ─── Exercises ────────────────────────────────────────────────────────────
    @GetMapping("/exercises/stats")
    public ResponseEntity<ApiResponse<TeacherExerciseStatsResponse>> getExerciseStats() {
        return ResponseEntity.ok(ApiResponse.<TeacherExerciseStatsResponse>builder()
                .code(1000).result(teacherService.getExerciseStats()).build());
    }

    @GetMapping("/exercises")
    public ResponseEntity<ApiResponse<List<TeacherExerciseResponse>>> getExercises(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.<List<TeacherExerciseResponse>>builder()
                .code(1000).result(teacherService.getExercises(type, keyword)).build());
    }
}