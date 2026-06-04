package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Category;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {
	boolean existsByName(String name);
	Optional<Category> findBySlug(String slug);

	// Lấy tất cả danh mục gốc (không có cha)
	List<Category> findByParentIsNull();
}