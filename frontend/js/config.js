// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8083',
    ENDPOINTS: {
        // Auth endpoints
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        ME: '/api/auth/me',
        CHECK_USERNAME: '/api/auth/check-username',
        CHECK_EMAIL: '/api/auth/check-email',
        
        // Product endpoints
        PRODUCTS: '/api/products',
        PRODUCTS_ALL: '/api/products/all',
        PRODUCTS_SEARCH: '/api/products/search',
        PRODUCTS_CATEGORY: '/api/products/category',
        PRODUCTS_AVAILABLE: '/api/products/available',
        
        // Cart endpoints
        CART: '/api/cart',
        CART_USER: '/api/cart/user',
        CART_ADD: '/add',
        CART_UPDATE: '/update',
        CART_REMOVE: '/remove',
        CART_CLEAR: '/clear',
        
        // Order endpoints
        ORDERS: '/api/orders',
        ORDERS_CREATE: '/api/orders/create',
        ORDERS_USER: '/api/orders/user',
        ORDERS_STATUS: '/api/orders/status'
    }
};

// App Configuration
const APP_CONFIG = {
    TOKEN_KEY: 'adaptnxt_token',
    USER_KEY: 'adaptnxt_user',
    CART_KEY: 'adaptnxt_cart',
    PAGINATION: {
        DEFAULT_SIZE: 10,
        DEFAULT_PAGE: 0
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, APP_CONFIG };
}
