// ===== ANNOUNCEMENTS PAGE FUNCTIONALITY =====

class AnnouncementsManager extends SearchFilterManager {
    constructor() {
        super('announcementsGrid', '.announcement-card');
        this.init();
    }

    init() {
        this.loadAnnouncements();
        this.setupFilters();
        this.setupSorting();
        this.updateStatistics();
    }

    loadAnnouncements() {
        const announcements = dataManager.getActiveAnnouncements();
        this.setItems(announcements);
    }

    setupFilters() {
        // Organization filter
        const orgFilter = document.getElementById('organizationFilter');
        if (orgFilter) {
            orgFilter.addEventListener('change', (e) => {
                this.setFilter('organization', e.target.value);
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.setFilter('category', e.target.value);
            });
        }

        // Date filter
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.setFilter('date', e.target.value);
            });
        }

        // Search filter
        const searchFilter = document.getElementById('searchFilter');
        if (searchFilter) {
            const debouncedSearch = Utils.debounce((value) => {
                this.setFilter('search', value);
            }, 300);

            searchFilter.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }

        // Apply filters button
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setupSorting() {
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.setSort(e.target.value);
            });
        }
    }

    clearAllFilters() {
        // Reset filter controls
        const orgFilter = document.getElementById('organizationFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const dateFilter = document.getElementById('dateFilter');
        const searchFilter = document.getElementById('searchFilter');

        if (orgFilter) orgFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (dateFilter) dateFilter.value = '';
        if (searchFilter) searchFilter.value = '';

        // Clear filters
        this.currentFilters = {};
        this.applyFilters();
    }

    renderItems(announcements) {
        const container = document.getElementById('announcementsGrid');
        const noAnnouncements = document.getElementById('noAnnouncements');

        if (!container) return;

        if (announcements.length === 0) {
            container.style.display = 'none';
            if (noAnnouncements) {
                noAnnouncements.style.display = 'block';
            }
            return;
        }

        container.style.display = 'grid';
        if (noAnnouncements) {
            noAnnouncements.style.display = 'none';
        }

        container.innerHTML = announcements.map(announcement => 
            this.createAnnouncementCard(announcement)
        ).join('');

        // Add click handlers
        this.setupCardClickHandlers();
    }

    createAnnouncementCard(announcement) {
        const author = authManager.getUserById(announcement.authorId);
        const authorName = this.getAuthorName(author);
        const urgentClass = announcement.urgent ? 'urgent' : '';
        
        return `
            <div class="announcement-card ${urgentClass}" data-id="${announcement.id}">
                <div class="announcement-header">
                    <div>
                        <h3 class="announcement-title">${Utils.sanitizeHtml(announcement.title)}</h3>
                        <div class="announcement-meta">
                            <span class="category">${Utils.getCategoryDisplayName(announcement.category)}</span>
                            <span class="date">${Utils.formatDate(announcement.createdAt)}</span>
                            ${announcement.urgent ? '<span class="urgent"><i class="fas fa-exclamation-triangle"></i> Терміново</span>' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="announcement-description">
                    ${Utils.truncateText(Utils.sanitizeHtml(announcement.description), 150)}
                </div>
                
                ${this.createAnnouncementDetails(announcement)}
                
                <div class="announcement-footer">
                    <div class="organization-info">
                        <div class="org-avatar">
                            <i class="fas fa-${announcement.organizationType === 'university' ? 'university' : 'building'}"></i>
                        </div>
                        <span class="org-name">${Utils.sanitizeHtml(authorName)}</span>
                    </div>
                    <div class="announcement-actions">
                        <button class="action-btn view-btn" title="Переглянути">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn share-btn" title="Поділитися">
                            <i class="fas fa-share"></i>
                        </button>
                        ${this.createOwnerActions(announcement)}
                    </div>
                </div>
            </div>
        `;
    }

    createAnnouncementDetails(announcement) {
        const details = [];
        
        if (announcement.eventDate) {
            details.push(`<i class="fas fa-calendar"></i> ${Utils.formatDate(announcement.eventDate)}`);
        }
        
        if (announcement.location) {
            details.push(`<i class="fas fa-map-marker-alt"></i> ${Utils.sanitizeHtml(announcement.location)}`);
        }
        
        if (announcement.format) {
            details.push(`<i class="fas fa-desktop"></i> ${Utils.getFormatDisplayName(announcement.format)}`);
        }

        if (details.length === 0) return '';

        return `
            <div class="announcement-details-preview">
                ${details.slice(0, 2).map(detail => `<div class="detail-preview">${detail}</div>`).join('')}
                ${details.length > 2 ? '<div class="detail-preview"><i class="fas fa-ellipsis-h"></i> та інше</div>' : ''}
            </div>
        `;
    }

    createOwnerActions(announcement) {
        const currentUser = authManager.currentUser;
        if (!currentUser || currentUser.id !== announcement.authorId) {
            return '';
        }

        return `
            <button class="action-btn edit-btn" title="Редагувати">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" title="Видалити">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    getAuthorName(author) {
        if (!author) return 'Невідома організація';
        
        if (author.type === 'university') {
            return author.universityName || 'Університет';
        } else if (author.type === 'company') {
            return author.companyName || 'Компанія';
        }
        
        return 'Організація';
    }

    setupCardClickHandlers() {
        const cards = document.querySelectorAll('.announcement-card');
        
        cards.forEach(card => {
            const announcementId = card.getAttribute('data-id');
            
            // Main card click - view announcement
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.announcement-actions')) {
                    return;
                }
                
                window.location.href = `view-announcement.html?id=${announcementId}`;
            });
            
            // Action buttons
            const viewBtn = card.querySelector('.view-btn');
            const shareBtn = card.querySelector('.share-btn');
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `view-announcement.html?id=${announcementId}`;
                });
            }
            
            if (shareBtn) {
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.shareAnnouncement(announcementId);
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
                    this.deleteAnnouncement(announcementId);
                });
            }
        });
    }

    shareAnnouncement(announcementId) {
        const url = `${window.location.origin}/view-announcement.html?id=${announcementId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Оголошення на UniConnect',
                url: url
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                Utils.showNotification('Посилання скопійовано в буфер обміну', 'success');
            }).catch(() => {
                // Show modal with URL
                this.showShareModal(url);
            });
        }
    }

    showShareModal(url) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Поділитися оголошенням</h3>
                    <button class="modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Скопіюйте посилання для поширення:</p>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <input type="text" value="${url}" readonly style="flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">
                        <button class="btn btn-primary copy-url-btn">Копіювати</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Close handlers
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Copy button
        const copyBtn = modal.querySelector('.copy-url-btn');
        const input = modal.querySelector('input');
        
        copyBtn.addEventListener('click', () => {
            input.select();
            document.execCommand('copy');
            Utils.showNotification('Посилання скопійовано', 'success');
            modal.remove();
        });
    }

    async deleteAnnouncement(announcementId) {
        const confirmed = confirm('Ви впевнені, що хочете видалити це оголошення?');
        if (!confirmed) return;
        
        const result = dataManager.deleteAnnouncement(announcementId);
        
        if (result.success) {
            Utils.showNotification(result.message, 'success');
            this.loadAnnouncements(); // Reload announcements
            this.updateStatistics();
        } else {
            Utils.showNotification(result.message, 'error');
        }
    }

    updateStatistics() {
        const stats = dataManager.getStatistics();
        
        const totalAnnouncementsEl = document.getElementById('totalAnnouncements');
        const activeAnnouncementsEl = document.getElementById('activeAnnouncements');
        const todayAnnouncementsEl = document.getElementById('todayAnnouncements');
        
        if (totalAnnouncementsEl) {
            totalAnnouncementsEl.textContent = stats.totalAnnouncements;
        }
        
        if (activeAnnouncementsEl) {
            activeAnnouncementsEl.textContent = stats.activeAnnouncements;
        }
        
        if (todayAnnouncementsEl) {
            todayAnnouncementsEl.textContent = stats.todayAnnouncements;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AnnouncementsManager();
});