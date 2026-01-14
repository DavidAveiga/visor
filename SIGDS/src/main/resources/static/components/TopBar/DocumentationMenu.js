/**
 * Componente: DocumentationMenu
 * Responsabilidad: Gestionar el despliegue de información de capas, 
 * renderizado dinámico del árbol de categorías y filtrado de búsqueda.
 */
export class DocumentationMenu {
    constructor() {
        this.containerId = 'docsMenuContainer';
        this.data = []; // Almacenará la metadata de las capas traída del backend
    }

    /**
     * Retorna la estructura base del menú.
     * Nota: El contenido de la lista se llenará dinámicamente.
     */
    getHtml() {
        return `
            <div id="docsMenu" class="doc-panel" style="display: none;">
                <div class="doc-header">
                    <h4>Capas y Categorías</h4>
                    <button id="btnCloseDocs" class="close-btn" aria-label="Cerrar menú">&times;</button>
                </div>
                
                <div class="search-box">
                    <input type="text" id="docSearchInput" placeholder="Buscar capas o atributos..." autocomplete="off">
                    <span class="search-icon">🔍</span>
                </div>

                <ul id="layersTreeContainer" class="layer-list">
                    <li class="loading-text">Cargando documentación...</li>
                </ul>
            </div>
        `;
    }

    /**
     * Inicializa el componente dentro del contenedor padre.
     */
    render(parentId) {
        const parent = document.getElementById(parentId);
        if (!parent) return;

        // Inyectamos el HTML del menú dentro del padre (la TopBar)
        parent.insertAdjacentHTML('beforeend', this.getHtml());
        
        this.cacheDomElements();
        this.addListeners();
        this.fetchLayerData(); // Simulamos o llamamos al backend
    }

    cacheDomElements() {
        this.menu = document.getElementById('docsMenu');
        this.closeBtn = document.getElementById('btnCloseDocs');
        this.searchInput = document.getElementById('docSearchInput');
        this.treeContainer = document.getElementById('layersTreeContainer');
    }

    addListeners() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.toggle(false));
        }

        if (this.searchInput) {
            this.searchInput.addEventListener('keyup', (e) => this.handleSearch(e.target.value));
        }
    }

    /**
     * Alterna la visibilidad del menú.
     * @param {boolean} show - Fuerza mostrar u ocultar. Si es null, hace toggle.
     */
    toggle(show = null) {
        if (!this.menu) return;
        const isVisible = this.menu.classList.contains('visible');
        const shouldShow = show !== null ? show : !isVisible;

        if (shouldShow) {
            this.menu.classList.add('visible');
            this.menu.style.display = 'block';
        } else {
            this.menu.classList.remove('visible');
            setTimeout(() => { 
                if(!this.menu.classList.contains('visible')) this.menu.style.display = 'none'; 
            }, 300); // Esperar transición CSS si existe
        }
    }

    /**
     * Simulación de llamada al Backend. 
     * En el futuro, esto llamará a fetch('/api/v1/layers/documentation')
     */
    async fetchLayerData() {
        try {
            // TODO: Reemplazar con llamada real al servicio LayerService
            // const response = await fetch('/api/v1/layers');
            // const data = await response.json();
            
            // Datos simulados basados en el PDF (Pag 1 - UTM FACULTADES)
            const mockData = [
                {
                    id: 1,
                    name: 'UTM FACULTADES',
                    categories: [
                        { name: 'Facultad de Ciencias', location: [-80.45, -1.05] },
                        { name: 'Facultad de Salud', location: [-80.46, -1.06] },
                        { name: 'Facultad de Ingeniería', location: [-80.44, -1.04] }
                    ]
                },
                {
                    id: 2,
                    name: 'RUTA DE EVACUACIÓN',
                    categories: [
                        { name: 'Ruta Principal', location: [-80.45, -1.05] }
                    ]
                }
            ];

            this.data = mockData;
            this.renderTree(this.data);

        } catch (error) {
            console.error("Error cargando documentación:", error);
            this.treeContainer.innerHTML = '<li class="error-text">Error cargando datos.</li>';
        }
    }

    /**
     * Renderiza el árbol de capas y categorías.
     */
    renderTree(layers) {
        if (!layers || layers.length === 0) {
            this.treeContainer.innerHTML = '<li>No hay información disponible.</li>';
            return;
        }

        this.treeContainer.innerHTML = layers.map(layer => `
            <li class="layer-item">
                <details open>
                    <summary>
                        <span class="layer-name">${layer.name}</span>
                    </summary>
                    <ul class="category-list">
                        ${layer.categories.map(cat => `
                            <li class="category-item" data-search="${cat.name.toLowerCase()}">
                                📄 ${cat.name}
                            </li>
                        `).join('')}
                    </ul>
                </details>
            </li>
        `).join('');
    }

    /**
     * Lógica de filtrado (Search Strategy)
     */
    handleSearch(query) {
        const filter = query.toLowerCase();
        const items = this.treeContainer.querySelectorAll('.category-item');
        
        items.forEach(item => {
            const text = item.dataset.search;
            const match = text.includes(filter);
            item.style.display = match ? "block" : "none";
            
            // Lógica visual: Si una categoría coincide, abrimos el details padre
            if (match) {
                const parentDetails = item.closest('details');
                if (parentDetails) parentDetails.open = true;
                item.classList.add('highlight');
            } else {
                item.classList.remove('highlight');
            }
        });
    }
}