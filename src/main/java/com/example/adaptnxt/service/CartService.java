package com.example.adaptnxt.service;

import com.example.adaptnxt.models.Cart;
import com.example.adaptnxt.models.CartItem;
import com.example.adaptnxt.models.Product;
import com.example.adaptnxt.models.User;
import com.example.adaptnxt.repository.CartRepository;
import com.example.adaptnxt.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductService productService;

    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> {
                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepository.save(cart);
                });
    }

    public Optional<Cart> getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    public List<CartItem> getCartItems(Long cartId) {
        return cartItemRepository.findByCartId(cartId);
    }

    public CartItem addItemToCart(Long userId, Long productId, Integer quantity) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    User user = new User();
                    user.setId(userId);
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });

        Product product = productService.getProductById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        // Check if product is available
        if (!productService.isProductAvailable(productId, quantity)) {
            throw new RuntimeException("Insufficient stock for product: " + product.getName());
        }

        // Check if item already exists in cart
        Optional<CartItem> existingItem = cartItemRepository.findByCartAndProduct(cart, product);
        
        if (existingItem.isPresent()) {
            // Update existing item
            CartItem cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
            return cartItemRepository.save(cartItem);
        } else {
            // Create new cart item
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setQuantity(quantity);
            cartItem.setPriceAtTime(product.getPrice());
            return cartItemRepository.save(cartItem);
        }
    }

    public CartItem updateCartItem(Long cartItemId, Integer quantity) {
        return cartItemRepository.findById(cartItemId)
                .map(cartItem -> {
                    if (quantity <= 0) {
                        cartItemRepository.delete(cartItem);
                        return null;
                    }
                    
                    // Check if sufficient stock is available
                    if (!productService.isProductAvailable(cartItem.getProduct().getId(), quantity)) {
                        throw new RuntimeException("Insufficient stock for product: " + cartItem.getProduct().getName());
                    }
                    
                    cartItem.setQuantity(quantity);
                    return cartItemRepository.save(cartItem);
                })
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));
    }

    public void removeItemFromCart(Long cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId)
                .ifPresent(cart -> cartItemRepository.deleteByCart(cart));
    }

    public BigDecimal calculateCartTotal(Long cartId) {
        List<CartItem> cartItems = cartItemRepository.findByCartId(cartId);
        return cartItems.stream()
                .map(item -> item.getPriceAtTime().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean isCartEmpty(Long cartId) {
        return cartItemRepository.findByCartId(cartId).isEmpty();
    }
}
