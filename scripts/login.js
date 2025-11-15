// ===== LOGIN PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (authManager.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const errorText = document.getElementById('errorText');
    const successText = document.getElementById('successText');

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn);
        
        // Hide previous messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        // Get form data
        const formData = new FormData(loginForm);
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';
        
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Будь ласка, заповніть всі поля');
            }
            
            if (!Utils.isValidEmail(email)) {
                throw new Error('Невірний формат email');
            }
            
            // Attempt login
            const result = await authManager.loginUser(email, password, rememberMe);
            
            if (result.success) {
                // Show success message
                successText.textContent = result.message;
                successMessage.style.display = 'flex';
                
                // Redirect after short delay
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                    window.location.href = redirectUrl;
                }, 1500);
                
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            errorText.textContent = error.message;
            errorMessage.style.display = 'flex';
            LoadingManager.hide(submitBtn);
        }
    });
    
    // Auto-fill email if remembered
    const rememberMe = localStorage.getItem('rememberMe');
    if (rememberMe === 'true') {
        const emailInput = document.getElementById('email');
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail && emailInput) {
            emailInput.value = savedEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }
    
    // Save email when remember me is checked
    const emailInput = document.getElementById('email');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    if (emailInput && rememberMeCheckbox) {
        emailInput.addEventListener('blur', () => {
            if (rememberMeCheckbox.checked && emailInput.value) {
                localStorage.setItem('savedEmail', emailInput.value);
            }
        });
        
        rememberMeCheckbox.addEventListener('change', () => {
            if (!rememberMeCheckbox.checked) {
                localStorage.removeItem('savedEmail');
            } else if (emailInput.value) {
                localStorage.setItem('savedEmail', emailInput.value);
            }
        });
    }
    
    // Demo login buttons (for testing)
    createDemoLoginButtons();
});

// Create demo login buttons for easy testing
function createDemoLoginButtons() {
    const authCard = document.querySelector('.auth-card');
    if (!authCard) return;
    
    const demoSection = document.createElement('div');
    demoSection.className = 'demo-section';
    demoSection.style.cssText = `
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-color);
        text-align: center;
    `;
    
    demoSection.innerHTML = `
        <h4 style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9rem;">
            Демо-акаунти для тестування:
        </h4>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
            <button type="button" class="btn btn-outline demo-login-btn" data-email="info@knu.ua" data-password="password123" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                <i class="fas fa-university"></i> КНУ
            </button>
            <button type="button" class="btn btn-outline demo-login-btn" data-email="hr@techukraine.com" data-password="password123" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                <i class="fas fa-building"></i> TechUkraine
            </button>
            <button type="button" class="btn btn-outline demo-login-btn" data-email="info@kpi.ua" data-password="password123" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
                <i class="fas fa-university"></i> КПІ
            </button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.5rem;">
            Натисніть на кнопку для автоматичного заповнення форми
        </p>
    `;
    
    authCard.appendChild(demoSection);
    
    // Add event listeners to demo buttons
    const demoBtns = demoSection.querySelectorAll('.demo-login-btn');
    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.getAttribute('data-email');
            const password = btn.getAttribute('data-password');
            
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            
            // Add visual feedback
            btn.style.background = 'var(--success-color)';
            btn.style.color = 'white';
            btn.style.borderColor = 'var(--success-color)';
            
            setTimeout(() => {
                btn.style.background = '';
                btn.style.color = '';
                btn.style.borderColor = '';
            }, 1000);
        });
    });
}