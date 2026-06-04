package vn.codemia.api.service;

import vn.codemia.api.dto.response.TranscriptResponse;
import vn.codemia.api.entity.Lesson;

public interface TranscriptService {

	/**
	 * Pull transcript từ YouTube URL, lưu vào DB, trả về kết quả.
	 * Nếu transcript đã tồn tại → trả cache, không pull lại.
	 */
	TranscriptResponse pullTranscript(Integer lessonId);

	/**
	 * Pull transcript và lưu, bỏ qua cache.
	 * Chỉ dùng nội bộ bởi LessonService khi teacher tạo/cập nhật lesson.
	 * Không expose ra endpoint cho student.
	 */
	TranscriptResponse pullAndSaveTranscript(Integer lessonId);

	/**
	 * Overload nhận thẳng Lesson entity — dùng khi gọi async ngay sau create/update
	 * để tránh race condition transaction chưa commit mà thread khác đã query DB.
	 */
	TranscriptResponse pullAndSaveTranscript(Lesson lesson);

	/**
	 * Lấy đoạn transcript gần nhất với timestamp (giây) — dùng cho AI chat.
	 * windowSeconds: lấy ±windowSeconds xung quanh timestamp.
	 */
	String getTranscriptWindow(Integer lessonId, int timestampSeconds, int windowSeconds);
}