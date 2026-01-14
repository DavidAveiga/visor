// Configuración API
const API_URL = '/api/v1/auth'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. LÓGICA DE LOGIN (Solo se ejecuta en login.html)
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');

            setLoading(btn, true, "Verificando...");

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('jwt_token', data.token);
                    // Redirigir al mapa (subiendo 2 niveles desde components/Pages)
                    window.location.href = '../../index.html'; 
                } else {
                    alert('Acceso denegado: Credenciales incorrectas.');
                }
            } catch (error) {
                console.error(error);
                alert('No se pudo conectar con el servidor.');
            } finally {
                setLoading(btn, false, "INGRESAR");
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE REGISTRO (Funciona en Modal o Página register.html)
    // ==========================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPass').value;
            
            // Validación extra si existe el campo de confirmar
            const passConfirm = document.getElementById('regPassConfirm');
            if (passConfirm && password !== passConfirm.value) {
                alert("Las contraseñas no coinciden.");
                return;
            }

            const btn = registerForm.querySelector('button');
            setLoading(btn, true, "Registrando...");

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // El DTO espera: email, password, name (opcional según tu backend)
                    body: JSON.stringify({ email, password, name }) 
                });

                if (response.ok) {
                    const data = await response.json();
                    alert("¡Cuenta creada exitosamente!");
                    
                    // Auto-login: Guardamos token y vamos al mapa
                    localStorage.setItem('jwt_token', data.token);
                    window.location.href = '../../index.html';
                } else {
                    alert("Error: Es posible que el correo ya esté registrado.");
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión al intentar registrarse.");
            } finally {
                setLoading(btn, false, "CREAR CUENTA");
            }
        });
    }

    // ==========================================
    // 3. BOTÓN VISOR DIRECTO (Login sin cuenta)
    // ==========================================
    const btnVisor = document.getElementById('btnVisorDirect');
    if (btnVisor) {
        btnVisor.addEventListener('click', () => {
            localStorage.removeItem('jwt_token'); // Limpiamos sesión vieja
            window.location.href = '../../index.html';
        });
    }

    // ==========================================
    // 4. UTILIDADES
    // ==========================================
    function setLoading(btn, isLoading, text) {
        if(!btn) return;
        btn.disabled = isLoading;
        btn.innerText = text;
        btn.style.opacity = isLoading ? "0.7" : "1";
        btn.style.cursor = isLoading ? "wait" : "pointer";
    }
});