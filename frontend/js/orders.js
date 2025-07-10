// Orders module
const Orders = {
    orders: [],

    // Initialize orders page
    async init() {
        try {
            await this.loadOrders();
        } catch (error) {
            this.showError('Failed to load orders');
        }
    },

    // Load user orders
    async loadOrders() {
        try {
            this.showLoading();
            
            const user = Auth.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            console.log('Loading orders for user:', user.id);
            const response = await API.get(`/api/orders/user/${user.id}`);
            console.log('Orders API response:', response);
            this.orders = response || [];
            
            this.renderOrders();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading orders:', error);
            console.error('Error details:', error.message, error.status);
            this.showError('Failed to load orders: ' + (error.message || 'Unknown error'));
        }
    },

    // Create new order
    async createOrder(orderData) {
        try {
            const user = Auth.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Use the correct endpoint format: /api/orders/user/{userId}/create
            const response = await API.post(`/api/orders/user/${user.id}/create?shippingAddress=${encodeURIComponent(orderData.shippingAddress)}`, {});
            
            if (response && (response.id || response.orderId)) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    // Render orders list
    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        const emptyOrders = document.getElementById('emptyOrders');

        if (!this.orders || this.orders.length === 0) {
            ordersList.innerHTML = '';
            emptyOrders.style.display = 'block';
            return;
        }

        emptyOrders.style.display = 'none';

        ordersList.innerHTML = this.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Order #${order.id}</h3>
                        <p class="order-date">${new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                    </div>
                </div>
                <div class="order-details">
                    <div class="order-summary">
                        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        <p><strong>Shipping Address:</strong> ${order.shippingAddress}</p>
                    </div>
                    <div class="order-items-preview">
                        <p><strong>Items:</strong> ${order.orderItems ? order.orderItems.length : 0} item(s)</p>
                        ${order.orderItems && order.orderItems.length > 0 ? 
                            order.orderItems.slice(0, 2).map(item => 
                                `<span class="item-preview">${item.product.name} (${item.quantity})</span>`
                            ).join(', ') + (order.orderItems.length > 2 ? '...' : '')
                            : ''
                        }
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-secondary" onclick="viewOrderDetails(${order.id})">
                        View Details
                    </button>
                    ${order.status === 'PENDING' ? 
                        `<button class="btn btn-danger" onclick="cancelOrder(${order.id})">Cancel</button>` 
                        : ''
                    }
                </div>
            </div>
        `).join('');
    },

    // View order details
    async viewOrderDetails(orderId) {
        try {
            const response = await API.get(`/api/orders/${orderId}`);
            const order = response;
            
            const orderDetailsContent = document.getElementById('orderDetails');
            orderDetailsContent.innerHTML = `
                <div class="order-detail-header">
                    <h4>Order #${order.id}</h4>
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-detail-info">
                    <div class="detail-section">
                        <h5>Order Information</h5>
                        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                    </div>
                    <div class="detail-section">
                        <h5>Shipping Information</h5>
                        <p>${order.shippingAddress}</p>
                    </div>
                    <div class="detail-section">
                        <h5>Order Items</h5>
                        <div class="order-items-detail">
                            ${order.orderItems.map(item => `
                                <div class="order-item-detail">
                                    <div class="item-info">
                                        <h6>${item.product.name}</h6>
                                        <p>${item.product.description}</p>
                                    </div>
                                    <div class="item-pricing">
                                        <p>Price: $${item.price.toFixed(2)}</p>
                                        <p>Quantity: ${item.quantity}</p>
                                        <p><strong>Subtotal: $${(item.price * item.quantity).toFixed(2)}</strong></p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('orderModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('Failed to load order details');
        }
    },

    // Cancel order
    async cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            const response = await API.put(`/api/orders/${orderId}/cancel`);
            
            if (response && (response.id || response.status === 'CANCELLED')) {
                await this.loadOrders();
                this.showSuccess('Order cancelled successfully');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            this.showError('Failed to cancel order');
        }
    },

    // Show loading state
    showLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
        }
        
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    },

    // Hide loading state
    hideLoading() {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    },

    // Show error message
    showError(message) {
        this.hideLoading();
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        }
    },

    // Show success message
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
    }
};

// Global function for canceling orders
window.cancelOrder = function(orderId) {
    Orders.cancelOrder(orderId);
};

// Global function for viewing order details
window.viewOrderDetails = function(orderId) {
    Orders.viewOrderDetails(orderId);
};
