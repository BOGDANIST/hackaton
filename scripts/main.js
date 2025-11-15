// ===== MAIN JAVASCRIPT FILE =====
// Handles theme switching, common utilities, and global functionality

// ===== THEME MANAGEMENT =====
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Get saved theme or default to light
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
        
        // Setup theme toggle button
        this.setupThemeToggle();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
}

// ===== UTILITY FUNCTIONS =====
class Utils {
    // Format date to Ukrainian locale
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Date(date).toLocaleDateString('uk-UA', { ...defaultOptions, ...options });
    }

    // Format time to Ukrainian locale
    static formatTime(time) {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Show notification
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);

        // Manual close
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => notification.remove());

        return notification;
    }

    static getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Validate email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Sanitize HTML
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Truncate text
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Get category display name
    static getCategoryDisplayName(category) {
        const categories = {
            'lecture': 'Лекція',
            'seminar': 'Семінар',
            'workshop': 'Майстер-клас',
            'conference': 'Конференція',
            'internship': 'Стажування',
            'research': 'Дослідження',
            'other': 'Інше'
        };
        return categories[category] || category;
    }

    // Get industry display name
    static getIndustryDisplayName(industry) {
        const industries = {
            'it': 'Інформаційні технології',
            'finance': 'Фінанси та банківська справа',
            'healthcare': 'Охорона здоров\'я',
            'education': 'Освіта',
            'manufacturing': 'Виробництво',
            'retail': 'Роздрібна торгівля',
            'consulting': 'Консалтинг',
            'marketing': 'Маркетинг та реклама',
            'other': 'Інше'
        };
        return industries[industry] || industry;
    }

    // Get duration display name
    static getDurationDisplayName(duration) {
        const durations = {
            '30min': '30 хвилин',
            '1hour': '1 година',
            '1.5hours': '1.5 години',
            '2hours': '2 години',
            '3hours': '3 години',
            'halfday': 'Пів дня',
            'fullday': 'Повний день',
            'multiday': 'Кілька днів'
        };
        return durations[duration] || duration;
    }

    // Get format display name
    static getFormatDisplayName(format) {
        const formats = {
            'offline': 'Офлайн',
            'online': 'Онлайн',
            'hybrid': 'Гібридний'
        };
        return formats[format] || format;
    }
}

// ===== MODAL MANAGER =====
class ModalManager {
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus trap
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    static setupModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modalId);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeModal(modalId);
            }
        });

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modalId));
        }
    }
}

