package vn.codemia.api.service;

import vn.codemia.api.entity.Lesson;

public interface VideoDurationService {

	/**
	 * Tự động lấy thời lượng video từ YouTube / Vimeo rồi lưu vào DB.
	 *
	 * Gọi sau khi transaction của create/update lesson đã commit,
	 * chạy trong async thread — cùng pattern với TranscriptService.
	 *
	 * @param lesson entity đã được save (có id, videoUrl hợp lệ)
	 */
	void fetchAndSaveDuration(Lesson lesson);
}