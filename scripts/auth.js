// ===== AUTHENTICATION MANAGER =====
// Handles user registration, login, logout, and session management

class AuthManager {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = this.loadCurrentUser();
        this.init();
    }

    init() {
        // Initialize sample data if no users exist
        if (this.users.length === 0) {
            this.initializeSampleData();
        }
    }

    // ===== DATA MANAGEMENT =====
    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    loadCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
        NavigationManager.updateNavigation();
    }

    // ===== USER REGISTRATION =====
    async registerUser(userData) {
        try {
            // Validate user data
            const validation = this.validateUserData(userData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('\n'));
            }

            // Check if user already exists
            const existingUser = this.users.find(user => user.email === userData.email);
            if (existingUser) {
                throw new Error('Користувач з таким email вже існує');
            }

            // Create new user
            const newUser = {
                id: Utils.generateId(),
                ...userData,
                password: this.hashPassword(userData.password),
                createdAt: new Date().toISOString(),
                isActive: true,
                emailVerified: false,
                lastLogin: null
            };

            // Remove confirm password
            delete newUser.confirmPassword;

            // Add to users array
            this.users.push(newUser);
            this.saveUsers();

            return {
                success: true,
                message: 'Реєстрація успішна! Тепер ви можете увійти в систему.',
                user: this.sanitizeUser(newUser)
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ===== USER LOGIN =====
    async loginUser(email, password, rememberMe = false) {
        try {
            // Find user
            const user = this.users.find(u => u.email === email);
            if (!user) {
                throw new Error('Користувача з таким email не знайдено');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Акаунт деактивовано. Зверніться до адміністратора.');
            }

            // Verify password
            if (!this.verifyPassword(password, user.password)) {
                throw new Error('Невірний пароль');
            }

            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers();

            // Save current user
            const sanitizedUser = this.sanitizeUser(user);
            this.saveCurrentUser(sanitizedUser);

            // Set remember me
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }

            return {
                success: true,
                message: 'Успішний вхід в систему!',
                user: sanitizedUser
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ===== USER LOGOUT =====
    logout() {
        this.saveCurrentUser(null);
        localStorage.removeItem('rememberMe');
        return {
            success: true,
            message: 'Ви успішно вийшли з системи'
        };
    }

    // ===== USER PROFILE MANAGEMENT =====
    async updateUserProfile(userId, updateData) {
        try {
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                throw new Error('Користувача не знайдено');
            }

            // Validate update data
            const validation = this.validateProfileUpdate(updateData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join('\n'));
            }

            // Check email uniqueness if email is being changed
            if (updateData.email && updateData.email !== this.users[userIndex].email) {
                const existingUser = this.users.find(u => u.email === updateData.email && u.id !== userId);
                if (existingUser) {
                    throw new Error('Користувач з таким email вже існує');
                }
            }

            // Update user data
            this.users[userIndex] = {
                ...this.users[userIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            this.saveUsers();

            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.id === userId) {
                this.saveCurrentUser(this.sanitizeUser(this.users[userIndex]));
            }

            return {
                success: true,
                message: 'Профіль успішно оновлено',
                user: this.sanitizeUser(this.users[userIndex])
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ===== PASSWORD MANAGEMENT =====
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                throw new Error('Користувача не знайдено');
            }

            // Verify current password
            if (!this.verifyPassword(currentPassword, user.password)) {
                throw new Error('Поточний пароль невірний');
            }

            // Validate new password
            if (newPassword.length < 6) {
                throw new Error('Новий пароль повинен містити мінімум 6 символів');
            }

            // Update password
            user.password = this.hashPassword(newPassword);
            user.updatedAt = new Date().toISOString();
            this.saveUsers();

            return {
                success: true,
                message: 'Пароль успішно змінено'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ===== USER MANAGEMENT =====
    getUserById(userId) {
        const user = this.users.find(u => u.id === userId);
        return user ? this.sanitizeUser(user) : null;
    }

    getUserByEmail(email) {
        const user = this.users.find(u => u.email === email);
        return user ? this.sanitizeUser(user) : null;
    }

    getAllUsers() {
        return this.users.map(user => this.sanitizeUser(user));
    }

    getUniversities() {
        return this.users
            .filter(user => user.type === 'university')
            .map(user => this.sanitizeUser(user));
    }

    getCompanies() {
        return this.users
            .filter(user => user.type === 'company')
            .map(user => this.sanitizeUser(user));
    }

    // ===== VALIDATION =====
    validateUserData(userData) {
        const errors = [];

        // Required fields
        const requiredFields = {
            email: 'Email',
            password: 'Пароль',
            confirmPassword: 'Підтвердження пароля',
            type: 'Тип організації'
        };

        Object.keys(requiredFields).forEach(field => {
            if (!userData[field] || !userData[field].toString().trim()) {
                errors.push(`Поле "${requiredFields[field]}" є обов'язковим`);
            }
        });

        // Type-specific required fields
        if (userData.type === 'university') {
            if (!userData.universityName?.trim()) {
                errors.push('Назва університету є обов\'язковою');
            }
            if (!userData.contactPerson?.trim()) {
                errors.push('Контактна особа є обов\'язковою');
            }
        } else if (userData.type === 'company') {
            if (!userData.companyName?.trim()) {
                errors.push('Назва компанії є обов\'язковою');
            }
            if (!userData.industry?.trim()) {
                errors.push('Галузь діяльності є обов\'язковою');
            }
            if (!userData.contactPerson?.trim()) {
                errors.push('Контактна особа є обов\'язковою');
            }
        }

        // Email validation
        if (userData.email && !Utils.isValidEmail(userData.email)) {
            errors.push('Невірний формат email');
        }

        // Password validation
        if (userData.password && userData.password.length < 6) {
            errors.push('Пароль повинен містити мінімум 6 символів');
        }

        // Password confirmation
        if (userData.password !== userData.confirmPassword) {
            errors.push('Паролі не співпадають');
        }

        // Phone validation
        if (userData.phone && !Utils.isValidPhone(userData.phone)) {
            errors.push('Невірний формат телефону');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateProfileUpdate(updateData) {
        const errors = [];

        // Email validation
        if (updateData.email && !Utils.isValidEmail(updateData.email)) {
            errors.push('Невірний формат email');
        }

        // Phone validation
        if (updateData.phone && !Utils.isValidPhone(updateData.phone)) {
            errors.push('Невірний формат телефону');
        }

        // Required fields based on type
        if (updateData.type === 'university' && updateData.universityName !== undefined && !updateData.universityName?.trim()) {
            errors.push('Назва університету не може бути пустою');
        }

        if (updateData.type === 'company' && updateData.companyName !== undefined && !updateData.companyName?.trim()) {
            errors.push('Назва компанії не може бути пустою');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // ===== UTILITY METHODS =====
    hashPassword(password) {
        // Simple hash for demo purposes - in production use proper hashing
        return btoa(password + 'salt123');
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    sanitizeUser(user) {
        const sanitized = { ...user };
        delete sanitized.password;
        return sanitized;
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            Utils.showNotification('Для доступу до цієї сторінки потрібно увійти в систему', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return false;
        }
        return true;
    }

    // ===== SAMPLE DATA INITIALIZATION =====
    initializeSampleData() {
        const sampleUsers = [
            {
                id: 'univ1',
                type: 'university',
                universityName: 'Київський національний університет імені Тараса Шевченка',
                email: 'info@knu.ua',
                phone: '+380442393111',
                address: 'вул. Володимирська, 60, Київ, 01033',
                website: 'https://knu.ua',
                description: 'Провідний класичний університет України, заснований у 1834 році. Готуємо фахівців за широким спектром спеціальностей.',
                contactPerson: 'Іванов Іван Іванович',
                password: this.hashPassword('password123'),
                createdAt: new Date().toISOString(),
                isActive: true,
                emailVerified: true,
                lastLogin: null
            },
            {
                id: 'comp1',
                type: 'company',
                companyName: 'TechUkraine',
                email: 'hr@techukraine.com',
                phone: '+380443334455',
                address: 'вул. Хрещатик, 22, Київ, 01001',
                website: 'https://techukraine.com',
                industry: 'it',
                description: 'Провідна IT-компанія України, що спеціалізується на розробці програмного забезпечення та цифрових рішень.',
                contactPerson: 'Петренко Марія Олександрівна',
                password: this.hashPassword('password123'),
                createdAt: new Date().toISOString(),
                isActive: true,
                emailVerified: true,
                lastLogin: null
            },
            {
                id: 'univ2',
                type: 'university',
                universityName: 'Національний технічний університет України "КПІ"',
                email: 'info@kpi.ua',
                phone: '+380442048888',
                address: 'просп. Перемоги, 37, Київ, 03056',
                website: 'https://kpi.ua',
                description: 'Провідний технічний університет України, готує інженерів та IT-фахівців світового рівня.',
                contactPerson: 'Сидоренко Олег Петрович',
                password: this.hashPassword('password123'),
                createdAt: new Date().toISOString(),
                isActive: true,
                emailVerified: true,
                lastLogin: null
            }
        ];

        this.users = sampleUsers;
        this.saveUsers();
    }
}

// ===== DATA STORAGE MANAGER =====
class DataManager {
    constructor() {
        this.announcements = this.loadAnnouncements();
        this.init();
    }

    init() {
        // Initialize sample announcements if none exist
        if (this.announcements.length === 0) {
            this.initializeSampleAnnouncements();
        }
    }

    // ===== ANNOUNCEMENTS MANAGEMENT =====
    loadAnnouncements() {
        const announcements = localStorage.getItem('announcements');
        return announcements ? JSON.parse(announcements) : [];
    }

    saveAnnouncements() {
        localStorage.setItem('announcements', JSON.stringify(this.announcements));
    }

    createAnnouncement(announcementData) {
        const newAnnouncement = {
            id: Utils.generateId(),
            ...announcementData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            viewCount: 0,
            status: 'active'
        };

        this.announcements.push(newAnnouncement);
        this.saveAnnouncements();

        return {
            success: true,
            message: 'Оголошення успішно створено',
            announcement: newAnnouncement
        };
    }

    updateAnnouncement(id, updateData) {
        const index = this.announcements.findIndex(a => a.id === id);
        if (index === -1) {
            return {
                success: false,
                message: 'Оголошення не знайдено'
            };
        }

        this.announcements[index] = {
            ...this.announcements[index],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        this.saveAnnouncements();

        return {
            success: true,
            message: 'Оголошення успішно оновлено',
            announcement: this.announcements[index]
        };
    }

    deleteAnnouncement(id) {
        const index = this.announcements.findIndex(a => a.id === id);
        if (index === -1) {
            return {
                success: false,
                message: 'Оголошення не знайдено'
            };
        }

        this.announcements.splice(index, 1);
        this.saveAnnouncements();

        return {
            success: true,
            message: 'Оголошення успішно видалено'
        };
    }

    getAnnouncementById(id) {
        const announcement = this.announcements.find(a => a.id === id);
        if (announcement) {
            // Increment view count
            announcement.viewCount = (announcement.viewCount || 0) + 1;
            this.saveAnnouncements();
        }
        return announcement;
    }

    getAllAnnouncements() {
        return this.announcements.filter(a => a.isActive);
    }

    getAnnouncementsByUser(userId) {
        return this.announcements.filter(a => a.authorId === userId);
    }

    getActiveAnnouncements() {
        const now = new Date();
        return this.announcements.filter(a => {
            if (!a.isActive) return false;
            if (a.expiryDate && new Date(a.expiryDate) < now) return false;
            return true;
        });
    }

    // ===== STATISTICS =====
    getStatistics() {
        const authManager = new AuthManager();
        const totalAnnouncements = this.announcements.length;
        const activeAnnouncements = this.getActiveAnnouncements().length;
        const totalUniversities = authManager.getUniversities().length;
        const totalCompanies = authManager.getCompanies().length;
        
        const today = new Date().toDateString();
        const todayAnnouncements = this.announcements.filter(a => 
            new Date(a.createdAt).toDateString() === today
        ).length;

        return {
            totalAnnouncements,
            activeAnnouncements,
            totalUniversities,
            totalCompanies,
            todayAnnouncements
        };
    }

    // ===== SAMPLE DATA =====
    initializeSampleAnnouncements() {
        const sampleAnnouncements = [
            {
                id: 'ann1',
                title: 'Лекція з штучного інтелекту для студентів',
                category: 'lecture',
                description: 'Запрошуємо експертів з галузі штучного інтелекту для проведення лекції для студентів комп\'ютерних наук. Розглянемо сучасні тенденції в машинному навчанні та практичні застосування AI.',
                authorId: 'univ1',
                organizationType: 'university',
                eventDate: '2024-12-15',
                eventTime: '14:00',
                duration: '2hours',
                location: 'Аудиторія 101, головний корпус',
                format: 'offline',
                targetAudience: 'Студенти 3-4 курсів спеціальності "Комп\'ютерні науки"',
                requirements: 'Досвід роботи з AI/ML мінімум 3 роки, публікації в галузі',
                compensation: 'Гонорар 5000 грн, сертифікат лектора',
                contactEmail: 'ai.lectures@knu.ua',
                contactPhone: '+380442393111',
                urgent: true,
                createdAt: '2024-11-10T10:00:00.000Z',
                updatedAt: '2024-11-10T10:00:00.000Z',
                isActive: true,
                viewCount: 45,
                status: 'active'
            },
            {
                id: 'ann2',
                title: 'Пошук університету для проведення воркшопу з кібербезпеки',
                category: 'workshop',
                description: 'Наша компанія шукає партнера-університет для проведення практичного воркшопу з кібербезпеки. Маємо досвідчених спеціалістів та готові поділитися знаннями зі студентами.',
                authorId: 'comp1',
                organizationType: 'company',
                eventDate: '2024-12-20',
                eventTime: '10:00',
                duration: 'halfday',
                location: 'Буде узгоджено з університетом',
                format: 'hybrid',
                targetAudience: 'Студенти IT-спеціальностей, викладачі',
                requirements: 'Наявність комп\'ютерного класу, проектор, інтернет',
                compensation: 'Безкоштовно, сертифікати учасникам',
                contactEmail: 'workshops@techukraine.com',
                contactPhone: '+380443334455',
                urgent: false,
                createdAt: '2024-11-12T09:30:00.000Z',
                updatedAt: '2024-11-12T09:30:00.000Z',
                isActive: true,
                viewCount: 32,
                status: 'active'
            },
            {
                id: 'ann3',
                title: 'Семінар з інноваційних технологій в освіті',
                category: 'seminar',
                description: 'КПІ організовує семінар для представників IT-компаній щодо впровадження інноваційних технологій в освітній процес. Обговоримо можливості співпраці та спільні проекти.',
                authorId: 'univ2',
                organizationType: 'university',
                eventDate: '2024-12-10',
                eventTime: '15:30',
                duration: '3hours',
                location: 'Конференц-зал, корпус №7',
                format: 'offline',
                targetAudience: 'Представники IT-компаній, стартапів',
                requirements: 'Досвід роботи в IT-галузі, інтерес до освітніх технологій',
                compensation: 'Нетворкінг, можливості для партнерства',
                contactEmail: 'innovation@kpi.ua',
                contactPhone: '+380442048888',
                urgent: false,
                createdAt: '2024-11-08T14:15:00.000Z',
                updatedAt: '2024-11-08T14:15:00.000Z',
                isActive: true,
                viewCount: 28,
                status: 'active'
            }
        ];

        this.announcements = sampleAnnouncements;
        this.saveAnnouncements();
    }
}

// ===== GLOBAL INSTANCES =====
window.authManager = new AuthManager();
window.dataManager = new DataManager();

// ===== EXPORT FOR OTHER SCRIPTS =====
window.AuthManager = AuthManager;
window.DataManager = DataManager;