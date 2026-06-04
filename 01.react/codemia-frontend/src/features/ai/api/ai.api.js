// features/ai/api/ai.api.js
import axios from "@/shared/config/axios";

/**
 * Gửi câu hỏi đến AI trợ lý trong bài học
 * POST /api/ai/chat
 * @param {{ lessonId: string, message: string, history: Array }} payload
 */
export const sendChatMessage = (payload) =>
  axios.post("/ai/chat", payload);

/**
 * Lấy tóm tắt AI cho một lesson
 * GET /api/ai/lessons/:lessonId/summary
 */
export const getLessonSummary = (lessonId) =>
  axios.get(`/ai/lessons/${lessonId}/summary`);

/**
 * Yêu cầu AI tóm tắt lại lesson (regenerate)
 * POST /api/ai/lessons/:lessonId/summary/regenerate
 */
export const regenerateSummary = (lessonId) =>
  axios.post(`/ai/lessons/${lessonId}/summary/regenerate`);

/**
 * AI review code của student
 * POST /api/ai/code-review
 * @param {{ code: string, language: string, exerciseId?: string, errorMessage?: string }} payload
 */
export const reviewCode = (payload) =>
  axios.post("/ai/code-review", payload);

/**
 * AI giải thích lỗi cụ thể
 * POST /api/ai/explain-error
 * @param {{ code: string, language: string, errorMessage: string, errorLine?: number }} payload
 */
export const explainError = (payload) =>
  axios.post("/ai/explain-error", payload);

/**
 * AI gợi ý hint cho bài tập (không tiết lộ đáp án)
 * POST /api/ai/hint
 * @param {{ exerciseId: string, code: string, step?: number }} payload
 */
export const getExerciseHint = (payload) =>
  axios.post("/ai/hint", payload);

export const pullTranscript = (lessonId) =>
  axios.post(`/ai/lessons/${lessonId}/pull-transcript`);