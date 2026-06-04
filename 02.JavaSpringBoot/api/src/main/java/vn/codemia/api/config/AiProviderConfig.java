package vn.codemia.api.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.codemia.api.entity.AiFeatureConfig;
import vn.codemia.api.enums.AiFeature;
import vn.codemia.api.enums.AiProviderType;
import vn.codemia.api.repository.AiFeatureConfigRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Quản lý thứ tự fallback provider theo từng feature.
 * Đọc từ DB (bảng ai_feature_configs).
 * Nếu DB chưa có row nào → seed defaults tự động khi khởi động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiProviderConfig {

	private final AiFeatureConfigRepository aiFeatureConfigRepository;

	// ── Default fallback order (seed vào DB nếu chưa có) ─────────────────
	public static final Map<AiFeature, List<AiProviderType>> DEFAULTS = Map.of(
			AiFeature.CHAT,        List.of(AiProviderType.OPENAI, AiProviderType.CLAUDE, AiProviderType.GEMINI, AiProviderType.GROQ),
			AiFeature.CODE_REVIEW, List.of(AiProviderType.OPENAI, AiProviderType.CLAUDE, AiProviderType.GROQ,   AiProviderType.GEMINI),
			AiFeature.SUMMARY,     List.of(AiProviderType.GEMINI, AiProviderType.GROQ,   AiProviderType.CLAUDE, AiProviderType.OPENAI),
			AiFeature.CODE_RUN,    List.of(AiProviderType.GROQ_FAST),
			AiFeature.CODE_SUBMIT, List.of(AiProviderType.GROQ),
			AiFeature.QUIZ_SUBMIT, List.of(AiProviderType.GROQ)
	);

	/**
	 * Seed defaults vào DB khi khởi động nếu bảng đang trống.
	 * Không overwrite config đã có — admin tự chỉnh sau.
	 */
	@PostConstruct
	public void seedDefaults() {
		if (aiFeatureConfigRepository.count() == 0) {
			log.info("[AI Config] No config found in DB — seeding defaults...");
			DEFAULTS.forEach((feature, providers) -> {
				String order = providers.stream()
						.map(Enum::name)
						.reduce((a, b) -> a + "," + b)
						.orElse("");
				aiFeatureConfigRepository.save(
						AiFeatureConfig.builder()
								.feature(feature)
								.providerOrder(order)
								.build()
				);
			});
			log.info("[AI Config] Seeded {} feature configs", DEFAULTS.size());
		}
	}

	/**
	 * Kiểm tra feature có đang được bật không.
	 * Đọc từ DB mỗi lần gọi — đảm bảo nhận config mới nhất ngay sau khi admin toggle.
	 * Nếu không có row trong DB → mặc định cho phép (true).
	 */
	public boolean isFeatureEnabled(AiFeature feature) {
		return aiFeatureConfigRepository.findById(feature)
				.map(AiFeatureConfig::isEnabled)
				.orElseGet(() -> {
					log.warn("[AI Config] No config for feature={}, defaulting enabled=true", feature);
					return true;
				});
	}

	/**
	 * Lấy thứ tự provider cho một feature.
	 * Đọc từ DB mỗi lần gọi — đảm bảo luôn nhận config mới nhất sau khi admin update.
	 */
	public List<AiProviderType> getProviderOrder(AiFeature feature) {
		return aiFeatureConfigRepository.findById(feature)
				.map(cfg -> Arrays.stream(cfg.getProviderOrder().split(","))
						.map(String::trim)
						.filter(s -> !s.isBlank())
						.map(AiProviderType::valueOf)
						.toList())
				.orElseGet(() -> {
					log.warn("[AI Config] No config for feature={}, using default", feature);
					return DEFAULTS.getOrDefault(feature, List.of(AiProviderType.GROQ));
				});
	}
}