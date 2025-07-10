package com.example.adaptnxt.repository;

import com.example.adaptnxt.models.Order;
import com.example.adaptnxt.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByUser(User user);
    
    List<Order> findByUserId(Long userId);
    
    Page<Order> findByUserId(Long userId, Pageable pageable);
    
    List<Order> findByUserOrderByOrderDateDesc(User user);
    
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    
    List<Order> findByOrderStatus(Order.OrderStatus orderStatus);
    
    Page<Order> findByOrderStatus(Order.OrderStatus orderStatus, Pageable pageable);
}
