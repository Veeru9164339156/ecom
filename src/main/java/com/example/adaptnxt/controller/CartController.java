package com.example.adaptnxt.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.adaptnxt.models.Cart;
import com.example.adaptnxt.models.CartItem;
import com.example.adaptnxt.models.User;
import com.example.adaptnxt.service.CartService;
import com.example.adaptnxt.service.UserService;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private CartService cartService;
    
    @Autowired
    private UserService userService;

    // TEST ENDPOINT - NO SECURITY
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Cart controller is working!");
    }

    // TEST USER ENDPOINT - NO SECURITY
    @GetMapping("/user/{userId}/test")
    public ResponseEntity<String> testUserEndpoint(@PathVariable Long userId) {
        return ResponseEntity.ok("User " + userId + " endpoint is working!");
    }

    // Get or create cart for user
    @GetMapping("/user/{userId}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> getOrCreateCart(@PathVariable Long userId) {
        try {
            User user = new User();
            user.setId(userId);
            Cart cart = cartService.getOrCreateCart(user);
            
            // Create a simple response object to avoid JSON serialization issues
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", cart.getId());
            response.put("createdAt", cart.getCreatedAt());
            response.put("updatedAt", cart.getUpdatedAt());
            
            // Manually build cartItems array to avoid circular reference
            java.util.List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
            if (cart.getCartItems() != null) {
                for (CartItem item : cart.getCartItems()) {
                    java.util.Map<String, Object> itemMap = new java.util.HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("priceAtTime", item.getPriceAtTime());
                    
                    // Add product information safely
                    if (item.getProduct() != null) {
                        java.util.Map<String, Object> productMap = new java.util.HashMap<>();
                        productMap.put("id", item.getProduct().getId());
                        productMap.put("name", item.getProduct().getName());
                        productMap.put("price", item.getProduct().getPrice());
                        productMap.put("imageUrl", item.getProduct().getImageUrl());
                        itemMap.put("product", productMap);
                    }
                    
                    items.add(itemMap);
                }
            }
            response.put("cartItems", items);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    // Get cart by user ID
    @GetMapping("/user/{userId}/cart")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable Long userId) {
        Optional<Cart> cart = cartService.getCartByUserId(userId);
        return cart.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Get cart items
    @GetMapping("/{cartId}/items")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<List<CartItem>> getCartItems(@PathVariable Long cartId) {
        try {
            List<CartItem> cartItems = cartService.getCartItems(cartId);
            return ResponseEntity.ok(cartItems);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Add item to cart
    @PostMapping("/user/{userId}/add")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> addItemToCart(
            @PathVariable Long userId,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {
        try {
            CartItem cartItem = cartService.addItemToCart(userId, productId, quantity);
            
            // Return a simple response to avoid JSON serialization issues
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", cartItem.getId());
            response.put("quantity", cartItem.getQuantity());
            response.put("priceAtTime", cartItem.getPriceAtTime());
            response.put("message", "Item added to cart successfully");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not add item to cart!");
        }
    }

    // Update cart item quantity
    @PutMapping("/item/{cartItemId}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> updateCartItem(
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity) {
        try {
            CartItem updatedItem = cartService.updateCartItem(cartItemId, quantity);
            if (updatedItem == null) {
                return ResponseEntity.ok().body("Item removed from cart (quantity was 0 or less)");
            }
            
            // Return a simple response to avoid JSON serialization issues
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", updatedItem.getId());
            response.put("quantity", updatedItem.getQuantity());
            response.put("priceAtTime", updatedItem.getPriceAtTime());
            response.put("message", "Cart item updated successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not update cart item!");
        }
    }

    // Remove item from cart
    @DeleteMapping("/item/{cartItemId}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> removeItemFromCart(@PathVariable Long cartItemId) {
        try {
            cartService.removeItemFromCart(cartItemId);
            return ResponseEntity.ok().body("Item removed from cart successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not remove item from cart!");
        }
    }

    // Clear entire cart
    @DeleteMapping("/user/{userId}/clear")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> clearCart(@PathVariable Long userId) {
        try {
            cartService.clearCart(userId);
            return ResponseEntity.ok().body("Cart cleared successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not clear cart!");
        }
    }

    // Calculate cart total
    @GetMapping("/{cartId}/total")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<BigDecimal> calculateCartTotal(@PathVariable Long cartId) {
        try {
            BigDecimal total = cartService.calculateCartTotal(cartId);
            return ResponseEntity.ok(total);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Check if cart is empty
    @GetMapping("/{cartId}/empty")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<Boolean> isCartEmpty(@PathVariable Long cartId) {
        try {
            boolean isEmpty = cartService.isCartEmpty(cartId);
            return ResponseEntity.ok(isEmpty);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
