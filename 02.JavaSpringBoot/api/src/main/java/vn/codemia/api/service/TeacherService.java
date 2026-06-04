package vn.codemia.api.service;

import vn.codemia.api.dto.response.*;

import java.util.List;

public interface TeacherService {
    // Dashboard
    TeacherStatsResponse getDashboardStats();

    // Courses
    List<TeacherCourseResponse> getMyCourses();
    List<TeacherCourseResponse> getMyCoursesWithFilter(String status, String keyword);
    TeacherCourseResponse getCourseById(String id);

    // Students
    List<TeacherStudentResponse> getRecentStudents(int limit);
    TeacherStudentStatsResponse getStudentStats();
    List<TeacherStudentResponse> getStudentsWithFilter(String courseId, String status, String keyword, int page, int size);

    // Finance
    TeacherFinanceStatsResponse getFinanceStats();
    List<TeacherMonthlyRevenueResponse> getMonthlyRevenue(int months);
    List<TeacherCourseRevenueResponse> getRevenueByCourse();
    List<TeacherTransactionResponse> getTransactions(int page, int size, String keyword);
    long countTransactions(String keyword);

    // Revenue (dashboard widget)
    List<TeacherRevenueResponse> getRecentRevenue(int limit);

    // Exercises
    TeacherExerciseStatsResponse getExerciseStats();
    List<TeacherExerciseResponse> getExercises(String type, String keyword);
}