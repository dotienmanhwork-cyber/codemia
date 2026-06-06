package vn.codemia.api.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.codemia.api.dto.request.AiFeatureConfigUpdateRequest;
import vn.codemia.api.dto.response.AiCacheSummaryResponse;
import vn.codemia.api.dto.response.AiFeatureConfigResponse;
import vn.codemia.api.dto.response.AiProviderStatusResponse;
import vn.codemia.api.enums.AiFeature;

import java.util.List;

public interface AiAdminService {

	// ── Provider status ───────────────────────────────────────────────────
	/** Danh sách tất cả providers và trạng thái API key. */
	List<AiProviderStatusResponse> getProviderStatuses();

	// ── Feature config ────────────────────────────────────────────────────
	/** Lấy config thứ tự provider của tất cả features. */
	List<AiFeatureConfigResponse> getAllFeatureConfigs();

	/** Cập nhật thứ tự provider cho 1 feature. */
	AiFeatureConfigResponse updateFeatureConfig(AiFeature feature, AiFeatureConfigUpdateRequest request);

	/** Reset tất cả feature về default. */
	List<AiFeatureConfigResponse> resetAllToDefault();

	// ── Summary cache ─────────────────────────────────────────────────────
	/** Lấy toàn bộ lessons kèm thông tin cache (có thể filter theo courseId). */
	Page<AiCacheSummaryResponse> getCacheSummary(String courseId, Pageable pageable);

	/** Xóa cache của 1 lesson. */
	void clearLessonCache(Integer lessonId);

	/** Xóa cache toàn bộ lessons trong 1 course. */
	int clearCourseCacheAll(String courseId);
}