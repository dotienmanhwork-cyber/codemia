// features/learning/api/learning.api.js
import axios from "@/shared/config/axios";

/**
 * Lấy thông tin khóa học + bài học hiện tại theo enrollment
 * GET /api/learning/courses/:courseId
 */
export const getCourseProgress = (courseId) =>
  axios.get(`/learning/courses/${courseId}`);

/**
 * Lấy danh sách chapters + lessons của một khóa học
 * GET /api/learning/courses/:courseId/curriculum
 */
export const getCourseCurriculum = (courseId) =>
  axios.get(`/learning/courses/${courseId}/curriculum`);

/**
 * Lấy chi tiết một lesson (video URL, metadata)
 * GET /api/learning/lessons/:lessonId
 */
export const getLessonDetail = (lessonId) =>
  axios.get(`/learning/lessons/${lessonId}`);

/**
 * Đánh dấu lesson đã hoàn thành
 * POST /api/learning/lessons/:lessonId/complete
 */
export const markLessonComplete = (lessonId) =>
  axios.post(`/learning/lessons/${lessonId}/complete`);

/**
 * Lưu tiến độ xem video (timestamp)
 * PUT /api/learning/lessons/:lessonId/progress
 * @param {string} lessonId
 * @param {number} currentTime - seconds
 */
export const saveVideoProgress = (lessonId, currentTime) =>
  axios.put(`/learning/lessons/${lessonId}/progress`, { currentTime });

/**
 * Lấy bài tập của một lesson
 * GET /api/learning/lessons/:lessonId/exercise
 */
export const getLessonExercise = (lessonId) =>
  axios.get(`/learning/lessons/${lessonId}/exercise`);

/**
 * Nộp bài tập code
 * POST /api/learning/exercises/:exerciseId/submit
 * @param {string} exerciseId
 * @param {{ code: string, language: string }} payload
 */
export const submitExercise = (lessonId, payload) =>
  axios.post(`/learning/lessons/${lessonId}/exercise/submit`, payload);

/**
 * Chạy thử code (không lưu điểm)
 * POST /api/learning/exercises/:exerciseId/run
 * @param {string} exerciseId
 * @param {{ code: string, language: string }} payload
 */
export const runCode = (exerciseId, payload) =>
  axios.post(`/learning/exercises/${exerciseId}/run`, payload);

/**
 * Lấy kết quả lần nộp gần nhất
 * GET /api/learning/exercises/:exerciseId/last-submission
 */
export const getLastSubmission = (exerciseId) =>
  axios.get(`/learning/exercises/${exerciseId}/last-submission`);

/**
 * Lưu ghi chú của student cho một lesson
 * POST /api/learning/lessons/:lessonId/notes
 * @param {string} lessonId
 * @param {{ text: string, timestamp?: number }} payload
 */
export const saveNote = (lessonId, payload) =>
  axios.post(`/learning/lessons/${lessonId}/notes`, payload);

/**
 * Lấy danh sách ghi chú của student
 * GET /api/learning/lessons/:lessonId/notes
 */
export const getNotes = (lessonId) =>
  axios.get(`/learning/lessons/${lessonId}/notes`);

/**
 * Lấy danh sách khóa học đã enroll của user hiện tại
 * GET /api/learning/my-courses
 */
export const getMyCourses = () =>
  axios.get("/learning/my-courses");

/**
 * Lấy chứng chỉ hoàn thành khóa học (cần enrolled + progress 100%)
 * GET /api/learning/courses/:courseSlug/certificate
 * @returns {{ code, result: CertificateResponse }}
 * Lỗi: 1013 (chưa enroll) | 1027 (chưa hoàn thành 100%)
 */
export const getCertificate = (courseSlug) =>
  axios.get(`/learning/courses/${courseSlug}/certificate`);

/**
 * Lấy tất cả chứng chỉ của user hiện tại
 * GET /api/learning/my-certificates
 * @returns {{ code, result: CertificateResponse[] }}
 */
export const getMyCertificates = () =>
  axios.get("/learning/my-certificates");
