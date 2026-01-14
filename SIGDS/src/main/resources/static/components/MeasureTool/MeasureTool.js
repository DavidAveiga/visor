import { MapSingleton } from '../../js/MapSingleton.js';

export class MeasureTool {
    constructor() {
        this.map = new MapSingleton().getMap();
        this.draw = null;
        this.sketch = null;
        this.helpTooltipElement = null;
        this.helpTooltip = null;
        this.measureTooltipElement = null;
        this.measureTooltip = null;
        this.source = new ol.source.Vector();
        
        this.vectorLayer = new ol.layer.Vector({
            source: this.source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
                stroke: new ol.style.Stroke({ color: '#ffcc33', width: 3 }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({ color: '#ffcc33' })
                })
            }),
            zIndex: 999
        });

        this.map.addLayer(this.vectorLayer);
        this.isActive = false;

        // Binding para poder agregar y remover el evento de teclado correctamente
        this.handleEscKey = this.handleEscKey.bind(this);
    }

    init() {
        document.addEventListener('toggleMeasureTool', () => {
            this.toggle();
        });

        this.createMeasureInfoBar();
    }

    createMeasureInfoBar() {
        if (!document.getElementById('measureInfoPanel')) {
            const panel = document.createElement('div');
            panel.id = 'measureInfoPanel';
            panel.className = 'measure-info-panel';
            panel.style.display = 'none';
            
            // CAMBIO 1: HTML simplificado, solo muestra MEDIDA TOTAL
            panel.innerHTML = `
                <div class="measure-box">
                    <span class="label">MEDIDA TOTAL:</span>
                    <span id="totalMeasureValue" class="value">0 m</span>
                </div>
                <button id="btnCloseMeasure" class="close-measure-btn" title="Finalizar medición">✖</button>
            `;
            document.body.appendChild(panel);

            document.getElementById('btnCloseMeasure').onclick = () => this.toggle(false);
        }
    }

    toggle(forceState = null) {
        const wasActive = this.isActive;
        this.isActive = forceState !== null ? forceState : !wasActive;

        new MapSingleton().clearInteractions();
        const panel = document.getElementById('measureInfoPanel');

        if (this.isActive) {
            console.log("Activando Herramienta de Medición...");
            
            // CAMBIO 2: Inicializar explícitamente en "0 m"
            this.updateTopPanel('0 m');
            this.source.clear(); 

            this.addInteraction();
            panel.style.display = 'flex';
            this.map.getViewport().style.cursor = 'crosshair';

            // CAMBIO 3: Escuchar tecla ESC
            document.addEventListener('keydown', this.handleEscKey);

        } else {
            console.log("Desactivando Medición...");
            if(this.draw) this.map.removeInteraction(this.draw);
            this.source.clear();
            this.removeTooltips();
            
            if(panel) panel.style.display = 'none';
            this.map.getViewport().style.cursor = 'default';

            // Limpiar listener de tecla ESC para no afectar otras herramientas
            document.removeEventListener('keydown', this.handleEscKey);
        }
    }

    // Nuevo método para manejar la tecla Escape
    handleEscKey(e) {
        if (e.key === 'Escape') {
            this.toggle(false);
        }
    }

    addInteraction() {
        this.draw = new ol.interaction.Draw({
            source: this.source,
            type: 'LineString',
            style: new ol.style.Style({
                fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
                stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2 }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({ color: 'rgba(0, 0, 0, 0.7)' }),
                    fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.2)' })
                })
            })
        });

        this.map.addInteraction(this.draw);
        this.createMeasureTooltip();
        this.createHelpTooltip();

        let listener;

        this.draw.on('drawstart', (evt) => {
            this.sketch = evt.feature;
            let tooltipCoord = evt.coordinate;

            listener = this.sketch.getGeometry().on('change', (evt) => {
                const geom = evt.target;
                const output = this.formatLength(geom);
                tooltipCoord = geom.getLastCoordinate();
                
                this.measureTooltipElement.innerHTML = output; // Tooltip flotante
                this.measureTooltip.setPosition(tooltipCoord);

                this.updateTopPanel(output); // Barra superior solo total
            });
        });

        this.draw.on('drawend', () => {
            this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
            this.measureTooltip.setOffset([0, -7]);
            this.sketch = null;
            this.measureTooltipElement = null;
            this.createMeasureTooltip();
            ol.Observable.unByKey(listener);
        });

        this.map.on('pointermove', (evt) => {
            if (evt.dragging) return;
            let helpMsg = 'Clic para iniciar';
            if (this.sketch) {
                helpMsg = 'Clic para continuar (Doble clic termina)';
            }
            this.helpTooltipElement.innerHTML = helpMsg;
            this.helpTooltip.setPosition(evt.coordinate);
            this.helpTooltipElement.classList.remove('hidden');
        });

        this.map.getViewport().addEventListener('mouseout', () => {
            this.helpTooltipElement.classList.add('hidden');
        });
    }

    formatLength(line) {
        const length = ol.sphere.getLength(line);
        let output;
        
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) + ' km';
        } else {
            output = (Math.round(length * 100) / 100) + ' m';
        }
        return output;
    }

    updateTopPanel(total) {
        const totEl = document.getElementById('totalMeasureValue');
        if (totEl) totEl.innerText = total;
    }

    createHelpTooltip() {
        if (this.helpTooltipElement) this.helpTooltipElement.parentNode.removeChild(this.helpTooltipElement);
        this.helpTooltipElement = document.createElement('div');
        this.helpTooltipElement.className = 'ol-tooltip hidden';
        this.helpTooltip = new ol.Overlay({
            element: this.helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        this.map.addOverlay(this.helpTooltip);
    }

    createMeasureTooltip() {
        if (this.measureTooltipElement) this.measureTooltipElement.parentNode.removeChild(this.measureTooltipElement);
        this.measureTooltipElement = document.createElement('div');
        this.measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
        this.measureTooltip = new ol.Overlay({
            element: this.measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center',
            stopEvent: false,
            insertFirst: false
        });
        this.map.addOverlay(this.measureTooltip);
    }

    removeTooltips() {
        this.map.getOverlays().clear();
        this.helpTooltipElement = null;
        this.measureTooltipElement = null;
    }
}