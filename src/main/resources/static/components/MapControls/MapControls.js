import { MapSingleton } from '../../js/MapSingleton.js';

export class MapControls {
    getHtml() {
        return `
            <div class="map-controls-panel">
                <button id="btnHome" class="control-btn" title="Vista Inicial">
                    <img src="icons/home.svg" alt="Home" style="width:18px;"> </button>
                <div class="separator"></div>
                <button id="btnZoomIn" class="control-btn" title="Acercar">+</button>
                <div class="separator"></div>
                <button id="btnZoomOut" class="control-btn" title="Alejar">-</button>
            </div>
        `;
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = this.getHtml();
        this.addListeners();
    }

    addListeners() {
        const map = new MapSingleton().getMap();

        document.getElementById('btnZoomIn').addEventListener('click', () => {
            const view = map.getView();
            view.animate({ zoom: view.getZoom() + 1, duration: 250 });
        });

        document.getElementById('btnZoomOut').addEventListener('click', () => {
            const view = map.getView();
            view.animate({ zoom: view.getZoom() - 1, duration: 250 });
        });

        document.getElementById('btnHome').addEventListener('click', () => {
            const view = map.getView();
            // Coordenadas de Portoviejo (según tu PDF)
            view.animate({ 
                center: ol.proj.fromLonLat([-80.454, -1.056]), 
                zoom: 13, 
                duration: 500 
            });
        });
    }
}