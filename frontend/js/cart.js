// Cart module
const Cart = {
    cartItems: [],
    cartTotal: 0,

    // Initialize cart
    async init() {
        try {
            await this.loadCart();
        } catch (error) {
            this.showError('Failed to load cart');
        }
    },

    // Load cart from server
    async loadCart() {
        try {
            this.showLoading();
            
            const user = Auth.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            console.log('🛒 Loading cart for user:', user.id);
            
            // Try the direct approach first
            const baseUrl = `${API.baseURL}/api/cart/user/${user.id}`;
            console.log('🔗 Cart URL:', baseUrl);
            
            const headers = API.getHeaders(true, null);
            console.log('📋 Headers:', headers);
            
            const response = await fetch(baseUrl, {
                method: 'GET',
                headers: headers
            });
            
            console.log('📡 Cart response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const cart = await response.json();
            console.log('📦 Cart response:', cart);
            
            // Handle cart items - they might be directly in cart or in a cartItems property
            this.cartItems = cart.cartItems || cart.items || [];
            console.log('🛍️ Cart items:', this.cartItems);
            
            // Calculate total from cart items
            this.cartTotal = this.cartItems.reduce((total, item) => {
                if (item.product && item.product.price && item.quantity) {
                    return total + (item.product.price * item.quantity);
                }
                console.warn('⚠️ Invalid cart item:', item);
                return total;
            }, 0);
            
            console.log('💰 Cart total:', this.cartTotal);
            
            this.renderCart();
            this.updateCartCount();
            this.hideLoading();
        } catch (error) {
            console.error('❌ Error loading cart:', error);
            this.showError('Failed to load cart: ' + error.message);
        }
    },

    // Add item to cart
    async addItem(productId, quantity = 1) {
        try {
            console.log('🛒 Adding item to cart:', { productId, quantity });
            
            // Get current user
            const user = Auth.getCurrentUser();
            if (!user || !user.id) {
                throw new Error('User not authenticated or missing ID');
            }
            
            console.log('👤 User:', user);
            
            // Build the URL with query parameters
            const baseUrl = `${API.baseURL}/api/cart/user/${user.id}/add`;
            const url = `${baseUrl}?productId=${productId}&quantity=${quantity}`;
            
            console.log('🔗 Request URL:', url);
            
            // Get headers with authentication
            const headers = API.getHeaders(true, null);
            console.log('📋 Headers:', headers);
            
            // Make the request using fetch directly
            const response = await fetch(url, {
                method: 'POST',
                headers: headers
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Add to cart success:', result);
            
            // Reload cart and show success message
            await this.loadCart();
            this.showSuccess('Item added to cart successfully!');
            
        } catch (error) {
            console.error('❌ Error adding item to cart:', error);
            this.showError('Failed to add item to cart: ' + error.message);
        }
    },

    // Update item quantity
    async updateItemQuantity(cartItemId, quantity) {
        try {
            if (quantity <= 0) {
                await this.removeItem(cartItemId);
                return;
            }

            const response = await API.put(`/api/cart/item/${cartItemId}?quantity=${quantity}`);
            
            if (response) {
                await this.loadCart();
            }
        } catch (error) {
            console.error('Error updating cart item:', error);
            this.showError('Failed to update cart');
        }
    },

    // Remove item from cart
    async removeItem(cartItemId) {
        try {
            const response = await API.delete(`/api/cart/item/${cartItemId}`);
            
            if (response) {
                await this.loadCart();
                this.showSuccess('Item removed from cart');
            }
        } catch (error) {
            console.error('Error removing cart item:', error);
            this.showError('Failed to remove item from cart');
        }
    },

    // Clear entire cart
    async clearCart() {
        try {
            const user = Auth.getCurrentUser();
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            const response = await API.delete(`/api/cart/user/${user.id}/clear`);
            
            if (response) {
                this.cartItems = [];
                this.cartTotal = 0;
                this.renderCart();
                this.updateCartCount();
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            this.showError('Failed to clear cart');
        }
    },

    // Render cart items
    renderCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const emptyCart = document.getElementById('emptyCart');

        // Check if elements exist (defensive programming)
        if (!cartItemsContainer || !cartSummary || !emptyCart) {
            console.warn('⚠️ Cart DOM elements not found - cart page may not be loaded');
            return;
        }

        if (!this.cartItems || this.cartItems.length === 0) {
            cartItemsContainer.innerHTML = '';
            cartSummary.style.display = 'none';
            emptyCart.style.display = 'block';
            return;
        }

        emptyCart.style.display = 'none';
        cartSummary.style.display = 'block';

        cartItemsContainer.innerHTML = this.cartItems.map(item => `
            <div class="cart-item">
                <div class="item-image">
                    <img src="${item.product.imageUrl || '/frontend/assets/images/product-placeholder.png'}" 
                         alt="${item.product.name}"
                         onerror="this.src='/frontend/assets/images/product-placeholder.png'">
                </div>
                <div class="item-details">
                    <h4>${item.product.name}</h4>
                    <p class="item-category">${item.product.category}</p>
                    <p class="item-price">$${item.product.price.toFixed(2)} each</p>
                </div>
                <div class="item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <div class="item-total">
                    <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-danger" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `).join('');

        this.updateCartSummary();
    },

    // Update cart summary
    updateCartSummary() {
        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const tax = subtotal * 0.1; // 10% tax
        const total = subtotal + tax;

        // Check if summary elements exist (only on cart page)
        const subtotalElement = document.getElementById('subtotal');
        const taxElement = document.getElementById('tax');
        const totalElement = document.getElementById('total');

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
    },

    // Update cart count in navigation
    updateCartCount() {
        const cartCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('#cartCount');
        cartCountElements.forEach(element => {
            element.textContent = cartCount;
        });
    },

    // Get cart total
    getCartTotal() {
        const subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        return subtotal + tax;
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
        // Create a temporary success message
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

// Global functions for cart operations (called from HTML)
window.addToCart = function(productId) {
    console.log('🛒 Global addToCart called with productId:', productId);
    
    if (!Cart) {
        console.error('❌ Cart module not available');
        return;
    }
    
    Cart.addItem(productId, 1);
};

window.updateQuantity = function(cartItemId, newQuantity) {
    Cart.updateItemQuantity(cartItemId, newQuantity);
};

window.removeFromCart = function(cartItemId) {
    Cart.removeItem(cartItemId);
};
