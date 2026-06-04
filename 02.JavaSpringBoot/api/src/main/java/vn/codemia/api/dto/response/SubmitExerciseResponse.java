package vn.codemia.api.dto.response;

import lombok.*;
import vn.codemia.api.enums.AiProviderType;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitExerciseResponse {

	// ── Kết quả chấm điểm từ AI ───────────────────────────────────────────
	private Integer score;
	private boolean passed;
	private String aiFeedback;
	private List<RequirementResult> requirementResults;
	private AiProviderType usedProvider;

	// ── Trạng thái nộp bài ────────────────────────────────────────────────
	/** "PASSED" | "SUBMITTED" */
	private String status;

	/** Lần nộp thứ mấy (bắt đầu từ 1, không giới hạn) */
	private Integer attemptNumber;

	// ── Tiến độ bài học ───────────────────────────────────────────────────
	/** true chỉ khi PASSED → FE đánh dấu lesson hoàn thành */
	private boolean lessonCompleted;

	// ── UX sau nộp bài ────────────────────────────────────────────────────
	/** true khi chưa PASSED → FE hiện nút "Nộp lại" */
	private boolean canRetry;

	/** Thông báo hiển thị cho học viên */
	private String message;

	// ── Lesson kế tiếp (luôn trả về nếu có, kể cả khi SUBMITTED) ─────────
	private boolean hasNextLesson;
	private Integer nextLessonId;
	private String nextLessonTitle;

	// ── Inner class ───────────────────────────────────────────────────────
	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class RequirementResult {
		private String requirement;
		private boolean passed;
		private String note;
	}
}