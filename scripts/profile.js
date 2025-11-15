// ===== PROFILE PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    if (!authManager.requireAuth()) {
        return;
    }

    const currentUser = authManager.currentUser;
    
    initializeProfile(currentUser);
    setupTabNavigation();
    setupProfileEdit();
    setupAnnouncementsTab();
    setupSettingsTab();
});

function initializeProfile(user) {
    // Update profile card
    updateProfileCard(user);
    
    // Load profile information
    loadProfileInfo(user);
    
    // Load user announcements
    loadUserAnnouncements(user.id);
    
    // Update statistics
    updateProfileStatistics(user.id);
}

function updateProfileCard(user) {
    const profileIcon = document.getElementById('profileIcon');
    const profileName = document.getElementById('profileName');
    const profileType = document.getElementById('profileType');
    
    // Update icon
    if (profileIcon) {
        profileIcon.className = `fas fa-${user.type === 'university' ? 'university' : 'building'}`;
    }
    
    // Update name
    if (profileName) {
        const name = user.type === 'university' ? user.universityName : user.companyName;
        profileName.textContent = name || 'Організація';
    }
    
    // Update type
    if (profileType) {
        const typeText = user.type === 'university' ? 'Університет' : 
                        `Компанія (${Utils.getIndustryDisplayName(user.industry)})`;
        profileType.textContent = typeText;
    }
}

function loadProfileInfo(user) {
    // Display mode elements
    const displayElements = {
        'displayName': user.type === 'university' ? user.universityName : user.companyName,
        'displayEmail': user.email,
        'displayPhone': user.phone || 'Не вказано',
        'displayAddress': user.address || 'Не вказано',
        'displayWebsite': user.website || 'Не вказано',
        'displayDescription': user.description || 'Опис не вказано',
        'displayContactPerson': user.contactPerson || 'Не вказано'
    };
    
    // Industry for companies
    if (user.type === 'company') {
        const industryItem = document.getElementById('industryItem');
        const displayIndustry = document.getElementById('displayIndustry');
        if (industryItem && displayIndustry) {
            industryItem.style.display = 'block';
            displayIndustry.textContent = Utils.getIndustryDisplayName(user.industry);
        }
    }
    
    // Update display elements
    Object.keys(displayElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'displayWebsite' && user.website) {
                element.innerHTML = `<a href="${user.website.startsWith('http') ? user.website : 'https://' + user.website}" target="_blank">${user.website}</a>`;
            } else {
                element.textContent = displayElements[id];
            }
        }
    });
    
    // Edit form elements
    const editElements = {
        'editName': user.type === 'university' ? user.universityName : user.companyName,
        'editEmail': user.email,
        'editPhone': user.phone,
        'editAddress': user.address,
        'editWebsite': user.website,
        'editDescription': user.description,
        'editContactPerson': user.contactPerson
    };
    
    if (user.type === 'company') {
        const editIndustry = document.getElementById('editIndustry');
        const editIndustryGroup = document.getElementById('editIndustryGroup');
        if (editIndustry && editIndustryGroup) {
            editIndustryGroup.style.display = 'block';
            editIndustry.value = user.industry || '';
        }
    }
    
    Object.keys(editElements).forEach(id => {
        const element = document.getElementById(id);
        if (element && editElements[id]) {
            element.value = editElements[id];
        }
    });
}

function setupTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(tc => tc.classList.remove('active'));
            const targetTab = document.getElementById(tabId + 'Tab');
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

