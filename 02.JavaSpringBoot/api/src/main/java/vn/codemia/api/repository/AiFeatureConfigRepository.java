package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.AiFeatureConfig;
import vn.codemia.api.enums.AiFeature;

@Repository
public interface AiFeatureConfigRepository extends JpaRepository<AiFeatureConfig, AiFeature> {
	// findById(AiFeature) dùng AiFeature làm PK — đã đủ từ JpaRepository
}