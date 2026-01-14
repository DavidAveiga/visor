import { MapSingleton } from '../../js/MapSingleton.js';

export class BottomBar {
    getHtml() {
        return `
            <div class="bottom-bar-content">
                <div class="scale-area" id="scaleControl">
                    <span>100 km</span> 
                </div>
                
                <div class="coords-area">
                    <span id="mouseCoords">Lat: -1.05, Lon: -80.45</span>
                    <img src="icons/Logo SIGDSB.svg" alt="Mini Logo" class="mini-logo">
                </div>
            </div>
        `;
    }

    render(containerId) {
        document.getElementById(containerId).innerHTML = this.getHtml();
        this.initMapEvents();
    }

    initMapEvents() {
        const map = new MapSingleton().getMap();
        
        // Agregar control de escala nativo de OL dentro de nuestro div
        const scaleControl = new ol.control.ScaleLine({
            target: document.getElementById('scaleControl'),
            units: 'metric',
            bar: true,
            steps: 4,
            text: true,
            minWidth: 140
        });
        map.addControl(scaleControl);

        // Actualizar coordenadas al mover el mouse
        map.on('pointermove', (evt) => {
            const coords = ol.proj.toLonLat(evt.coordinate);
            const lat = coords[1].toFixed(4);
            const lon = coords[0].toFixed(4);
            document.getElementById('mouseCoords').innerText = `Lat: ${lat}, Lon: ${lon}`;
        });
    }
}