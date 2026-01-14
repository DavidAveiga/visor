// Clase base abstracta
class ToolStrategy {
    activate(mapContext) { throw new Error("Método activate() debe ser implementado"); }
    deactivate(mapContext) { throw new Error("Método deactivate() debe ser implementado"); }
}

// [cite: 30] Estrategia de Medición
export class MeasureTool extends ToolStrategy {
    constructor() {
        super();
        this.drawInteraction = null;
    }

    activate(mapContext) {
        const source = mapContext.getVectorSource();
        // Configurar interacción de dibujo tipo LineString
        this.drawInteraction = new ol.interaction.Draw({
            source: source,
            type: 'LineString'
        });

        // Evento al iniciar dibujo
        this.drawInteraction.on('drawstart', (evt) => {
            source.clear(); // Limpiar medición anterior
        });

        // Evento al finalizar dibujo (Calcular longitud)
        this.drawInteraction.on('drawend', (evt) => {
            const geom = evt.feature.getGeometry();
            const length = ol.sphere.getLength(geom);
            const output = (length > 100) ? 
                (Math.round(length / 1000 * 100) / 100) + ' ' + 'km' : 
                (Math.round(length * 100) / 100) + ' ' + 'm';
            
            // Mostrar en la barra superior [cite: 30]
            const display = document.getElementById('measureDisplay');
            if(display) {
                display.style.display = 'block';
                display.innerText = `Medida Total: ${output}`;
            }
        });

        mapContext.getMap().addInteraction(this.drawInteraction);
    }

    deactivate(mapContext) {
        if (this.drawInteraction) {
            mapContext.getMap().removeInteraction(this.drawInteraction);
            this.drawInteraction = null;
            // Ocultar display de medición
            const display = document.getElementById('measureDisplay');
            if(display) display.style.display = 'none';
        }
    }
}

// [cite: 24] Estrategia de Dibujo (Simplificada para ejemplo)
export class DrawTool extends ToolStrategy {
    constructor(type = 'Point') { // Puede ser 'Point', 'LineString', 'Polygon'
        super();
        this.type = type;
        this.drawInteraction = null;
    }

    activate(mapContext) {
        const source = mapContext.getVectorSource();
        this.drawInteraction = new ol.interaction.Draw({
            source: source,
            type: this.type
        });
        mapContext.getMap().addInteraction(this.drawInteraction);
    }

    deactivate(mapContext) {
        if (this.drawInteraction) {
            mapContext.getMap().removeInteraction(this.drawInteraction);
        }
    }
}