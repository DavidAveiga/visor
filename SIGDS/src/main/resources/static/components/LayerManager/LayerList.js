import { MapSingleton } from '../../js/MapSingleton.js';
import { SessionManager } from '../../js/SessionManager.js';

// --- CONFIGURACIÓN GEOSERVER ---
// Asegúrate de que GeoServer esté corriendo en el puerto 8080
const GEOSERVER_BASE_URL = 'http://localhost:8080/geoserver';
// IMPORTANTE: Este nombre debe coincidir EXACTAMENTE con tu Workspace en GeoServer
const WORKSPACE = 'sigds'; 

export class LayerList {
    constructor() {
        this.userRole = SessionManager.getRole();
        this.layers = []; 
        this.isVisible = false;
    }

    getHtml() {
        return `
            <div id="layerMenu" class="layer-menu-container" style="display: none;">
                <div class="layer-menu-header">
                    <h4>CAPAS DISPONIBLES</h4>
                    <button id="btnCloseLayers" class="close-btn" aria-label="Cerrar">&times;</button>
                </div>
                <div id="layersListContainer" class="layers-list">
                    <p class="loading-text">Inicializando...</p>
                </div>
            </div>
        `;
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = this.getHtml();
        this.addListeners();
    }

    addListeners() {
        const closeBtn = document.getElementById('btnCloseLayers');

        // Escuchar evento global desde la barra lateral
        document.addEventListener('toggleLayerPanel', (e) => {
            // Si el evento trae 'forceRefresh', recargamos la lista
            const forceRefresh = e.detail && e.detail.forceRefresh;
            this.togglePanel(null, forceRefresh);
        });

        if(closeBtn) closeBtn.addEventListener('click', () => {
            this.togglePanel(false);
        });
    }

    togglePanel(forceState = null, forceRefresh = false) {
        const menu = document.getElementById('layerMenu');
        if (!menu) return;

        this.isVisible = forceState !== null ? forceState : !this.isVisible;
        menu.style.display = this.isVisible ? 'block' : 'none';

        if (this.isVisible || forceRefresh) {
            this.fetchLayers();
        }
    }

    async fetchLayers() {
        const container = document.getElementById('layersListContainer');
        // Solo mostramos 'Cargando' si la lista está vacía para evitar parpadeos
        if(container.innerHTML.trim() === '') container.innerHTML = '<p class="loading-text">Cargando capas...</p>';

        try {
            // Llamada al Backend Java (Spring Boot puerto 8081)
            const response = await fetch('/api/v1/layers');
            if (!response.ok) throw new Error('Error de conexión con el servidor');

            this.layers = await response.json();
            this.renderLayerItems();

        } catch (error) {
            console.error("LayerFetch Error:", error);
            container.innerHTML = '<p class="error-text">No se pudieron cargar las capas.</p>';
        }
    }

    renderLayerItems() {
        const container = document.getElementById('layersListContainer');
        container.innerHTML = '';

        if (this.layers.length === 0) {
            container.innerHTML = '<p class="empty-text">No hay capas públicas disponibles.</p>';
            return;
        }

        const isAdmin = this.userRole === 'ADMIN' || this.userRole === 'SUPERADMIN';

        this.layers.forEach(layer => {
            const item = document.createElement('div');
            item.className = 'layer-item';
            
            item.innerHTML = `
                <div class="layer-info">
                    <label class="switch">
                        <input type="checkbox" id="chk-${layer.id}" ${layer.isVisible ? 'checked' : ''}>
                        <span class="slider round" style="background-color: ${layer.isVisible ? '#2196F3' : '#ccc'}"></span>
                    </label>
                    <span class="layer-name" title="${layer.name}" style="border-left: 4px solid ${layer.color}; padding-left: 8px;">
                        ${layer.name}
                    </span>
                </div>
                
                ${isAdmin ? `
                <div class="layer-actions">
                    <button class="delete-btn" data-id="${layer.id}" title="Eliminar Capa permanentemente">🗑️</button>
                </div>
                ` : ''}
            `;

            // Evento: Activar/Desactivar capa
            const checkbox = item.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                this.toggleLayerOnMap(layer, e.target.checked);
            });

            // Evento: Eliminar capa (Solo Admin)
            if (isAdmin) {
                const deleteBtn = item.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => this.deleteLayer(layer.id));
            }

            container.appendChild(item);
            
            // Si la capa viene marcada como visible desde la BD, aseguramos que se muestre en el mapa al cargar
            if(layer.isVisible && checkbox.checked) {
                // El tercer parámetro true indica que es carga inicial (no forzar recarga si ya existe)
                this.toggleLayerOnMap(layer, true, true); 
            }
        });
    }

    /**
     * Lógica WMS: Conecta OpenLayers con GeoServer
     */
    toggleLayerOnMap(layerData, isVisible, isInit = false) {
        const map = new MapSingleton().getMap();
        if (!map) return;

        // Buscamos si la capa ya existe en el mapa usando el ID como referencia
        const existingLayer = map.getLayers().getArray().find(l => l.get('id') === layerData.id);

        if (isVisible) {
            if (!existingLayer) {
                // Construimos la fuente WMS apuntando a GeoServer
                const wmsSource = new ol.source.ImageWMS({
                    url: `${GEOSERVER_BASE_URL}/${WORKSPACE}/wms`, // Ej: http://localhost:8080/geoserver/sigds/wms
                    params: {
                        'LAYERS': `${WORKSPACE}:${layerData.name}`, // Ej: sigds:nombre_capa
                        'TILED': true,
                        'VERSION': '1.1.1'
                    },
                    serverType: 'geoserver',
                    crossOrigin: 'anonymous' // Necesario para evitar problemas de CORS en canvas
                });

                const wmsLayer = new ol.layer.Image({
                    source: wmsSource,
                    opacity: 0.8 // Un poco de transparencia para ver el mapa base
                });

                // Guardamos metadatos en la capa de OpenLayers para identificarla después
                wmsLayer.set('id', layerData.id);
                wmsLayer.set('name', layerData.name);

                map.addLayer(wmsLayer);
                console.log(`Capa WMS añadida: ${layerData.name}`);
            }
        } else {
            if (existingLayer) {
                map.removeLayer(existingLayer);
                console.log(`Capa WMS removida: ${layerData.name}`);
            }
        }
    }

    async deleteLayer(layerId) {
        if (!confirm('¿Estás seguro de eliminar esta capa? Se borrará de la base de datos y del mapa.')) return;

        try {
            const token = SessionManager.getToken();
            const response = await fetch(`/api/v1/layers/${layerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` // Token necesario para SecurityConfig
                }
            });

            if (response.ok) {
                // Quitamos la capa del mapa visualmente si estaba puesta
                this.toggleLayerOnMap({ id: layerId }, false);
                
                // Recargamos la lista
                this.fetchLayers(); 
                alert("Capa eliminada correctamente.");
            } else {
                alert("Error al eliminar: Verifica tus permisos de Administrador.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al intentar eliminar.");
        }
    }
}