package com.example.adaptnxt.repository;

import com.example.adaptnxt.models.Cart;
import com.example.adaptnxt.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    
    Optional<Cart> findByUser(User user);
    
    Optional<Cart> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);
}