function setupProfileEdit() {
    const editInfoBtn = document.getElementById('editInfoBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const infoDisplay = document.getElementById('infoDisplay');
    const infoForm = document.getElementById('infoForm');
    
    if (editInfoBtn) {
        editInfoBtn.addEventListener('click', () => {
            infoDisplay.style.display = 'none';
            infoForm.style.display = 'block';
            editInfoBtn.style.display = 'none';
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            infoDisplay.style.display = 'block';
            infoForm.style.display = 'none';
            editInfoBtn.style.display = 'block';
            
            // Reset form
            loadProfileInfo(authManager.currentUser);
        });
    }
    
    if (infoForm) {
        infoForm.addEventListener('submit', handleProfileUpdate);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    LoadingManager.show(submitBtn);
    
    try {
        const formData = new FormData(e.target);
        const currentUser = authManager.currentUser;
        
        const updateData = {
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            address: formData.get('address').trim(),
            website: formData.get('website').trim(),
            description: formData.get('description').trim(),
            contactPerson: formData.get('contactPerson').trim()
        };
        
        // Add name field based on user type
        if (currentUser.type === 'university') {
            updateData.universityName = formData.get('name').trim();
        } else {
            updateData.companyName = formData.get('name').trim();
            updateData.industry = formData.get('industry');
        }
        
        const result = await authManager.updateUserProfile(currentUser.id, updateData);
        
        if (result.success) {
            Utils.showNotification(result.message, 'success');
            
            // Update display
            loadProfileInfo(result.user);
            updateProfileCard(result.user);
            
            // Switch back to display mode
            document.getElementById('infoDisplay').style.display = 'block';
            document.getElementById('infoForm').style.display = 'none';
            document.getElementById('editInfoBtn').style.display = 'block';
            
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        Utils.showNotification(error.message, 'error');
    } finally {
        LoadingManager.hide(submitBtn);
    }
}

function setupAnnouncementsTab() {
    const filterSelect = document.getElementById('myAnnouncementsFilter');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            loadUserAnnouncements(authManager.currentUser.id, filterSelect.value);
        });
    }
}

function loadUserAnnouncements(userId, filter = 'all') {
    const userAnnouncements = dataManager.getAnnouncementsByUser(userId);
    let filteredAnnouncements = userAnnouncements;
    
    // Apply filter
    switch (filter) {
        case 'active':
            filteredAnnouncements = userAnnouncements.filter(a => a.isActive && a.status !== 'draft');
            break;
        case 'expired':
            const now = new Date();
            filteredAnnouncements = userAnnouncements.filter(a => 
                !a.isActive || (a.expiryDate && new Date(a.expiryDate) < now)
            );
            break;
        case 'draft':
            filteredAnnouncements = userAnnouncements.filter(a => a.status === 'draft');
            break;
    }
    
    displayUserAnnouncements(filteredAnnouncements);
}

function displayUserAnnouncements(announcements) {
    const container = document.getElementById('myAnnouncements');
    const noAnnouncements = document.getElementById('noMyAnnouncements');
    
    if (!container) return;
    
    if (announcements.length === 0) {
        container.style.display = 'none';
        if (noAnnouncements) {
            noAnnouncements.style.display = 'block';
        }
        return;
    }
    
    container.style.display = 'block';
    if (noAnnouncements) {
        noAnnouncements.style.display = 'none';
    }
    
    container.innerHTML = announcements.map(announcement => 
        createMyAnnouncementCard(announcement)
    ).join('');
    
    // Setup card actions
    setupMyAnnouncementActions();
}

function createMyAnnouncementCard(announcement) {
    const statusClass = getAnnouncementStatusClass(announcement);
    const statusText = getAnnouncementStatusText(announcement);
    
    return `
        <div class="my-announcement-card ${statusClass}" data-id="${announcement.id}">
            <div class="announcement-header">
                <div class="announcement-title-section">
                    <h4 class="announcement-title">${Utils.sanitizeHtml(announcement.title)}</h4>
                    <div class="announcement-meta">
                        <span class="category">${Utils.getCategoryDisplayName(announcement.category)}</span>
                        <span class="status status-${statusClass}">${statusText}</span>
                        <span class="date">${Utils.formatDate(announcement.createdAt)}</span>
                    </div>
                </div>
                <div class="announcement-actions">
                    <button class="action-btn view-btn" title="Переглянути">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Редагувати">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Видалити">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="announcement-description">
                ${Utils.truncateText(Utils.sanitizeHtml(announcement.description), 120)}
            </div>
            
            <div class="announcement-stats">
                <div class="stat-item">
                    <i class="fas fa-eye"></i>
                    <span>${announcement.viewCount || 0} переглядів</span>
                </div>
                ${announcement.eventDate ? `
                    <div class="stat-item">
                        <i class="fas fa-calendar"></i>
                        <span>${Utils.formatDate(announcement.eventDate)}</span>
                    </div>
                ` : ''}
                ${announcement.expiryDate ? `
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>До ${Utils.formatDate(announcement.expiryDate)}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function getAnnouncementStatusClass(announcement) {
    if (announcement.status === 'draft') return 'draft';
    if (!announcement.isActive) return 'inactive';
    if (announcement.expiryDate && new Date(announcement.expiryDate) < new Date()) return 'expired';
    return 'active';
}

function getAnnouncementStatusText(announcement) {
    if (announcement.status === 'draft') return 'Чернетка';
    if (!announcement.isActive) return 'Неактивне';
    if (announcement.expiryDate && new Date(announcement.expiryDate) < new Date()) return 'Завершене';
    return 'Активне';
}

function setupMyAnnouncementActions() {
    const cards = document.querySelectorAll('.my-announcement-card');
    
    cards.forEach(card => {
        const announcementId = card.getAttribute('data-id');
        
        const viewBtn = card.querySelector('.view-btn');
        const editBtn = card.querySelector('.edit-btn');
        const deleteBtn = card.querySelector('.delete-btn');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `view-announcement.html?id=${announcementId}`;
            });
        }
        
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `create-announcement.html?edit=${announcementId}`;
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMyAnnouncement(announcementId);
            });
        }
    });
}

