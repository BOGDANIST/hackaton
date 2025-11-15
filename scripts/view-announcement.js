// ===== VIEW ANNOUNCEMENT PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const announcementId = urlParams.get('id');

    if (!announcementId) {
        Utils.showNotification('Оголошення не знайдено', 'error');
        window.location.href = 'announcements.html';
        return;
    }

    loadAnnouncement(announcementId);
    setupContactModal();
});

async function loadAnnouncement(announcementId) {
    try {
        const announcement = dataManager.getAnnouncementById(announcementId);
        
        if (!announcement) {
            throw new Error('Оголошення не знайдено');
        }

        const author = authManager.getUserById(announcement.authorId);
        if (!author) {
            throw new Error('Автор оголошення не знайдено');
        }

        displayAnnouncement(announcement, author);
        setupAnnouncementActions(announcement);
        loadRelatedAnnouncements(announcement);
        
    } catch (error) {
        Utils.showNotification(error.message, 'error');
        setTimeout(() => {
            window.location.href = 'announcements.html';
        }, 2000);
    }
}

function displayAnnouncement(announcement, author) {
    // Update page title
    document.title = `${announcement.title} - UniConnect`;
    
    // Main content
    updateElement('announcementTitle', announcement.title);
    updateElement('announcementCategory', Utils.getCategoryDisplayName(announcement.category));
    updateElement('announcementDate', Utils.formatDate(announcement.createdAt));
    updateElement('announcementDescription', announcement.description.replace(/\n/g, '<br>'));
    
    // Urgent badge
    const urgentBadge = document.getElementById('urgentBadge');
    if (urgentBadge) {
        urgentBadge.style.display = announcement.urgent ? 'inline-flex' : 'none';
    }
    
    // Event details
    updateEventDetail('eventDate', announcement.eventDate, Utils.formatDate);
    updateEventDetail('eventTime', announcement.eventTime, Utils.formatTime);
    updateEventDetail('duration', announcement.duration, Utils.getDurationDisplayName);
    updateEventDetail('location', announcement.location);
    updateEventDetail('format', announcement.format, Utils.getFormatDisplayName);
    updateEventDetail('targetAudience', announcement.targetAudience);
    
    // Requirements
    updateRequirement('requirements', announcement.requirements);
    updateRequirement('compensation', announcement.compensation);
    
    // Additional info
    const additionalSection = document.getElementById('additionalSection');
    const additionalInfo = document.getElementById('additionalInfo');
    if (announcement.additionalInfo) {
        additionalSection.style.display = 'block';
        additionalInfo.textContent = announcement.additionalInfo;
    } else {
        additionalSection.style.display = 'none';
    }
    
    // Organization info
    displayOrganizationInfo(author);
    
    // Statistics
    updateElement('viewCount', announcement.viewCount || 0);
    updateElement('publishDate', Utils.formatDate(announcement.createdAt));
    
    const expiryItem = document.getElementById('expiryItem');
    const expiryDate = document.getElementById('expiryDate');
    if (announcement.expiryDate) {
        expiryItem.style.display = 'block';
        expiryDate.textContent = Utils.formatDate(announcement.expiryDate);
    } else {
        expiryItem.style.display = 'none';
    }
}

function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.innerHTML = Utils.sanitizeHtml(content);
    }
}

function updateEventDetail(id, value, formatter = null) {
    const item = document.getElementById(id + 'Item');
    const element = document.getElementById(id);
    
    if (value) {
        item.style.display = 'block';
        element.textContent = formatter ? formatter(value) : value;
    } else {
        item.style.display = 'none';
    }
}

function updateRequirement(id, value) {
    const item = document.getElementById(id + 'Item');
    const element = document.getElementById(id);
    const section = document.getElementById('requirementsSection');
    
    if (value) {
        item.style.display = 'block';
        element.textContent = value;
        section.style.display = 'block';
    } else {
        item.style.display = 'none';
    }
    
    // Hide section if no requirements
    const visibleItems = section.querySelectorAll('.requirement-item[style*="block"]');
    if (visibleItems.length === 0) {
        section.style.display = 'none';
    }
}

function displayOrganizationInfo(author) {
    const orgIcon = document.getElementById('orgIcon');
    const orgName = document.getElementById('orgName');
    const orgType = document.getElementById('orgType');
    const orgDescription = document.getElementById('orgDescription');
    
    // Icon
    if (orgIcon) {
        orgIcon.className = `fas fa-${author.type === 'university' ? 'university' : 'building'}`;
    }
    
    // Name and type
    if (author.type === 'university') {
        updateElement('orgName', author.universityName || 'Університет');
        updateElement('orgType', 'Університет');
    } else {
        updateElement('orgName', author.companyName || 'Компанія');
        updateElement('orgType', `Компанія (${Utils.getIndustryDisplayName(author.industry)})`);
    }
    
    // Description
    if (orgDescription) {
        orgDescription.textContent = author.description || 'Опис не вказано';
    }
    
    // Contact info
    updateContactInfo('contactEmail', author.email, 'mailto:');
    updateContactInfo('contactPhone', author.phone, 'tel:');
    updateContactInfo('contactWebsite', author.website, '', true);
    updateContactInfo('contactPerson', author.contactPerson);
}

function updateContactInfo(id, value, prefix = '', isLink = false) {
    const item = document.getElementById(id + 'Item');
    const element = document.getElementById(id);
    
    if (value) {
        item.style.display = 'flex';
        if (isLink) {
            element.href = value.startsWith('http') ? value : `https://${value}`;
            element.textContent = value;
        } else if (prefix) {
            element.href = prefix + value;
            element.textContent = value;
        } else {
            element.textContent = value;
        }
    } else {
        item.style.display = 'none';
    }
}

