// Centralized API Handler with Fetch
class APIService {
    constructor() {
        this.baseURL = window.API_CONFIG ? API_CONFIG.BASE_URL : 'http://localhost:8083';
    }

    // Get stored JWT token
    getToken() {
        return localStorage.getItem('jwt_token');
    }

    // Get default headers
    getHeaders(includeAuth = true, contentType = 'application/json') {
        const headers = {};
        
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        
        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    // Generic fetch wrapper
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: this.getHeaders(options.auth !== false),
            ...options
        };

        try {
            console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, defaultOptions);
            
            // Handle different response types
            let data = null;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new APIError(
                    data.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    data
                );
            }

            console.log(`✅ API Success: ${response.status}`, data);
            return data;

        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            
            console.error(`❌ API Error: ${url}`, error);
            throw new APIError('Network error or server unavailable', 0, error);
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const urlParams = new URLSearchParams(params);
        const queryString = urlParams.toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, body = null, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : null,
            ...options
        });
    }

    async put(endpoint, body = null, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : null,
            ...options
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    // Authentication helpers
    async postPublic(endpoint, body = null) {
        return this.post(endpoint, body, { auth: false });
    }
}

// Custom Error Class
class APIError extends Error {
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }

    isUnauthorized() {
        return this.status === 401;
    }

    isForbidden() {
        return this.status === 403;
    }

    isNotFound() {
        return this.status === 404;
    }

    isServerError() {
        return this.status >= 500;
    }
}

// Global API instance
const API = new APIService();

// Also create lowercase version for compatibility
const api = API;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIService, APIError, API, api };
}