async function deleteMyAnnouncement(announcementId) {
    const confirmed = confirm('Ви впевнені, що хочете видалити це оголошення?');
    if (!confirmed) return;
    
    const result = dataManager.deleteAnnouncement(announcementId);
    
    if (result.success) {
        Utils.showNotification(result.message, 'success');
        loadUserAnnouncements(authManager.currentUser.id);
        updateProfileStatistics(authManager.currentUser.id);
    } else {
        Utils.showNotification(result.message, 'error');
    }
}

function setupSettingsTab() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleAccountDeletion);
    }
    
    // Load current settings
    loadCurrentSettings();
}

function loadCurrentSettings() {
    const currentUser = authManager.currentUser;
    
    // Load notification settings (these would be stored in user preferences)
    const emailNotifications = document.getElementById('emailNotifications');
    const newAnnouncementNotifications = document.getElementById('newAnnouncementNotifications');
    const showContactInfo = document.getElementById('showContactInfo');
    
    // For demo purposes, default to checked
    if (emailNotifications) emailNotifications.checked = true;
    if (newAnnouncementNotifications) newAnnouncementNotifications.checked = true;
    if (showContactInfo) showContactInfo.checked = true;
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    LoadingManager.show(submitBtn);
    
    try {
        const formData = new FormData(e.target);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmNewPassword = formData.get('confirmNewPassword');
        
        if (newPassword !== confirmNewPassword) {
            throw new Error('Нові паролі не співпадають');
        }
        
        const result = await authManager.changePassword(
            authManager.currentUser.id,
            currentPassword,
            newPassword
        );
        
        if (result.success) {
            Utils.showNotification(result.message, 'success');
            e.target.reset();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        Utils.showNotification(error.message, 'error');
    } finally {
        LoadingManager.hide(submitBtn);
    }
}

function handleAccountDeletion() {
    const confirmed = confirm(
        'Ви впевнені, що хочете видалити свій акаунт?\n\n' +
        'Ця дія незворотна і призведе до видалення:\n' +
        '• Вашого профілю\n' +
        '• Всіх ваших оголошень\n' +
        '• Всіх пов\'язаних даних\n\n' +
        'Введіть "ВИДАЛИТИ" для підтвердження'
    );
    
    if (!confirmed) return;
    
    const confirmation = prompt('Введіть "ВИДАЛИТИ" для підтвердження:');
    if (confirmation !== 'ВИДАЛИТИ') {
        Utils.showNotification('Видалення скасовано', 'info');
        return;
    }
    
    // In a real application, this would delete the user account
    Utils.showNotification('Функція видалення акаунту буде реалізована в майбутніх версіях', 'info');
}

function updateProfileStatistics(userId) {
    const userAnnouncements = dataManager.getAnnouncementsByUser(userId);
    const activeAnnouncements = userAnnouncements.filter(a => a.isActive && a.status !== 'draft');
    
    const totalAnnouncementsEl = document.getElementById('totalAnnouncements');
    const activeAnnouncementsEl = document.getElementById('activeAnnouncements');
    
    if (totalAnnouncementsEl) {
        totalAnnouncementsEl.textContent = userAnnouncements.length;
    }
    
    if (activeAnnouncementsEl) {
        activeAnnouncementsEl.textContent = activeAnnouncements.length;
    }
}