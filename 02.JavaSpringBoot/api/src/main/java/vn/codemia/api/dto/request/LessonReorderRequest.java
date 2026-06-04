package vn.codemia.api.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class LessonReorderRequest {

	/** Danh sách bài học với thứ tự mới — FE gửi toàn bộ lesson trong 1 section */
	private List<LessonOrderItem> lessons;

	@Data
	public static class LessonOrderItem {
		private Integer id;
		private Integer orderIndex;
	}
}
