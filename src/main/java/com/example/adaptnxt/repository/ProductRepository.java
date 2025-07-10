package com.example.adaptnxt.repository;

import com.example.adaptnxt.models.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // Find products by category
    Page<Product> findByCategory(String category, Pageable pageable);
    
    // Search products by name (case-insensitive)
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    // Search products by name or category
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(p.category) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Product> searchByNameOrCategory(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    // Find products with stock greater than 0
    Page<Product> findByStockGreaterThan(Integer stock, Pageable pageable);
    
    // Find all products ordered by name
    List<Product> findAllByOrderByNameAsc();
}
