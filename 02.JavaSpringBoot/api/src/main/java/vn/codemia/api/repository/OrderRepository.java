package vn.codemia.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.codemia.api.entity.Order;

public interface OrderRepository extends JpaRepository<Order, String> {
}