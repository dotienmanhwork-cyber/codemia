package vn.codemia.api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.codemia.api.dto.request.AiFeatureConfigUpdateRequest;
import vn.codemia.api.dto.response.AiCacheSummaryResponse;
import vn.codemia.api.dto.response.AiFeatureConfigResponse;
import vn.codemia.api.dto.response.AiProviderStatusResponse;
import vn.codemia.api.enums.AiFeature;
import vn.codemia.api.service.AiAdminService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai")
@RequiredArgsConstructor
public class AiAdminController {

	private final AiAdminService aiAdminService;

	// ── Provider status ───────────────────────────────────────────────────

	/**
	 * GET /api/admin/ai/providers
	 * Danh sách providers: key có được cấu hình không, model đang dùng.
	 */
	@GetMapping("/providers")
	public ResponseEntity<List<AiProviderStatusResponse>> getProviderStatuses() {
		return ResponseEntity.ok(aiAdminService.getProviderStatuses());
	}

	// ── Feature config ────────────────────────────────────────────────────

	/**
	 * GET /api/admin/ai/config
	 * Lấy thứ tự fallback provider của tất cả features.
	 */
	@GetMapping("/config")
	public ResponseEntity<List<AiFeatureConfigResponse>> getAllConfigs() {
		return ResponseEntity.ok(aiAdminService.getAllFeatureConfigs());
	}

	/**
	 * PUT /api/admin/ai/config/{feature}
	 * Cập nhật thứ tự provider cho 1 feature.
	 *
	 * Body: { "providerOrder": ["CLAUDE", "OPENAI", "GROQ"] }
	 */
	@PutMapping("/config/{feature}")
	public ResponseEntity<AiFeatureConfigResponse> updateConfig(
			@PathVariable AiFeature feature,
			@Valid @RequestBody AiFeatureConfigUpdateRequest request) {

		return ResponseEntity.ok(aiAdminService.updateFeatureConfig(feature, request));
	}

	/**
	 * POST /api/admin/ai/config/reset
	 * Reset tất cả feature về default ban đầu.
	 */
	@PostMapping("/config/reset")
	public ResponseEntity<List<AiFeatureConfigResponse>> resetToDefault() {
		return ResponseEntity.ok(aiAdminService.resetAllToDefault());
	}

	// ── Summary cache ─────────────────────────────────────────────────────

	/**
	 * GET /api/admin/ai/cache/summary?courseId=xxx
	 * Danh sách lessons kèm thông tin cache.
	 * courseId optional — nếu không có thì trả tất cả.
	 */
	@GetMapping("/cache/summary")
	public ResponseEntity<List<AiCacheSummaryResponse>> getCacheSummary(
			@RequestParam(required = false) String courseId) {

		return ResponseEntity.ok(aiAdminService.getCacheSummary(courseId));
	}

	/**
	 * DELETE /api/admin/ai/cache/summary/{lessonId}
	 * Xóa cache tóm tắt của 1 lesson.
	 */
	@DeleteMapping("/cache/summary/{lessonId}")
	public ResponseEntity<Void> clearLessonCache(@PathVariable Integer lessonId) {
		aiAdminService.clearLessonCache(lessonId);
		return ResponseEntity.noContent().build();
	}

	/**
	 * DELETE /api/admin/ai/cache/summary/course/{courseId}
	 * Xóa cache tóm tắt toàn bộ lessons trong 1 course.
	 * Trả về số lesson bị xóa cache.
	 */
	@DeleteMapping("/cache/summary/course/{courseId}")
	public ResponseEntity<Map<String, Integer>> clearCourseCacheAll(
			@PathVariable String courseId) {

		int cleared = aiAdminService.clearCourseCacheAll(courseId);
		return ResponseEntity.ok(Map.of("clearedCount", cleared));
	}
}