// ===== FORM UTILITIES =====
class FormUtils {
    // Setup password toggle
    static setupPasswordToggle(toggleSelector, inputSelector) {
        const toggle = document.querySelector(toggleSelector);
        const input = document.querySelector(inputSelector);
        
        if (toggle && input) {
            toggle.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                const icon = toggle.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            });
        }
    }

    // Setup all password toggles on page
    static setupAllPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        toggles.forEach(toggle => {
            const formGroup = toggle.closest('.form-group');
            const input = formGroup?.querySelector('input[type="password"]');
            
            if (input) {
                toggle.addEventListener('click', () => {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    
                    const icon = toggle.querySelector('i');
                    if (icon) {
                        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                    }
                });
            }
        });
    }

    // Validate form
    static validateForm(form) {
        const errors = [];
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push(`Поле "${this.getFieldLabel(input)}" є обов'язковим`);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
            
            // Email validation
            if (input.type === 'email' && input.value && !Utils.isValidEmail(input.value)) {
                errors.push(`Невірний формат email в полі "${this.getFieldLabel(input)}"`);
                input.classList.add('error');
            }
            
            // Phone validation
            if (input.type === 'tel' && input.value && !Utils.isValidPhone(input.value)) {
                errors.push(`Невірний формат телефону в полі "${this.getFieldLabel(input)}"`);
                input.classList.add('error');
            }
        });
        
        // Password confirmation
        const password = form.querySelector('input[name="password"]');
        const confirmPassword = form.querySelector('input[name="confirmPassword"]');
        
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            errors.push('Паролі не співпадають');
            confirmPassword.classList.add('error');
        }
        
        return errors;
    }

    static getFieldLabel(input) {
        const label = input.closest('.form-group')?.querySelector('label');
        return label?.textContent?.replace(':', '').replace('*', '').trim() || input.name;
    }

    // Show form errors
    static showFormErrors(errors, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (errors.length > 0) {
            container.style.display = 'block';
            container.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    ${errors.map(error => `<div>${error}</div>`).join('')}
                </div>
            `;
        } else {
            container.style.display = 'none';
        }
    }

    // Show form success
    static showFormSuccess(message, container) {
        if (!container) return;
        
        container.style.display = 'block';
        container.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
    }
}

// ===== LOADING MANAGER =====
class LoadingManager {
    static show(element) {
        if (element) {
            element.classList.add('loading');
            element.disabled = true;
        }
    }

    static hide(element) {
        if (element) {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }

    static showGlobal() {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <p>Завантаження...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    static hideGlobal() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.remove();
        }
    }
}

// ===== NAVIGATION MANAGER =====
class NavigationManager {
    static updateNavigation() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const createAnnouncementBtn = document.getElementById('createAnnouncementBtn');

        if (currentUser) {
            // User is logged in
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (createAnnouncementBtn) createAnnouncementBtn.style.display = 'flex';
        } else {
            // User is not logged in
            if (loginLink) loginLink.style.display = 'block';
            if (registerLink) registerLink.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (createAnnouncementBtn) createAnnouncementBtn.style.display = 'none';
        }
    }

    static setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                Utils.showNotification('Ви успішно вийшли з системи', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            });
        }
    }
}

// ===== SEARCH AND FILTER MANAGER =====
class SearchFilterManager {
    constructor(containerId, itemSelector) {
        this.container = document.getElementById(containerId);
        this.itemSelector = itemSelector;
        this.items = [];
        this.filteredItems = [];
        this.currentFilters = {};
        this.currentSort = 'date-desc';
        this.currentPage = 1;
        this.itemsPerPage = 12;
    }

    setItems(items) {
        this.items = items;
        this.filteredItems = [...items];
        this.applyFilters();
    }

    setFilter(key, value) {
        this.currentFilters[key] = value;
        this.currentPage = 1;
        this.applyFilters();
    }

    setSort(sortBy) {
        this.currentSort = sortBy;
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.items];

        // Apply filters
        Object.keys(this.currentFilters).forEach(key => {
            const value = this.currentFilters[key];
            if (value) {
                filtered = filtered.filter(item => this.filterItem(item, key, value));
            }
        });

        // Apply sorting
        filtered.sort((a, b) => this.sortItems(a, b));

        this.filteredItems = filtered;
        this.updateDisplay();
        this.updatePagination();
    }

    filterItem(item, key, value) {
        switch (key) {
            case 'search':
                return item.title.toLowerCase().includes(value.toLowerCase()) ||
                       item.description.toLowerCase().includes(value.toLowerCase());
            case 'category':
                return item.category === value;
            case 'organization':
                return item.organizationType === value;
            case 'date':
                return this.filterByDate(item, value);
            default:
                return true;
        }
    }

    filterByDate(item, dateFilter) {
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        
        switch (dateFilter) {
            case 'today':
                return itemDate.toDateString() === now.toDateString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return itemDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                return itemDate >= monthAgo;
            case 'future':
                return item.eventDate && new Date(item.eventDate) > now;
            default:
                return true;
        }
    }

    sortItems(a, b) {
        switch (this.currentSort) {
            case 'date-desc':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'date-asc':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'title-asc':
                return a.title.localeCompare(b.title, 'uk');
            case 'title-desc':
                return b.title.localeCompare(a.title, 'uk');
            default:
                return 0;
        }
    }

    updateDisplay() {
        if (!this.container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredItems.slice(startIndex, endIndex);

        if (pageItems.length === 0) {
            this.showNoResults();
        } else {
            this.renderItems(pageItems);
        }

        this.updateResultsCount();
    }

    showNoResults() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Нічого не знайдено</h3>
                    <p>Спробуйте змінити параметри пошуку</p>
                </div>
            `;
        }
    }

    renderItems(items) {
        // This method should be overridden by specific implementations
        console.log('renderItems should be overridden', items);
    }

    updateResultsCount() {
        const countElement = document.getElementById('resultsCount');
        if (countElement) {
            countElement.textContent = `Знайдено: ${this.filteredItems.length} оголошень`;
        }
    }

    updatePagination() {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
            prevBtn.onclick = () => this.goToPage(this.currentPage - 1);
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
            nextBtn.onclick = () => this.goToPage(this.currentPage + 1);
        }

        if (pageInfo) {
            pageInfo.textContent = `Сторінка ${this.currentPage} з ${totalPages}`;
        }
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.updateDisplay();
            this.updatePagination();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager
    new ThemeManager();
    
    // Setup navigation
    NavigationManager.updateNavigation();
    NavigationManager.setupLogout();
    
    // Setup password toggles
    FormUtils.setupAllPasswordToggles();
    
    // Setup modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        ModalManager.setupModal(modal.id);
    });
    
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading states to forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                LoadingManager.show(submitBtn);
                
                // Remove loading state after a delay (will be overridden by actual form handlers)
                setTimeout(() => {
                    LoadingManager.hide(submitBtn);
                }, 3000);
            }
        });
    });
    
    // Character counter for textareas
    document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        const counter = document.getElementById('charCount');
        
        if (counter) {
            const updateCounter = () => {
                const currentLength = textarea.value.length;
                counter.textContent = `${currentLength}/${maxLength}`;
                
                if (currentLength > maxLength * 0.9) {
                    counter.style.color = 'var(--warning-color)';
                } else {
                    counter.style.color = 'var(--text-secondary)';
                }
            };
            
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }
    });
});

// ===== GLOBAL ERROR HANDLER =====
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    Utils.showNotification('Виникла помилка. Спробуйте оновити сторінку.', 'error');
});

// ===== EXPORT FOR OTHER SCRIPTS =====
window.Utils = Utils;
window.ModalManager = ModalManager;
window.FormUtils = FormUtils;
window.LoadingManager = LoadingManager;
window.NavigationManager = NavigationManager;
window.SearchFilterManager = SearchFilterManager;