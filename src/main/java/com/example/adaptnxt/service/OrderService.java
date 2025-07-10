package com.example.adaptnxt.service;

import com.example.adaptnxt.models.Cart;
import com.example.adaptnxt.models.CartItem;
import com.example.adaptnxt.models.Order;
import com.example.adaptnxt.models.OrderItem;
import com.example.adaptnxt.models.User;
import com.example.adaptnxt.repository.OrderRepository;
import com.example.adaptnxt.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private ProductService productService;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Page<Order> getAllOrdersPaged(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    public Page<Order> getOrdersByUserIdPaged(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable);
    }

    public List<Order> getOrdersByStatus(Order.OrderStatus status) {
        return orderRepository.findByOrderStatus(status);
    }

    public Page<Order> getOrdersByStatusPaged(Order.OrderStatus status, Pageable pageable) {
        return orderRepository.findByOrderStatus(status, pageable);
    }

    public Order createOrderFromCart(Long userId, String shippingAddress) {
        // Get user's cart
        Cart cart = cartService.getCartByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        // Get cart items
        List<CartItem> cartItems = cartService.getCartItems(cart.getId());
        
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cannot create order from empty cart");
        }

        // Validate stock availability for all items
        for (CartItem item : cartItems) {
            if (!productService.isProductAvailable(item.getProduct().getId(), item.getQuantity())) {
                throw new RuntimeException("Insufficient stock for product: " + item.getProduct().getName());
            }
        }

        // Calculate total amount
        BigDecimal totalAmount = cartService.calculateCartTotal(cart.getId());

        // Create order
        Order order = new Order();
        User user = new User();
        user.setId(userId);
        order.setUser(user);
        order.setTotalAmount(totalAmount);
        order.setOrderStatus(Order.OrderStatus.PENDING);
        order.setShippingAddress(shippingAddress);

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Create and save order items
        for (CartItem item : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setProduct(item.getProduct());
            orderItem.setQuantity(item.getQuantity());
            orderItem.setPriceAtTime(item.getProduct().getPrice());
            orderItemRepository.save(orderItem);
        }

        // Reduce stock for all products
        for (CartItem item : cartItems) {
            productService.reduceStock(item.getProduct().getId(), item.getQuantity());
        }

        // Clear cart after successful order
        cartService.clearCart(userId);

        return savedOrder;
    }

    public Order updateOrderStatus(Long orderId, Order.OrderStatus status) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    order.setOrderStatus(status);
                    return orderRepository.save(order);
                })
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }

    public Order updateOrder(Long id, Order orderDetails) {
        return orderRepository.findById(id)
                .map(order -> {
                    order.setTotalAmount(orderDetails.getTotalAmount());
                    order.setOrderStatus(orderDetails.getOrderStatus());
                    order.setShippingAddress(orderDetails.getShippingAddress());
                    return orderRepository.save(order);
                })
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    public boolean canCancelOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .map(order -> order.getOrderStatus() == Order.OrderStatus.PENDING || 
                             order.getOrderStatus() == Order.OrderStatus.CONFIRMED)
                .orElse(false);
    }

    public Order cancelOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    if (canCancelOrder(orderId)) {
                        order.setOrderStatus(Order.OrderStatus.CANCELLED);
                        return orderRepository.save(order);
                    } else {
                        throw new RuntimeException("Cannot cancel order in current status: " + order.getOrderStatus());
                    }
                })
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
    }
}
