// ===== ChatRequest.java =====
package vn.codemia.api.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ChatRequest {
	private String  message;
	private String  sessionId;        // optional — group lịch sử hội thoại sau này
	private Integer lessonId;         // bài học đang xem
	private Integer timestampSeconds; // timestamp video hiện tại (giây)
	private boolean quizMode;              // true khi học viên đang trong màn hình quiz
	private List<String> quizPassedQuestions; // danh sách câu đã trả lời đúng (sau khi nộp bài)
}