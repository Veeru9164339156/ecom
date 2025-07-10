package com.example.adaptnxt.repository;

import com.example.adaptnxt.models.Cart;
import com.example.adaptnxt.models.CartItem;
import com.example.adaptnxt.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByCart(Cart cart);
    
    List<CartItem> findByCartId(Long cartId);
    
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
    
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
    
    void deleteByCart(Cart cart);
    
    void deleteByCartId(Long cartId);
}
