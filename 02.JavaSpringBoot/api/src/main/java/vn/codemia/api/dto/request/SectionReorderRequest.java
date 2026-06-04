package vn.codemia.api.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class SectionReorderRequest {

	/** Danh sách chương với thứ tự mới — FE gửi toàn bộ sections của 1 course */
	private List<SectionOrderItem> sections;

	@Data
	public static class SectionOrderItem {
		private Integer id;
		private Integer orderIndex;
	}
}