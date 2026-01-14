/**
 * Singleton para gestionar la sesión del usuario (Token JWT y Roles)
 * Centraliza el acceso a localStorage para evitar inconsistencias.
 */
export class SessionManager {
    static get tokenKey() { return 'jwt_token'; }

    static getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    static setToken(token) {
        if (token) {
            localStorage.setItem(this.tokenKey, token);
        }
    }

    static removeSession() {
        localStorage.removeItem(this.tokenKey);
        // Opcional: Limpiar otros datos si existieran
    }

    static isLoggedIn() {
        const token = this.getToken();
        // Validación básica: que exista y tenga 3 partes (header.payload.signature)
        return token && token.split('.').length === 3;
    }

    /**
     * Decodifica el payload del JWT para obtener datos del usuario sin llamar al backend.
     * @returns {object|null} { sub: "email", role: "ADMIN", ... }
     */
    static getUserData() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("Error decodificando token:", e);
            return null;
        }
    }

    static getRole() {
        const data = this.getUserData();
        // El backend guarda el rol en la claim 'role' o 'authorities'
        // Ajusta según cómo JwtUtil genere el token.
        return data ? (data.role || data.roles || 'VISUALIZADOR') : 'VISUALIZADOR';
    }

    static logout() {
        this.removeSession();
        window.location.href = '/components/Pages/login.html';
    }
}