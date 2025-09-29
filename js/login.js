// Login form with Firebase Authentication
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
            // Login user with Firebase
            loginUser(data);
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
        const email = document.getElementById('email').value;
        
        if (!email) {
            showMessage('Please enter your email address first.', 'error');
            return;
        }
        
        sendPasswordReset(email);
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

// Login user with Firebase
function loginUser(data) {
    showMessage('Logging in...', 'success');
    
    // Check if auth is available
    if (!auth) {
        showMessage('Firebase authentication is not available. Please check your configuration.', 'error');
        return;
    }
    
    console.log('Attempting to login with email:', data.email);
    
    // Sign in with Firebase Auth
    auth.signInWithEmailAndPassword(data.email, data.password)
        .then((userCredential) => {
            // User signed in successfully
            const user = userCredential.user;
            showMessage(`Welcome back, ${user.displayName || user.email}! Redirecting...`, 'success');
            
            // Redirect to dashboard or main page after 2 seconds
            setTimeout(() => {
                // window.location.href = 'dashboard.html'; // Uncomment when you have a dashboard
                console.log('User logged in:', user);
            }, 2000);
        })
        .catch((error) => {
            // Handle errors
            let errorMessage = 'Login failed. Please try again.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        });
}

// Send password reset email
function sendPasswordReset(email) {
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showMessage('Password reset email sent! Check your inbox.', 'success');
        })
        .catch((error) => {
            let errorMessage = 'Failed to send password reset email.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
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
        // User is already logged in, show welcome message
        showMessage(`Welcome back, ${user.displayName || user.email}!`, 'success');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
            // window.location.href = 'dashboard.html'; // Uncomment when you have a dashboard
            console.log('User already logged in:', user);
        }, 2000);
    }
});