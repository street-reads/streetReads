// Signup form with Firebase Authentication
let form; // Declare form variable in global scope

document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    
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
        const validation = validateForm(data);
        
        if (validation.isValid) {
            // Register user with Firebase
            registerUser(data);
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
    
    // Real-time password confirmation validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    confirmPassword.addEventListener('input', function() {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });
    
    password.addEventListener('input', function() {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });
});

// Form validation function
function validateForm(data) {
    const errors = [];
    
    // Check required fields
    if (!data.firstName.trim()) {
        errors.push('First name is required');
    }
    
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
    
    if (!data.confirmPassword) {
        errors.push('Please confirm your password');
    } else if (data.password !== data.confirmPassword) {
        errors.push('Passwords do not match');
    }
    
    if (!data.terms) {
        errors.push('You must agree to the terms and conditions');
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

// Register user with Firebase
function registerUser(data) {
    showMessage('Creating your account...', 'success');
    
    // Check if auth is available
    if (!auth) {
        showMessage('Firebase authentication is not available. Please check your configuration.', 'error');
        return;
    }
    
    console.log('Attempting to create user with email:', data.email);
    
    // Create user with Firebase Auth
    auth.createUserWithEmailAndPassword(data.email, data.password)
        .then((userCredential) => {
            // User created successfully
            const user = userCredential.user;
            
            // Update user profile with display name
            return user.updateProfile({
                displayName: data.firstName
            });
        })
        .then(() => {
            // Profile updated successfully
            showMessage('Account created successfully! Redirecting to login...', 'success');
            
            // Clear form
            if (form) {
                form.reset();
            }
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        })
        .catch((error) => {
            // Handle errors
            let errorMessage = 'An error occurred during registration.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection and try again.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        });
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

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is already logged in, redirect to dashboard or main page
        showMessage('You are already logged in. Redirecting...', 'success');
        setTimeout(() => {
            // window.location.href = 'dashboard.html'; // Uncomment when you have a dashboard
        }, 2000);
    }
});