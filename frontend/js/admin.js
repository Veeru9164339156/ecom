// Admin module
const Admin = {
    currentProduct: null,
    products: [],
    orders: [],
    users: [],

    // Initialize admin dashboard
    async init() {
        // Check user role first
        const user = Auth.getCurrentUser();
        console.log('🔍 Current user:', user);
        console.log('🔍 User role:', user ? user.role : 'No user');
        console.log('🔍 JWT token:', localStorage.getItem('jwt_token') ? 'Present' : 'Missing');
        
        if (!user || user.role !== 'ADMIN') {
            console.error('❌ User is not admin! Role:', user ? user.role : 'No user');
            alert('Access denied! You need admin privileges.');
            window.location.href = '../index.html';
            return;
        }
        
        // Load products tab by default
        await this.loadTabData('products');
    },

    // Load data for specific tab
    async loadTabData(tabName) {
        switch (tabName) {
            case 'products':
                await this.loadProducts();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'users':
                await this.loadUsers();
                break;
        }
    },

    // Load all products for admin
    async loadProducts() {
        try {
            this.showLoading('products');
            
            const response = await API.get('/api/products/all');
            this.products = response || [];
            
            this.renderProductsTable();
            this.hideLoading('products');
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('products', 'Failed to load products');
        }
    },

    // Load all orders for admin
    async loadOrders() {
        try {
            this.showLoading('orders');
            
            const response = await API.get('/api/orders');
            this.orders = response || [];
            
            this.renderOrdersTable();
            this.hideLoading('orders');
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showError('orders', 'Failed to load orders');
        }
    },

    // Load all users for admin
    async loadUsers() {
        try {
            this.showLoading('users');
            
            const response = await API.get('/api/users');
            this.users = response || [];
            
            this.renderUsersTable();
            this.hideLoading('users');
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('users', 'Failed to load users');
        }
    },

    // Render products table
    renderProductsTable() {
        const table = document.getElementById('productsTable');
        
        if (!this.products || this.products.length === 0) {
            table.innerHTML = '<div class="no-data">No products found</div>';
            return;
        }

        table.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.products.map(product => `
                        <tr>
                            <td>${product.id}</td>
                            <td>${product.name}</td>
                            <td>${product.category}</td>
                            <td>$${product.price.toFixed(2)}</td>
                            <td>${product.stock}</td>
                            <td class="actions">
                                <button class="btn btn-small btn-secondary" onclick="editProduct(${product.id})">
                                    Edit
                                </button>
                                <button class="btn btn-small btn-danger" onclick="deleteProduct(${product.id})">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // Render orders table
    renderOrdersTable() {
        const table = document.getElementById('ordersTable');
        
        if (!this.orders || this.orders.length === 0) {
            table.innerHTML = '<div class="no-data">No orders found</div>';
            return;
        }

        table.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.orders.map(order => `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${order.user ? order.user.firstName + ' ' + order.user.lastName : 'Unknown User'}</td>
                            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                            <td>$${order.totalAmount.toFixed(2)}</td>
                            <td>
                                <select onchange="updateOrderStatus(${order.id}, this.value)" 
                                        class="status-select">
                                    <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                                    <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                                    <option value="SHIPPED" ${order.status === 'SHIPPED' ? 'selected' : ''}>Shipped</option>
                                    <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                                    <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                            <td class="actions">
                                <button class="btn btn-small btn-secondary" onclick="viewOrderDetails(${order.id})">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // Render users table
    renderUsersTable() {
        const table = document.getElementById('usersTable');
        
        if (!this.users || this.users.length === 0) {
            table.innerHTML = '<div class="no-data">No users found</div>';
            return;
        }

        table.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    // Show product modal for add/edit
    showProductModal(product = null) {
        this.currentProduct = product;
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('productForm');

        if (product) {
            title.textContent = 'Edit Product';
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productImage').value = product.imageUrl || '';
        } else {
            title.textContent = 'Add Product';
            form.reset();
        }

        modal.style.display = 'block';
    },

    // Save product (add or update)
    async saveProduct() {
        console.log('💾 Save Product clicked!');
        
        const productData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value),
            imageUrl: document.getElementById('productImage').value
        };

        console.log('📦 Product data to save:', productData);

        try {
            let response;
            if (this.currentProduct) {
                // Update existing product
                console.log('🔄 Updating existing product:', this.currentProduct.id);
                response = await API.put(`/api/products/${this.currentProduct.id}`, productData);
            } else {
                // Create new product
                console.log('➕ Creating new product');
                response = await API.post('/api/products', productData);
            }

            console.log('✅ Product save response:', response);

            if (response && response.id) {
                document.getElementById('productModal').style.display = 'none';
                await this.loadProducts();
                this.showSuccess('Product saved successfully');
            } else {
                console.error('❌ No ID in response:', response);
                this.showError('products', 'Failed to save product - Invalid response');
            }
        } catch (error) {
            console.error('❌ Error saving product:', error);
            this.showError('products', 'Failed to save product: ' + error.message);
        }
    },

    // Edit product
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    },

    // Delete product
    async deleteProduct(productId) {
        try {
            const response = await API.delete(`/api/products/${productId}`);
            
            if (response.message === 'Product deleted successfully') {
                await this.loadProducts();
                this.showSuccess('Product deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showError('products', 'Failed to delete product');
        }
    },

    // View order details
    async viewOrderDetails(orderId) {
        try {
            console.log('Fetching order details for order ID:', orderId);
            const response = await API.get(`/api/orders/${orderId}`);
            console.log('Order details response:', response);
            const order = response;
            
            const orderDetailsContent = document.getElementById('orderDetailsContent');
            orderDetailsContent.innerHTML = `
                <div class="order-detail-header">
                    <h4>Order #${order.id}</h4>
                    <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
                <div class="order-detail-info">
                    <div class="detail-section">
                        <h5>Customer Information</h5>
                        <p><strong>Name:</strong> ${order.user.firstName} ${order.user.lastName}</p>
                        <p><strong>Email:</strong> ${order.user.email}</p>
                    </div>
                    <div class="detail-section">
                        <h5>Order Information</h5>
                        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                        <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
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
                                        <p>Price: $${(item.price || item.priceAtTime).toFixed(2)}</p>
                                        <p>Quantity: ${item.quantity}</p>
                                        <p><strong>Subtotal: $${((item.price || item.priceAtTime) * item.quantity).toFixed(2)}</strong></p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('orderDetailsModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading order details:', error);
            this.showError('orders', 'Failed to load order details');
        }
    },

    // Update order status
    async updateOrderStatus(orderId, status) {
        try {
            console.log('Updating order status:', orderId, 'to', status);
            const response = await API.put(`/api/orders/${orderId}/status?status=${status}`);
            console.log('Update status response:', response);
            
            if (response && (response.message === 'Order status updated' || response.message)) {
                await this.loadOrders();
                this.showSuccess('Order status updated successfully');
            } else {
                this.showError('orders', 'Unexpected response format');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            this.showError('orders', 'Failed to update order status: ' + (error.message || 'Unknown error'));
        }
    },

    // Toggle user status
    async toggleUserStatus(userId, currentStatus) {
        try {
            // TODO: Backend doesn't have this endpoint yet
            // const response = await API.put(`/api/users/${userId}/toggle-status`);
            
            this.showError('users', 'User status toggle not implemented yet');
            return;
            
            if (response.message) {
                await this.loadUsers();
                this.showSuccess('User status updated successfully');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showError('users', 'Failed to update user status');
        }
    },

    // Filter orders by status
    filterOrders(status) {
        if (!status) {
            this.renderOrdersTable();
            return;
        }

        const filteredOrders = this.orders.filter(order => order.status === status);
        const originalOrders = this.orders;
        this.orders = filteredOrders;
        this.renderOrdersTable();
        this.orders = originalOrders;
    },

    // Show loading state
    showLoading(tab) {
        const loadingMessage = document.getElementById(`${tab}LoadingMessage`);
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
        }
        
        const errorMessage = document.getElementById(`${tab}ErrorMessage`);
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    },

    // Hide loading state
    hideLoading(tab) {
        const loadingMessage = document.getElementById(`${tab}LoadingMessage`);
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    },

    // Show error message
    showError(tab, message) {
        this.hideLoading(tab);
        const errorMessage = document.getElementById(`${tab}ErrorMessage`);
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
