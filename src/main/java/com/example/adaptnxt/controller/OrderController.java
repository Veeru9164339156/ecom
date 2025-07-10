package com.example.adaptnxt.controller;

import com.example.adaptnxt.models.Order;
import com.example.adaptnxt.service.OrderService;
import com.example.adaptnxt.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private UserService userService;

    // Get all orders (Admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders() {
        try {
            List<Order> orders = orderService.getAllOrders();
            
            // Build response DTOs to avoid circular reference issues
            List<java.util.Map<String, Object>> response = new java.util.ArrayList<>();
            
            for (Order order : orders) {
                java.util.Map<String, Object> orderMap = new java.util.HashMap<>();
                orderMap.put("id", order.getId());
                orderMap.put("totalAmount", order.getTotalAmount());
                orderMap.put("status", order.getOrderStatus().toString());
                orderMap.put("orderDate", order.getOrderDate());
                orderMap.put("shippingAddress", order.getShippingAddress());
                
                // Add minimal user info
                if (order.getUser() != null) {
                    java.util.Map<String, Object> userMap = new java.util.HashMap<>();
                    userMap.put("id", order.getUser().getId());
                    userMap.put("username", order.getUser().getUsername());
                    userMap.put("email", order.getUser().getEmail());
                    // Use username as firstName/lastName fallback since User model doesn't have these fields
                    userMap.put("firstName", order.getUser().getUsername());
                    userMap.put("lastName", "");
                    orderMap.put("user", userMap);
                }
                
                // Add order items safely
                List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
                if (order.getOrderItems() != null) {
                    for (var item : order.getOrderItems()) {
                        java.util.Map<String, Object> itemMap = new java.util.HashMap<>();
                        itemMap.put("id", item.getId());
                        itemMap.put("quantity", item.getQuantity());
                        itemMap.put("price", item.getPriceAtTime());
                        
                        // Add product information safely
                        if (item.getProduct() != null) {
                            java.util.Map<String, Object> productMap = new java.util.HashMap<>();
                            productMap.put("id", item.getProduct().getId());
                            productMap.put("name", item.getProduct().getName());
                            productMap.put("description", item.getProduct().getDescription());
                            itemMap.put("product", productMap);
                        }
                        
                        items.add(itemMap);
                    }
                }
                orderMap.put("orderItems", items);
                
                response.add(orderMap);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error loading all orders: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not load orders!");
        }
    }

    // Get all orders with pagination (Admin only)
    @GetMapping("/paged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Order>> getAllOrdersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                Sort.by(sortBy).descending() : 
                Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Order> orders = orderService.getAllOrdersPaged(pageable);
        return ResponseEntity.ok(orders);
    }

    // Get order by ID
    @GetMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        try {
            Optional<Order> orderOpt = orderService.getOrderById(id);
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Order order = orderOpt.get();
            
            // Build response DTO to avoid circular reference issues
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", order.getId());
            response.put("totalAmount", order.getTotalAmount());
            response.put("status", order.getOrderStatus().toString());
            response.put("orderDate", order.getOrderDate());
            response.put("shippingAddress", order.getShippingAddress());
            response.put("paymentMethod", "CASH_ON_DELIVERY"); // Default payment method
            
            // Add user info
            if (order.getUser() != null) {
                java.util.Map<String, Object> userMap = new java.util.HashMap<>();
                userMap.put("id", order.getUser().getId());
                userMap.put("username", order.getUser().getUsername());
                userMap.put("email", order.getUser().getEmail());
                // Use username as firstName/lastName fallback since User model doesn't have these fields
                userMap.put("firstName", order.getUser().getUsername());
                userMap.put("lastName", "");
                response.put("user", userMap);
            }
            
            // Add order items safely
            List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
            if (order.getOrderItems() != null) {
                for (var item : order.getOrderItems()) {
                    java.util.Map<String, Object> itemMap = new java.util.HashMap<>();
                    itemMap.put("id", item.getId());
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("price", item.getPriceAtTime());
                    
                    // Add product information safely
                    if (item.getProduct() != null) {
                        java.util.Map<String, Object> productMap = new java.util.HashMap<>();
                        productMap.put("id", item.getProduct().getId());
                        productMap.put("name", item.getProduct().getName());
                        productMap.put("description", item.getProduct().getDescription());
                        itemMap.put("product", productMap);
                    }
                    
                    items.add(itemMap);
                }
            }
            response.put("orderItems", items);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error loading order " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not load order!");
        }
    }

    // Get orders by user ID
    @GetMapping("/user/{userId}")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> getOrdersByUserId(@PathVariable Long userId) {
        try {
            List<Order> orders = orderService.getOrdersByUserId(userId);
            
            // Build response DTOs to avoid circular reference issues
            List<java.util.Map<String, Object>> response = new java.util.ArrayList<>();
            
            for (Order order : orders) {
                java.util.Map<String, Object> orderMap = new java.util.HashMap<>();
                orderMap.put("id", order.getId());
                orderMap.put("totalAmount", order.getTotalAmount());
                orderMap.put("status", order.getOrderStatus().toString());
                orderMap.put("orderDate", order.getOrderDate());
                orderMap.put("shippingAddress", order.getShippingAddress());
                
                // Add order items safely
                List<java.util.Map<String, Object>> items = new java.util.ArrayList<>();
                if (order.getOrderItems() != null) {
                    for (var item : order.getOrderItems()) {
                        java.util.Map<String, Object> itemMap = new java.util.HashMap<>();
                        itemMap.put("id", item.getId());
                        itemMap.put("quantity", item.getQuantity());
                        itemMap.put("price", item.getPriceAtTime());
                        
                        // Add product information safely
                        if (item.getProduct() != null) {
                            java.util.Map<String, Object> productMap = new java.util.HashMap<>();
                            productMap.put("id", item.getProduct().getId());
                            productMap.put("name", item.getProduct().getName());
                            productMap.put("description", item.getProduct().getDescription());
                            itemMap.put("product", productMap);
                        }
                        
                        items.add(itemMap);
                    }
                }
                orderMap.put("orderItems", items);
                
                response.add(orderMap);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error loading orders for user " + userId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not load orders!");
        }
    }

    // Get orders by user ID with pagination
    @GetMapping("/user/{userId}/paged")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<Page<Order>> getOrdersByUserIdPaged(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orders = orderService.getOrdersByUserIdPaged(userId, pageable);
        return ResponseEntity.ok(orders);
    }

    // Get orders by status
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable Order.OrderStatus status) {
        List<Order> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }

    // Get orders by status with pagination
    @GetMapping("/status/{status}/paged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Order>> getOrdersByStatusPaged(
            @PathVariable Order.OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Order> orders = orderService.getOrdersByStatusPaged(status, pageable);
        return ResponseEntity.ok(orders);
    }

    // Create order from cart
    @PostMapping("/user/{userId}/create")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrderFromCart(
            @PathVariable Long userId,
            @RequestParam String shippingAddress) {
        try {
            System.out.println("Creating order for user: " + userId + " with address: " + shippingAddress);
            Order order = orderService.createOrderFromCart(userId, shippingAddress);
            System.out.println("Order created successfully: " + order.getId());
            
            // Return a simple response DTO to avoid JSON serialization issues
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", order.getId());
            response.put("totalAmount", order.getTotalAmount());
            response.put("status", order.getOrderStatus().toString());
            response.put("orderDate", order.getOrderDate());
            response.put("shippingAddress", order.getShippingAddress());
            response.put("message", "Order created successfully");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            System.err.println("Runtime error creating order: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("General error creating order: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not create order!");
        }
    }

    // Update order status (Admin only)
    @PutMapping("/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam Order.OrderStatus status) {
        try {
            Order updatedOrder = orderService.updateOrderStatus(orderId, status);
            
            // Return the expected message format for admin.js
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("message", "Order status updated");
            response.put("orderId", orderId);
            response.put("newStatus", status.toString());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not update order status!");
        }
    }

    // Update order details (Admin only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrder(@PathVariable Long id, @RequestBody Order orderDetails) {
        try {
            Order updatedOrder = orderService.updateOrder(id, orderDetails);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not update order!");
        }
    }

    // Delete order (Admin only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        try {
            orderService.deleteOrder(id);
            return ResponseEntity.ok().body("Order deleted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not delete order!");
        }
    }

    // Check if order can be cancelled
    @GetMapping("/{orderId}/can-cancel")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<Boolean> canCancelOrder(@PathVariable Long orderId) {
        try {
            boolean canCancel = orderService.canCancelOrder(orderId);
            return ResponseEntity.ok(canCancel);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Cancel order
    @PutMapping("/{orderId}/cancel")
    // @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId) {
        try {
            Order cancelledOrder = orderService.cancelOrder(orderId);
            return ResponseEntity.ok(cancelledOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: Could not cancel order!");
        }
    }
}
