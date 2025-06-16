// Authentication management
class AuthManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.isLoading = true;
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/user');
            if (response.ok) {
                this.user = await response.json();
                this.isAuthenticated = true;
            } else {
                this.user = null;
                this.isAuthenticated = false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.user = null;
            this.isAuthenticated = false;
        } finally {
            this.isLoading = false;
        }
    }

    loginWithGoogle() {
        window.location.href = '/api/auth/google';
    }

    loginWithReplit() {
        window.location.href = '/api/login';
    }

    // Default login (prefer Google if available)
    login() {
        this.loginWithGoogle();
    }

    logout() {
        window.location.href = '/api/logout';
    }

    getUserInitials() {
        if (!this.user) return 'U';
        const name = this.user.firstName || this.user.email || 'User';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    getUserName() {
        return this.user?.firstName || this.user?.email || 'User';
    }

    getUserEmail() {
        return this.user?.email || '';
    }
}

// Global auth instance
window.auth = new AuthManager();