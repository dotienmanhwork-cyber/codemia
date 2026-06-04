package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.codemia.api.entity.Notification;
import vn.codemia.api.entity.User;

import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
	List<Notification> findByUserOrderByCreatedAtDesc(User user);
	List<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
	long countByUserAndIsReadFalse(User user);
}