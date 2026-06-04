package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.codemia.api.entity.RoleChangeLog;

import java.util.List;

public interface RoleChangeLogRepository extends JpaRepository<RoleChangeLog, String> {

	// lấy toàn bộ log của 1 user, mới nhất trước
	List<RoleChangeLog> findByUserIdOrderByChangedAtDesc(String userId);
}