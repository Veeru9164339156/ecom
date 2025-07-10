// Authentication module
const Auth = {
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('jwt_token');
        return token !== null && token !== '';
    },

    // Get current user from localStorage
    getCurrentUser() {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Login function
    async login(username, password) {
        try {
            console.log('🔐 Attempting login with username:', username);
            
            const response = await API.postPublic('/api/auth/login', {
                username,
                password
            });

            console.log('✅ Login response received:', response);

            if (response && response.token) {
                // Store token and user info
                localStorage.setItem('jwt_token', response.token);
                
                // Create user object from response data
                const user = {
                    id: response.id,
                    username: response.username,
                    email: response.email,
                    role: response.role,
                    firstName: response.username, // Use username as display name since backend doesn't provide firstName
                    lastName: ''
                };
                
                console.log('👤 Storing user data:', user);
                localStorage.setItem('current_user', JSON.stringify(user));
                return true;
            } else {
                console.error('❌ No token in response:', response);
                return false;
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            throw error;
        }
    },

    // Register function
    async register(userData) {
        try {
            console.log('📝 Attempting registration with data:', userData);
            
            const response = await API.postPublic('/api/auth/register', userData);
            
            console.log('✅ Registration response received:', response);
            
            return response && response.message === 'User registered successfully!';
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    },

    // Logout function
    logout() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');
    },

    // Get authorization header
    getAuthHeader() {
        const token = localStorage.getItem('jwt_token');
        return token ? `Bearer ${token}` : null;
    },

    // Check if user has admin role
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'ADMIN';
    },

    // Redirect if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/frontend/pages/login.html';
            return false;
        }
        return true;
    },

    // Redirect if not admin
    requireAdmin() {
        if (!this.requireAuth()) return false;
        
        if (!this.isAdmin()) {
            window.location.href = '/frontend/pages/products.html';
            return false;
        }
        return true;
    }
};
