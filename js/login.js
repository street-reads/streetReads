// Login form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous messages
        messageDiv.innerHTML = '';
        messageDiv.className = 'message';
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validate form
        const validation = validateLoginForm(data);
        
        if (validation.isValid) {
            // Simulate login process
            simulateLogin(data);
        } else {
            showMessage(validation.message, 'error');
        }
    });
    
    // Email validation
    const email = document.getElementById('email');
    email.addEventListener('input', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.value && !emailRegex.test(email.value)) {
            email.setCustomValidity('Please enter a valid email address');
        } else {
            email.setCustomValidity('');
        }
    });
    
    // Forgot password handler
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        showMessage('Password reset functionality would be implemented here.', 'error');
    });
});

// Form validation function
function validateLoginForm(data) {
    const errors = [];
    
    // Check required fields
    if (!data.email.trim()) {
        errors.push('Email is required');
    } else if (!isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!data.password) {
        errors.push('Password is required');
    } else if (data.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    return {
        isValid: errors.length === 0,
        message: errors.length > 0 ? errors.join('. ') : ''
    };
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Simulate login process
function simulateLogin(data) {
    showMessage('Logging in...', 'success');
    
    // Simulate API call delay
    setTimeout(() => {
        // Mock validation - in real app, this would be an API call
        if (data.email === 'demo@example.com' && data.password === 'password123') {
            showMessage('Login successful! Redirecting...', 'success');
            
            // Simulate redirect after successful login
            setTimeout(() => {
                // In a real application, you would redirect to dashboard or home page
                showMessage('Redirecting to dashboard...', 'success');
                // window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showMessage('Invalid email or password. Please try again.', 'error');
        }
    }, 1500);
}

// Show message function
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = message;
    messageDiv.className = `message ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.innerHTML = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}

// Demo credentials display (remove in production)
document.addEventListener('DOMContentLoaded', function() {
    // Add demo credentials info
    const container = document.querySelector('.container');
    const demoInfo = document.createElement('div');
    demoInfo.style.cssText = `
        background-color: #e7f3ff;
        border: 1px solid #b3d9ff;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 20px;
        font-size: 14px;
        color: #0066cc;
    `;
    demoInfo.innerHTML = `
        <strong>Demo Credentials:</strong><br>
        Email: demo@example.com<br>
        Password: password123
    `;
    container.insertBefore(demoInfo, container.firstChild);
});
