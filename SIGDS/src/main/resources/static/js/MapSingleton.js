export class MapSingleton {
    constructor() {
        if (MapSingleton.instance) {
            return MapSingleton.instance;
        }

        // 1. Referencias al DOM del Popup
        this.container = document.getElementById('popup');
        this.content = document.getElementById('popup-content');
        this.closer = document.getElementById('popup-closer');

        // 2. Crear Overlay (Capa flotante para el popup)
        this.overlay = new ol.Overlay({
            element: this.container,
            autoPan: {
                animation: { duration: 250 }
            }
        });

        // Evento para el botón cerrar "X"
        if (this.closer) {
            this.closer.onclick = () => {
                this.overlay.setPosition(undefined); // Ocultar
                this.closer.blur();
                return false;
            };
        }

        // 3. Inicializar Mapa
        this.map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            // Agregamos el overlay al mapa
            overlays: [this.overlay],
            view: new ol.View({
                center: ol.proj.fromLonLat([-80.0525, -0.7092]), // UTM (Manabí)
                zoom: 15
            })
        });

        // 4. Activar el escuchador de clicks
        this.initClickEvent();
        
        MapSingleton.instance = this;
    }

    getMap() {
        return this.map;
    }

    // --- LÓGICA DE CONSULTA WMS (GetFeatureInfo) ---
    initClickEvent() {
        this.map.on('singleclick', (evt) => {
            const viewResolution = this.map.getView().getResolution();
            let url = null;

            // Recorremos las capas para ver cuál es WMS y está visible
            this.map.getLayers().forEach((layer) => {
                // Solo nos interesan las capas WMS (las que vienen de GeoServer)
                if (layer.getVisible() && layer.getSource() instanceof ol.source.TileWMS) {
                    const source = layer.getSource();
                    
                    // Generar URL de consulta WMS
                    // OpenLayers incluye automáticamente los params (como lid:...) que configuraste en LayerList
                    const tempUrl = source.getFeatureInfoUrl(
                        evt.coordinate,
                        viewResolution,
                        'EPSG:3857',
                        { 'INFO_FORMAT': 'application/json' } // Pedimos respuesta en JSON
                    );
                    
                    if (tempUrl) url = tempUrl;
                }
            });

            if (url) {
                this.fetchFeatureInfo(url, evt.coordinate);
            } else {
                // Si hizo clic en la nada, ocultamos el popup
                this.overlay.setPosition(undefined);
            }
        });
    }

    async fetchFeatureInfo(url, coordinate) {
        try {
            const response = await fetch(url);
            const data = await response.json();

            // Si GeoServer devolvió features (algo tocó el clic)
            if (data.features && data.features.length > 0) {
                const feature = data.features[0]; 
                const props = feature.properties;
                
                // Construir HTML de la tabla
                let html = '<h4>Detalles</h4><div style="max-height:200px; overflow-y:auto;"><table class="attr-table">';
                
                // GeoServer a veces devuelve el JSON dentro de un string si usamos SQL View
                // Intentamos parsear si 'properties' es un string JSON
                let attributes = props;
                if (props.properties && typeof props.properties === 'string') {
                     try {
                         attributes = JSON.parse(props.properties);
                     } catch(e) { /* No era JSON, usar tal cual */ }
                }

                // Generar filas dinámicamente
                for (const key in attributes) {
                    // Ocultar campos técnicos
                    if (key !== 'geom' && key !== 'bbox' && key !== 'geometry' && key !== 'layer_id') {
                        html += `<tr><th>${key}</th><td>${attributes[key]}</td></tr>`;
                    }
                }
                html += '</table></div>';

                this.content.innerHTML = html;
                this.overlay.setPosition(coordinate); // Mover popup al lugar del clic
            }
        } catch (error) {
            console.error("Error consultando información:", error);
        }
    }
}