package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Tag;

@Repository
public interface TagRepository extends JpaRepository<Tag, Integer> {
	boolean existsByName(String name);
}