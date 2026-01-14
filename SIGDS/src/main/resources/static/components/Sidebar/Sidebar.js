import { SessionManager } from '../../js/SessionManager.js';
import { MapSingleton } from '../../js/MapSingleton.js';

export class Sidebar {
    constructor() {
        this.userRole = SessionManager.getRole();
        // Referencia a la capa vectorial usada para resaltar búsquedas
        this.searchLayer = null; 
    }

    getHtml() {
        // Regla de Negocio: VISUALIZADOR no puede ver "Agregar Capa"
        const canAddLayers = this.userRole !== 'VISUALIZADOR';

        return `
            <aside class="sidebar-tools">
                <div class="tool-wrapper">
                    <button class="tool-btn" id="toolSearch" title="Buscar Lugares">
                        <img src="icons/lupa.svg" alt="Buscar">
                    </button>
                    <div id="searchBar" class="search-container">
                        <input type="text" id="searchInput" placeholder="Buscar dirección, edificio..." autocomplete="off">
                        <button id="btnConfirmSearch" class="search-go-btn" title="Ejecutar Búsqueda">
                            <img src="icons/lupa.svg" alt="Ir"> 
                        </button>
                    </div>
                </div>

                <button class="tool-btn" id="toolPrint" title="Imprimir Mapa">
                    <img src="icons/imprimir.svg" alt="Imprimir">
                </button>

                <button class="tool-btn" id="toolShare" title="Compartir Vista">
                    <img src="icons/compartir.svg" alt="Compartir">
                </button>

                <button class="tool-btn" id="toolLayers" title="Gestor de Capas">
                    <img src="icons/capas.svg" alt="Capas">
                </button>
                
                ${canAddLayers ? `
                <button class="tool-btn" id="toolAddLayer" title="Agregar Nueva Capa">
                    <img src="icons/Agregar mas.svg" alt="Agregar">
                </button>` : ''}

                <button class="tool-btn" id="toolMeasure" title="Medir Distancias">
                    <img src="icons/regla.svg" alt="Medir">
                </button>
            </aside>
        `;
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = this.getHtml();
        this.addListeners();
    }

    addListeners() {
        const btns = document.querySelectorAll('.tool-btn');
        const searchBar = document.getElementById('searchBar');
        
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Gestión de estado visual (Botón Activo)
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Lógica específica para la herramienta de búsqueda
                if (btn.id === 'toolSearch') {
                    searchBar.classList.toggle('show');
                    if(searchBar.classList.contains('show')) {
                        setTimeout(() => document.getElementById('searchInput').focus(), 100);
                    }
                } else {
                    searchBar.classList.remove('show');
                }
                
                this.dispatchToolEvent(btn.id);
            });
        });

        // Listeners para el Input de Búsqueda
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('btnConfirmSearch');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.executeSearch(searchInput.value);
            });
            searchInput.addEventListener('click', (e) => e.stopPropagation());
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.executeSearch(searchInput.value);
            });
        }
    }

    dispatchToolEvent(toolId) {
        const actions = {
            'toolPrint': () => window.print(),
            'toolShare': () => this.handleShare(),
            'toolLayers': () => document.dispatchEvent(new CustomEvent('toggleLayerPanel')),
            'toolAddLayer': () => document.dispatchEvent(new CustomEvent('openNewLayerModal')),
            'toolMeasure': () => document.dispatchEvent(new CustomEvent('toggleMeasureTool'))
        };
        if (actions[toolId]) actions[toolId]();
    }

    handleShare() {
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert("¡Enlace copiado al portapapeles!"))
            .catch(err => console.error(err));
    }

    /**
     * Lógica de Búsqueda Profesional
     * 1. Consulta al API Backend.
     * 2. Procesa resultados GeoJSON.
     * 3. Dibuja resultados en capa vectorial.
     * 4. Ajusta la cámara (Zoom) a los resultados.
     */
    async executeSearch(query) {
        if (!query || query.trim().length < 2) {
            alert("Por favor ingresa al menos 2 caracteres.");
            return;
        }
        
        const btn = document.getElementById('btnConfirmSearch');
        const originalIcon = btn.innerHTML;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true">...</span>`;
        btn.disabled = true;

        try {
            // 1. Llamada al Backend
            const response = await fetch(`/api/v1/features/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) throw new Error("Error en el servicio de búsqueda");
            
            const results = await response.json(); // Se espera List<FeatureEntity>

            if (results && results.length > 0) {
                this.highlightResultsOnMap(results);
                console.log(`Búsqueda exitosa: ${results.length} elementos encontrados.`);
            } else {
                alert("No se encontraron coincidencias para: " + query);
                this.clearSearchLayer(); // Limpiar mapa si no hubo resultados nuevos
            }

        } catch (error) {
            console.error("Search Error:", error);
            alert("Ocurrió un error al realizar la búsqueda.");
        } finally {
            btn.innerHTML = originalIcon;
            btn.disabled = false;
        }
    }

    /**
     * Dibuja los resultados en el mapa usando OpenLayers
     */
    highlightResultsOnMap(featureEntities) {
        const map = new MapSingleton().getMap();
        
        // 1. Limpiar capa anterior si existe
        this.clearSearchLayer();

        // 2. Crear Fuente Vectorial
        const vectorSource = new ol.source.Vector();
        const geoJsonFormat = new ol.format.GeoJSON();

        featureEntities.forEach(entity => {
            // El backend devuelve FeatureEntity con campo 'geom'.
            // Validamos que exista geometría antes de procesar
            if (entity.geom) {
                try {
                    // Convertimos la geometría cruda del backend (JSON) a OpenLayers Feature
                    // NOTA: Si el backend devuelve un objeto Geometry JTS serializado, OpenLayers lo entiende 
                    // si tiene formato estándar GeoJSON ({type: "Point", coordinates: [...]})
                    const feature = new ol.Feature({
                        geometry: geoJsonFormat.readGeometry(entity.geom, {
                            dataProjection: 'EPSG:4326', // Asumimos que viene en WGS84
                            featureProjection: map.getView().getProjection() // Proyección del mapa (usualmente Web Mercator)
                        })
                    });

                    // Añadimos propiedades para posibles popups futuros
                    if (entity.properties) {
                        feature.setProperties(JSON.parse(entity.properties));
                    }
                    
                    vectorSource.addFeature(feature);
                } catch (e) {
                    console.warn("Error parseando geometría de entidad:", entity.id, e);
                }
            }
        });

        if (vectorSource.getFeatures().length === 0) return;

        // 3. Crear Estilo de Resaltado (Highlight Style)
        const highlightStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 8,
                fill: new ol.style.Fill({ color: 'rgba(255, 153, 0, 0.8)' }), // Naranja
                stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(255, 153, 0, 0.8)',
                width: 4
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 153, 0, 0.2)'
            })
        });

        // 4. Crear la Capa Vectorial
        this.searchLayer = new ol.layer.Vector({
            source: vectorSource,
            style: highlightStyle,
            zIndex: 999 // Asegurar que esté encima de todo
        });

        map.addLayer(this.searchLayer);

        // 5. Zoom a los resultados (Fit Bounds)
        const extent = vectorSource.getExtent();
        if (!ol.extent.isEmpty(extent)) {
            map.getView().fit(extent, {
                padding: [50, 50, 50, 50], // Padding para no pegar al borde
                maxZoom: 18,
                duration: 1000 // Animación suave de 1 seg
            });
        }
    }

    clearSearchLayer() {
        if (this.searchLayer) {
            const map = new MapSingleton().getMap();
            map.removeLayer(this.searchLayer);
            this.searchLayer = null;
        }
    }
}