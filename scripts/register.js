// ===== REGISTRATION PAGE FUNCTIONALITY =====

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (authManager.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    const accountTypeSelector = document.getElementById('accountTypeSelector');
    const universityForm = document.getElementById('universityForm');
    const companyForm = document.getElementById('companyForm');
    const authLinks = document.getElementById('authLinks');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const errorText = document.getElementById('errorText');
    const successText = document.getElementById('successText');

    let currentFormType = null;

    // Account type selection
    const accountTypeBtns = document.querySelectorAll('.account-type-btn');
    accountTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            showForm(type);
        });
    });

    // Back buttons
    const backFromUniversity = document.getElementById('backFromUniversity');
    const backFromCompany = document.getElementById('backFromCompany');

    if (backFromUniversity) {
        backFromUniversity.addEventListener('click', showAccountTypeSelector);
    }

    if (backFromCompany) {
        backFromCompany.addEventListener('click', showAccountTypeSelector);
    }

    // Form submissions
    if (universityForm) {
        universityForm.addEventListener('submit', handleUniversityRegistration);
    }

    if (companyForm) {
        companyForm.addEventListener('submit', handleCompanyRegistration);
    }

    // Show account type selector
    function showAccountTypeSelector() {
        accountTypeSelector.style.display = 'block';
        universityForm.style.display = 'none';
        companyForm.style.display = 'none';
        authLinks.style.display = 'block';
        currentFormType = null;
        
        // Hide messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    // Show specific form
    function showForm(type) {
        accountTypeSelector.style.display = 'none';
        authLinks.style.display = 'none';
        currentFormType = type;
        
        // Hide messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        if (type === 'university') {
            universityForm.style.display = 'block';
            companyForm.style.display = 'none';
        } else if (type === 'company') {
            universityForm.style.display = 'none';
            companyForm.style.display = 'block';
            
            // Show industry field for companies
            const industryGroup = document.getElementById('editIndustryGroup');
            if (industryGroup) {
                industryGroup.style.display = 'block';
            }
        }
    }

    // Handle university registration
    async function handleUniversityRegistration(e) {
        e.preventDefault();
        
        const submitBtn = universityForm.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn);
        
        // Hide previous messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        try {
            const formData = new FormData(universityForm);
            const userData = {
                type: 'university',
                universityName: formData.get('universityName').trim(),
                email: formData.get('email').trim(),
                phone: formData.get('phone').trim(),
                address: formData.get('address').trim(),
                website: formData.get('website').trim(),
                description: formData.get('description').trim(),
                contactPerson: formData.get('contactPerson').trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Register user
            const result = await authManager.registerUser(userData);
            
            if (result.success) {
                successText.textContent = result.message;
                successMessage.style.display = 'flex';
                
                // Reset form
                universityForm.reset();
                
                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            errorText.textContent = error.message;
            errorMessage.style.display = 'flex';
            LoadingManager.hide(submitBtn);
        }
    }

    // Handle company registration
    async function handleCompanyRegistration(e) {
        e.preventDefault();
        
        const submitBtn = companyForm.querySelector('button[type="submit"]');
        LoadingManager.show(submitBtn);
        
        // Hide previous messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        try {
            const formData = new FormData(companyForm);
            const userData = {
                type: 'company',
                companyName: formData.get('companyName').trim(),
                email: formData.get('email').trim(),
                phone: formData.get('phone').trim(),
                address: formData.get('address').trim(),
                website: formData.get('website').trim(),
                industry: formData.get('industry'),
                description: formData.get('description').trim(),
                contactPerson: formData.get('contactPerson').trim(),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };

            // Register user
            const result = await authManager.registerUser(userData);
            
            if (result.success) {
                successText.textContent = result.message;
                successMessage.style.display = 'flex';
                
                // Reset form
                companyForm.reset();
                
                // Redirect to login after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } else {
                throw new Error(result.message);
            }
            
        } catch (error) {
            errorText.textContent = error.message;
            errorMessage.style.display = 'flex';
            LoadingManager.hide(submitBtn);
        }
    }

    // Real-time validation
    setupRealTimeValidation();

    function setupRealTimeValidation() {
        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !Utils.isValidEmail(input.value)) {
                    input.classList.add('error');
                    showFieldError(input, 'Невірний формат email');
                } else {
                    input.classList.remove('error');
                    hideFieldError(input);
                }
            });
        });

        // Phone validation
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value && !Utils.isValidPhone(input.value)) {
                    input.classList.add('error');
                    showFieldError(input, 'Невірний формат телефону');
                } else {
                    input.classList.remove('error');
                    hideFieldError(input);
                }
            });
        });

        // Password confirmation
        const passwordInputs = document.querySelectorAll('input[name="password"]');
        const confirmPasswordInputs = document.querySelectorAll('input[name="confirmPassword"]');
        
        confirmPasswordInputs.forEach(confirmInput => {
            confirmInput.addEventListener('blur', () => {
                const form = confirmInput.closest('form');
                const passwordInput = form.querySelector('input[name="password"]');
                
                if (confirmInput.value && passwordInput.value !== confirmInput.value) {
                    confirmInput.classList.add('error');
                    showFieldError(confirmInput, 'Паролі не співпадають');
                } else {
                    confirmInput.classList.remove('error');
                    hideFieldError(confirmInput);
                }
            });
        });

        // Password strength indicator
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => {
                showPasswordStrength(input);
            });
        });
    }

    function showFieldError(input, message) {
        hideFieldError(input); // Remove existing error
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: var(--error-color);
            font-size: 0.8rem;
            margin-top: 0.25rem;
        `;
        errorDiv.textContent = message;
        
        input.parentNode.appendChild(errorDiv);
    }

    function hideFieldError(input) {
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    function showPasswordStrength(input) {
        const password = input.value;
        let strength = 0;
        let feedback = [];

        if (password.length >= 6) strength++;
        else feedback.push('мінімум 6 символів');

        if (/[a-z]/.test(password)) strength++;
        else feedback.push('маленькі літери');

        if (/[A-Z]/.test(password)) strength++;
        else feedback.push('великі літери');

        if (/[0-9]/.test(password)) strength++;
        else feedback.push('цифри');

        if (/[^A-Za-z0-9]/.test(password)) strength++;
        else feedback.push('спеціальні символи');

        // Remove existing strength indicator
        const existingIndicator = input.parentNode.querySelector('.password-strength');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (password.length > 0) {
            const strengthDiv = document.createElement('div');
            strengthDiv.className = 'password-strength';
            strengthDiv.style.cssText = `
                margin-top: 0.5rem;
                font-size: 0.8rem;
            `;

            const strengthLevels = ['Дуже слабкий', 'Слабкий', 'Середній', 'Сильний', 'Дуже сильний'];
            const strengthColors = ['#e74c3c', '#f39c12', '#f1c40f', '#27ae60', '#2ecc71'];
            
            const level = Math.min(strength, 4);
            strengthDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="flex: 1; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${(level + 1) * 20}%; height: 100%; background: ${strengthColors[level]}; transition: all 0.3s;"></div>
                    </div>
                    <span style="color: ${strengthColors[level]};">${strengthLevels[level]}</span>
                </div>
                ${feedback.length > 0 ? `<div style="color: var(--text-secondary); margin-top: 0.25rem;">Додайте: ${feedback.join(', ')}</div>` : ''}
            `;

            input.parentNode.appendChild(strengthDiv);
        }
    }

    // Character counters for textareas
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.getAttribute('maxlength'));
        
        // Create counter
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = `
            text-align: right;
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        `;
        
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
        textarea.parentNode.appendChild(counter);
        updateCounter();
    });
});