// Products module
const Products = {
    currentPage: 0,
    pageSize: 12,
    totalPages: 0,
    currentSearch: '',
    currentCategory: '',
    currentSort: 'name',
    products: [],

    // Initialize products page
    async init() {
        try {
            await this.loadProducts();
            await this.loadCategories();
        } catch (error) {
            this.showError('Failed to load products');
        }
    },

    // Load products with pagination
    async loadProducts(page = 0) {
        try {
            this.showLoading();
            
            let endpoint = '/api/products';
            const params = new URLSearchParams({
                page: page,
                size: this.pageSize
            });

            // Determine which endpoint to use based on filters
            if (this.currentSearch) {
                // Use search endpoint
                endpoint = '/api/products/search/general';
                params.append('searchTerm', this.currentSearch);
            } else if (this.currentCategory) {
                // Use category endpoint
                endpoint = `/api/products/category/${this.currentCategory}`;
            } else {
                // Use regular pagination endpoint
                params.append('sortBy', this.currentSort);
                params.append('sortDir', 'asc');
            }

            const response = await API.get(`${endpoint}?${params}`);
            
            this.products = response.content || [];
            this.currentPage = response.number || 0;
            this.totalPages = response.totalPages || 0;
            
            this.renderProducts();
            this.updatePagination();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products');
        }
    },

    // Load categories for filter dropdown
    async loadCategories() {
        try {
            // Get unique categories from all products
            const allProducts = await API.get('/api/products/all');
            const categories = [...new Set(allProducts.map(p => p.category))];
            
            const categorySelect = document.getElementById('categoryFilter');
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    },

    // Render products grid
    renderProducts() {
        const grid = document.getElementById('productsGrid');
        
        if (!this.products || this.products.length === 0) {
            grid.innerHTML = '<div class="no-products">No products found</div>';
            return;
        }

        grid.innerHTML = this.products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.imageUrl || '/frontend/assets/images/product-placeholder.png'}" 
                         alt="${product.name}" 
                         onerror="this.src='/frontend/assets/images/product-placeholder.png'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-details">
                        <span class="product-category">${product.category}</span>
                        <span class="product-stock ${product.stock <= 0 ? 'out-of-stock' : ''}">
                            ${product.stock <= 0 ? 'Out of Stock' : `${product.stock} in stock`}
                        </span>
                    </div>
                    <div class="product-footer">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary" 
                                onclick="addToCart(${product.id})"
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Update pagination controls
    updatePagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        prevBtn.disabled = this.currentPage === 0;
        nextBtn.disabled = this.currentPage >= this.totalPages - 1;
        
        pageInfo.textContent = `Page ${this.currentPage + 1} of ${this.totalPages}`;
    },

    // Search products
    async search(searchTerm) {
        this.currentSearch = searchTerm;
        this.currentPage = 0;
        await this.loadProducts();
    },

    // Apply filters
    async applyFilters(category, sortBy) {
        this.currentCategory = category;
        this.currentSort = sortBy;
        this.currentPage = 0;
        await this.loadProducts();
    },

    // Go to previous page
    async previousPage() {
        if (this.currentPage > 0) {
            await this.loadProducts(this.currentPage - 1);
        }
    },

    // Go to next page
    async nextPage() {
        if (this.currentPage < this.totalPages - 1) {
            await this.loadProducts(this.currentPage + 1);
        }
    },

    // Show loading state
    showLoading() {
        document.getElementById('loadingMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('productsGrid').style.display = 'none';
    },

    // Hide loading state
    hideLoading() {
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('productsGrid').style.display = 'grid';
    },

    // Show error message
    showError(message) {
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorMessage').style.display = 'block';
    }
};