function setupAnnouncementActions(announcement) {
    const currentUser = authManager.currentUser;
    const announcementActions = document.getElementById('announcementActions');
    
    // Show actions only for announcement owner
    if (currentUser && currentUser.id === announcement.authorId) {
        announcementActions.style.display = 'flex';
        
        const editBtn = document.getElementById('editAnnouncementBtn');
        const deleteBtn = document.getElementById('deleteAnnouncementBtn');
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.location.href = `create-announcement.html?edit=${announcement.id}`;
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                deleteAnnouncement(announcement.id);
            });
        }
    }
    
    // Contact button
    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        if (currentUser && currentUser.id === announcement.authorId) {
            contactBtn.style.display = 'none';
        } else {
            contactBtn.addEventListener('click', () => {
                if (!currentUser) {
                    Utils.showNotification('Для зв\'язку потрібно увійти в систему', 'warning');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    return;
                }
                ModalManager.openModal('contactModal');
            });
        }
    }
    
    // View profile button
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            // In a real app, this would go to the organization's public profile
            Utils.showNotification('Функція перегляду профілю буде додана в майбутніх версіях', 'info');
        });
    }
}

async function deleteAnnouncement(announcementId) {
    const confirmed = confirm('Ви впевнені, що хочете видалити це оголошення?');
    if (!confirmed) return;
    
    const result = dataManager.deleteAnnouncement(announcementId);
    
    if (result.success) {
        Utils.showNotification(result.message, 'success');
        setTimeout(() => {
            window.location.href = 'announcements.html';
        }, 1500);
    } else {
        Utils.showNotification(result.message, 'error');
    }
}

function setupContactModal() {
    const contactForm = document.getElementById('contactForm');
    const closeContactModal = document.getElementById('closeContactModal');
    const cancelContactBtn = document.getElementById('cancelContactBtn');
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    if (closeContactModal) {
        closeContactModal.addEventListener('click', () => {
            ModalManager.closeModal('contactModal');
        });
    }
    
    if (cancelContactBtn) {
        cancelContactBtn.addEventListener('click', () => {
            ModalManager.closeModal('contactModal');
        });
    }
    
    // Pre-fill form with current user data
    const currentUser = authManager.currentUser;
    if (currentUser) {
        const senderName = document.getElementById('senderName');
        const senderEmail = document.getElementById('senderEmail');
        const senderPhone = document.getElementById('senderPhone');
        
        if (senderName) {
            senderName.value = currentUser.contactPerson || '';
        }
        
        if (senderEmail) {
            senderEmail.value = currentUser.email || '';
        }
        
        if (senderPhone) {
            senderPhone.value = currentUser.phone || '';
        }
    }
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    LoadingManager.show(submitBtn);
    
    try {
        const formData = new FormData(e.target);
        const contactData = {
            senderName: formData.get('senderName').trim(),
            senderEmail: formData.get('senderEmail').trim(),
            senderPhone: formData.get('senderPhone').trim(),
            subject: formData.get('messageSubject').trim(),
            message: formData.get('messageText').trim()
        };
        
        // Validate
        if (!contactData.senderName || !contactData.senderEmail || !contactData.subject || !contactData.message) {
            throw new Error('Будь ласка, заповніть всі обов\'язкові поля');
        }
        
        if (!Utils.isValidEmail(contactData.senderEmail)) {
            throw new Error('Невірний формат email');
        }
        
        // In a real application, this would send an email or save to database
        // For demo purposes, we'll just show a success message
        Utils.showNotification('Повідомлення надіслано! Організація зв\'яжеться з вами найближчим часом.', 'success');
        
        // Close modal and reset form
        ModalManager.closeModal('contactModal');
        e.target.reset();
        
    } catch (error) {
        Utils.showNotification(error.message, 'error');
    } finally {
        LoadingManager.hide(submitBtn);
    }
}

function loadRelatedAnnouncements(currentAnnouncement) {
    const relatedContainer = document.getElementById('relatedAnnouncements');
    if (!relatedContainer) return;
    
    // Get announcements from same category or organization type
    const allAnnouncements = dataManager.getActiveAnnouncements();
    const related = allAnnouncements
        .filter(ann => 
            ann.id !== currentAnnouncement.id && 
            (ann.category === currentAnnouncement.category || 
             ann.organizationType === currentAnnouncement.organizationType)
        )
        .slice(0, 3);
    
    if (related.length === 0) {
        relatedContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Немає схожих оголошень</p>';
        return;
    }
    
    relatedContainer.innerHTML = related.map(announcement => {
        const author = authManager.getUserById(announcement.authorId);
        const authorName = getAuthorName(author);
        
        return `
            <div class="related-announcement" onclick="window.location.href='view-announcement.html?id=${announcement.id}'">
                <div class="related-header">
                    <h5>${Utils.truncateText(announcement.title, 60)}</h5>
                    <span class="related-category">${Utils.getCategoryDisplayName(announcement.category)}</span>
                </div>
                <div class="related-org">
                    <i class="fas fa-${announcement.organizationType === 'university' ? 'university' : 'building'}"></i>
                    <span>${Utils.truncateText(authorName, 30)}</span>
                </div>
                <div class="related-date">
                    ${Utils.formatDate(announcement.createdAt)}
                </div>
            </div>
        `;
    }).join('');
}

function getAuthorName(author) {
    if (!author) return 'Невідома організація';
    
    if (author.type === 'university') {
        return author.universityName || 'Університет';
    } else if (author.type === 'company') {
        return author.companyName || 'Компанія';
    }
    
    return 'Організація';
}