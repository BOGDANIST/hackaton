// ===== CREATE ANNOUNCEMENT PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!authManager.requireAuth()) {
        return;
    }

    const announcementForm = document.getElementById('announcementForm');
    const previewBtn = document.getElementById('previewBtn');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const previewModal = document.getElementById('previewModal');
    const closePreview = document.getElementById('closePreview');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const publishFromPreview = document.getElementById('publishFromPreview');

    let isEditMode = false;
    let editingAnnouncementId = null;

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        isEditMode = true;
        editingAnnouncementId = editId;
        loadAnnouncementForEdit(editId);
    }

    // Setup form handlers
    if (announcementForm) {
        announcementForm.addEventListener('submit', handleFormSubmit);
    }

    if (previewBtn) {
        previewBtn.addEventListener('click', showPreview);
    }

    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }

    // Preview modal handlers
    if (closePreview) {
        closePreview.addEventListener('click', () => {
            ModalManager.closeModal('previewModal');
        });
    }

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            ModalManager.closeModal('previewModal');
        });
    }

    if (publishFromPreview) {
        publishFromPreview.addEventListener('click', () => {
            ModalManager.closeModal('previewModal');
            publishAnnouncement();
        });
    }

    // Setup character counters
    setupCharacterCounters();

    // Setup form validation
    setupFormValidation();

    // Auto-save draft functionality
    setupAutoSave();

    // Load announcement for editing
    function loadAnnouncementForEdit(announcementId) {
        const announcement = dataManager.getAnnouncementById(announcementId);
        
        if (!announcement) {
            Utils.showNotification('Оголошення не знайдено', 'error');
            window.location.href = 'announcements.html';
            return;
        }

        // Check if user owns this announcement
        const currentUser = authManager.currentUser;
        if (!currentUser || currentUser.id !== announcement.authorId) {
            Utils.showNotification('У вас немає прав для редагування цього оголошення', 'error');
            window.location.href = 'announcements.html';
            return;
        }

        // Update page title
        const pageHeader = document.querySelector('.page-header h1');
        if (pageHeader) {
            pageHeader.textContent = 'Редагувати оголошення';
        }

        // Update submit button text
        const submitBtn = announcementForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Зберегти зміни';
        }

        // Fill form with announcement data
        fillFormWithData(announcement);
    }

    function fillFormWithData(announcement) {
        const fields = [
            'title', 'category', 'description', 'eventDate', 'eventTime',
            'duration', 'location', 'format', 'targetAudience', 'requirements',
            'compensation', 'contactEmail', 'contactPhone', 'additionalInfo',
            'expiryDate'
        ];

        fields.forEach(field => {
            const input = document.getElementById(field);
            if (input && announcement[field]) {
                input.value = announcement[field];
            }
        });

        // Handle checkboxes
        const urgentCheckbox = document.getElementById('urgent');
        if (urgentCheckbox) {
            urgentCheckbox.checked = announcement.urgent || false;
        }

        const emailNotificationsCheckbox = document.getElementById('emailNotifications');
        if (emailNotificationsCheckbox) {
            emailNotificationsCheckbox.checked = announcement.emailNotifications !== false;
        }

        // Update character counters
        updateAllCharacterCounters();
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();
        await publishAnnouncement();
    }

    // Publish announcement
    async function publishAnnouncement() {
        const submitBtn = announcementForm.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn);

        try {
            const formData = getFormData();
            const validation = validateAnnouncementData(formData);

            if (!validation.isValid) {
                throw new Error(validation.errors.join('\n'));
            }

            let result;
            if (isEditMode) {
                result = dataManager.updateAnnouncement(editingAnnouncementId, formData);
            } else {
                // Add author information
                formData.authorId = authManager.currentUser.id;
                formData.organizationType = authManager.currentUser.type;
                result = dataManager.createAnnouncement(formData);
            }

            if (result.success) {
                Utils.showNotification(result.message, 'success');
                
                // Clear auto-save data
                clearAutoSaveData();
                
                // Redirect to announcements page
                setTimeout(() => {
                    window.location.href = 'announcements.html';
                }, 1500);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            Utils.showNotification(error.message, 'error');
            LoadingManager.hide(submitBtn);
        }
    }

    // Save as draft
    async function saveDraft() {
        const draftBtn = document.getElementById('saveDraftBtn');
        LoadingManager.show(draftBtn);

        try {
            const formData = getFormData();
            formData.status = 'draft';
            formData.isActive = false;

            if (!formData.title.trim()) {
                throw new Error('Для збереження чернетки потрібно вказати заголовок');
            }

            // Add author information
            formData.authorId = authManager.currentUser.id;
            formData.organizationType = authManager.currentUser.type;

            const result = dataManager.createAnnouncement(formData);

            if (result.success) {
                Utils.showNotification('Чернетку збережено', 'success');
                
                // Clear auto-save data
                clearAutoSaveData();
                
                // Redirect to profile page
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 1500);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            Utils.showNotification(error.message, 'error');
        } finally {
            LoadingManager.hide(draftBtn);
        }
    }

    // Show preview
    function showPreview() {
        const formData = getFormData();
        const previewContent = document.getElementById('previewContent');
        
        if (!previewContent) return;

        const currentUser = authManager.currentUser;
        const authorName = currentUser.type === 'university' ? 
            currentUser.universityName : currentUser.companyName;

        previewContent.innerHTML = generatePreviewHTML(formData, currentUser, authorName);
        ModalManager.openModal('previewModal');
    }

    // Generate preview HTML
    function generatePreviewHTML(data, author, authorName) {
        return `
            <div class="announcement-preview">
                <div class="preview-header">
                    <h2>${Utils.sanitizeHtml(data.title || 'Заголовок оголошення')}</h2>
                    <div class="preview-meta">
                        <span class="category">${Utils.getCategoryDisplayName(data.category)}</span>
                        <span class="date">${Utils.formatDate(new Date())}</span>
                        ${data.urgent ? '<span class="urgent"><i class="fas fa-exclamation-triangle"></i> Терміново</span>' : ''}
                    </div>
                </div>

                <div class="preview-section">
                    <h3>Опис</h3>
                    <p>${Utils.sanitizeHtml(data.description || 'Опис не вказано').replace(/\n/g, '<br>')}</p>
                </div>

                ${generatePreviewDetails(data)}
                ${generatePreviewRequirements(data)}
                ${generatePreviewContact(data, author)}
            </div>
        `;
    }

    function generatePreviewDetails(data) {
        const details = [];
        
        if (data.eventDate) {
            details.push(`<div class="detail-item"><i class="fas fa-calendar"></i> <strong>Дата:</strong> ${Utils.formatDate(data.eventDate)}</div>`);
        }
        
        if (data.eventTime) {
            details.push(`<div class="detail-item"><i class="fas fa-clock"></i> <strong>Час:</strong> ${Utils.formatTime(data.eventTime)}</div>`);
        }
        
        if (data.duration) {
            details.push(`<div class="detail-item"><i class="fas fa-hourglass-half"></i> <strong>Тривалість:</strong> ${Utils.getDurationDisplayName(data.duration)}</div>`);
        }
        
        if (data.location) {
            details.push(`<div class="detail-item"><i class="fas fa-map-marker-alt"></i> <strong>Місце:</strong> ${Utils.sanitizeHtml(data.location)}</div>`);
        }
        
        if (data.format) {
            details.push(`<div class="detail-item"><i class="fas fa-desktop"></i> <strong>Формат:</strong> ${Utils.getFormatDisplayName(data.format)}</div>`);
        }
        
        if (data.targetAudience) {
            details.push(`<div class="detail-item"><i class="fas fa-users"></i> <strong>Аудиторія:</strong> ${Utils.sanitizeHtml(data.targetAudience)}</div>`);
        }

        if (details.length === 0) return '';

        return `
            <div class="preview-section">
                <h3>Деталі заходу</h3>
                <div class="preview-details">
                    ${details.join('')}
                </div>
            </div>
        `;
    }

    function generatePreviewRequirements(data) {
        const sections = [];
        
        if (data.requirements) {
            sections.push(`
                <div class="requirement-item">
                    <h4>Вимоги до партнера:</h4>
                    <p>${Utils.sanitizeHtml(data.requirements).replace(/\n/g, '<br>')}</p>
                </div>
            `);
        }
        
        if (data.compensation) {
            sections.push(`
                <div class="requirement-item">
                    <h4>Винагорода/Компенсація:</h4>
                    <p>${Utils.sanitizeHtml(data.compensation).replace(/\n/g, '<br>')}</p>
                </div>
            `);
        }
        
        if (data.additionalInfo) {
            sections.push(`
                <div class="requirement-item">
                    <h4>Додаткова інформація:</h4>
                    <p>${Utils.sanitizeHtml(data.additionalInfo).replace(/\n/g, '<br>')}</p>
                </div>
            `);
        }

        if (sections.length === 0) return '';

        return `
            <div class="preview-section">
                <h3>Вимоги та умови</h3>
                ${sections.join('')}
            </div>
        `;
    }

    function generatePreviewContact(data, author) {
        const contacts = [];
        
        const email = data.contactEmail || author.email;
        if (email) {
            contacts.push(`<div class="contact-item"><i class="fas fa-envelope"></i> ${email}</div>`);
        }
        
        const phone = data.contactPhone || author.phone;
        if (phone) {
            contacts.push(`<div class="contact-item"><i class="fas fa-phone"></i> ${phone}</div>`);
        }

        return `
            <div class="preview-section">
                <h3>Контактна інформація</h3>
                <div class="preview-contacts">
                    ${contacts.join('')}
                </div>
            </div>
        `;
    }

    // Get form data
    function getFormData() {
        const formData = new FormData(announcementForm);
        const data = {};

        // Text fields
        const textFields = [
            'title', 'category', 'description', 'eventDate', 'eventTime',
            'duration', 'location', 'format', 'targetAudience', 'requirements',
            'compensation', 'contactEmail', 'contactPhone', 'additionalInfo',
            'expiryDate'
        ];

        textFields.forEach(field => {
            const value = formData.get(field);
            if (value) {
                data[field] = value.trim();
            }
        });

        // Checkboxes
        data.urgent = formData.get('urgent') === 'on';
        data.emailNotifications = formData.get('emailNotifications') === 'on';

        return data;
    }

    // Validate announcement data
    function validateAnnouncementData(data) {
        const errors = [];

        // Required fields
        if (!data.title) {
            errors.push('Заголовок є обов\'язковим');
        }

        if (!data.category) {
            errors.push('Категорія є обов\'язковою');
        }

        if (!data.description) {
            errors.push('Опис є обов\'язковим');
        }

        // Length validations
        if (data.title && data.title.length > 100) {
            errors.push('Заголовок не може перевищувати 100 символів');
        }

        if (data.description && data.description.length > 1000) {
            errors.push('Опис не може перевищувати 1000 символів');
        }

        if (data.requirements && data.requirements.length > 500) {
            errors.push('Вимоги не можуть перевищувати 500 символів');
        }

        // Email validation
        if (data.contactEmail && !Utils.isValidEmail(data.contactEmail)) {
            errors.push('Невірний формат email');
        }

        // Phone validation
        if (data.contactPhone && !Utils.isValidPhone(data.contactPhone)) {
            errors.push('Невірний формат телефону');
        }

        // Date validation
        if (data.eventDate) {
            const eventDate = new Date(data.eventDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (eventDate < today) {
                errors.push('Дата проведення не може бути в минулому');
            }
        }

        if (data.expiryDate) {
            const expiryDate = new Date(data.expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (expiryDate < today) {
                errors.push('Дата закінчення актуальності не може бути в минулому');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Setup character counters
    function setupCharacterCounters() {
        const textareas = document.querySelectorAll('textarea[maxlength]');
        
        textareas.forEach(textarea => {
            const maxLength = parseInt(textarea.getAttribute('maxlength'));
            const counterId = textarea.id + 'Count';
            let counter = document.getElementById(counterId);
            
            if (!counter) {
                counter = document.createElement('span');
                counter.id = counterId;
                counter.className = 'char-counter';
                counter.style.cssText = `
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    float: right;
                    margin-top: 0.25rem;
                `;
                
                const helpText = textarea.parentNode.querySelector('.form-help');
                if (helpText) {
                    helpText.appendChild(counter);
                }
            }
            
            const updateCounter = () => {
                const currentLength = textarea.value.length;
                counter.textContent = `${currentLength}/${maxLength}`;
                
                if (currentLength > maxLength * 0.9) {
                    counter.style.color = 'var(--warning-color)';
                } else if (currentLength > maxLength) {
                    counter.style.color = 'var(--error-color)';
                } else {
                    counter.style.color = 'var(--text-secondary)';
                }
            };
            
            textarea.addEventListener('input', updateCounter);
            updateCounter();
        });
    }

    function updateAllCharacterCounters() {
        const textareas = document.querySelectorAll('textarea[maxlength]');
        textareas.forEach(textarea => {
            const event = new Event('input');
            textarea.dispatchEvent(event);
        });
    }

    // Setup form validation
    function setupFormValidation() {
        const requiredFields = announcementForm.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                if (!field.value.trim()) {
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            field.addEventListener('input', () => {
                if (field.value.trim()) {
                    field.classList.remove('error');
                }
            });
        });
    }

    // Auto-save functionality
    function setupAutoSave() {
        if (isEditMode) return; // Don't auto-save in edit mode
        
        const autoSaveInterval = 30000; // 30 seconds
        let autoSaveTimer;
        
        const startAutoSave = () => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                saveFormDataToLocalStorage();
                startAutoSave();
            }, autoSaveInterval);
        };
        
        // Start auto-save when user starts typing
        announcementForm.addEventListener('input', () => {
            startAutoSave();
        });
        
        // Load saved data on page load
        loadFormDataFromLocalStorage();
    }

    function saveFormDataToLocalStorage() {
        const formData = getFormData();
        if (formData.title || formData.description) {
            localStorage.setItem('announcementDraft', JSON.stringify(formData));
        }
    }

    function loadFormDataFromLocalStorage() {
        const savedData = localStorage.getItem('announcementDraft');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Ask user if they want to restore
                const restore = confirm('Знайдено збережену чернетку. Відновити дані?');
                if (restore) {
                    fillFormWithData(data);
                } else {
                    clearAutoSaveData();
                }
            } catch (error) {
                console.error('Error loading auto-saved data:', error);
                clearAutoSaveData();
            }
        }
    }

    function clearAutoSaveData() {
        localStorage.removeItem('announcementDraft');
    }
});