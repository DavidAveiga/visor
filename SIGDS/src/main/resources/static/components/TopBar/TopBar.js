import { MapSingleton } from '../../js/MapSingleton.js';
import { DocumentationMenu } from './DocumentationMenu.js';
import { SessionManager } from '../../js/SessionManager.js';

export class TopBar {
    constructor() {
        this.docMenuComponent = new DocumentationMenu();
    }

    getHtml() {
        return `
            <header class="top-bar">
                <div class="logo-area" id="logoArea">
                    <img src="icons/Logo SIGDSB.svg" alt="SIGDS" class="logo-img" onerror="this.style.display='none'">
                    <div class="logo-text">
                        <h1>SIG<span>DS</span></h1>
                        <p>Sistema de Información Geográfica<br>Para El Desarrollo Sostenible</p>
                    </div>
                </div>

                <nav class="nav-menu">
                    <button id="btnVisor" class="nav-link active">VISOR</button>
                    <button id="btnAyuda" class="nav-link">AYUDA</button>
                    
                    <div class="dropdown-container" id="docsContainer">
                        <button id="btnDocs" class="nav-link">DOCUMENTACIÓN <span>&#9662;</span></button>
                        </div>
                </nav>

                <div class="auth-area" id="authArea">
                    </div>
            </header>
        `;
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = this.getHtml();
        
        // Inicializar sub-componentes
        this.docMenuComponent.render('docsContainer');

        this.updateAuthUI();
        this.addListeners();
    }

    /**
     * Actualiza la interfaz según el estado de sesión (VISUALIZADOR vs ADMIN)
     */
    updateAuthUI() {
        const authArea = document.getElementById('authArea');
        if (!authArea) return;

        if (SessionManager.isLoggedIn()) {
            const userData = SessionManager.getUserData();
            const email = userData ? userData.sub : 'Usuario'; // 'sub' suele ser el email en JWT
            const role = SessionManager.getRole();

            authArea.innerHTML = `
                <div class="user-info">
                    <span class="user-role">${role}</span>
                    <span class="user-email">${email}</span>
                </div>
                <button id="btnLogout" class="logout-btn" title="Cerrar Sesión">
                    ⏻
                </button>
            `;
            
            // Listener para Logout
            document.getElementById('btnLogout').addEventListener('click', () => {
                SessionManager.logout();
            });

        } else {
            // Si es Visualizador anónimo
            authArea.innerHTML = `
                <a href="components/Pages/login.html" class="login-link-btn">INICIAR SESIÓN</a>
            `;
        }
    }

    addListeners() {
        // VISOR: Reiniciar Mapa
        const btnVisor = document.getElementById('btnVisor');
        if (btnVisor) {
            btnVisor.addEventListener('click', () => {
                const map = new MapSingleton().getMap();
                if(map) {
                    map.getView().animate({ 
                        center: ol.proj.fromLonLat([-80.45, -1.05]), 
                        zoom: 13, 
                        duration: 1000 
                    });
                }
            });
        }

        // AYUDA
        const btnAyuda = document.getElementById('btnAyuda');
        if (btnAyuda) btnAyuda.addEventListener('click', () => window.open('ayuda.html', '_blank'));

        // DOCUMENTACIÓN
        const btnDocs = document.getElementById('btnDocs');
        if (btnDocs) {
            btnDocs.addEventListener('click', (e) => {
                e.stopPropagation();
                this.docMenuComponent.toggle();
                btnDocs.classList.toggle('active');
            });
        }

        // LOGO
        const logoArea = document.getElementById('logoArea');
        if (logoArea) {
            logoArea.style.cursor = 'pointer';
            logoArea.addEventListener('click', () => window.open('https://www.utm.edu.ec/', '_blank'));
        }
    }
}