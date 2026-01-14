export class ShareTool {
    execute(mapInstance) {
        const view = mapInstance.getMap().getView();
        const center = ol.proj.toLonLat(view.getCenter());
        const zoom = view.getZoom();
        
        // 1. Construir URL con parámetros
        const baseUrl = window.location.href.split('?')[0];
        const shareUrl = `${baseUrl}?lat=${center[1].toFixed(5)}&lon=${center[0].toFixed(5)}&z=${zoom.toFixed(2)}`;
        
        // 2. Copiar al portapapeles
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert(` ¡Enlace copiado!\n\n${shareUrl}`);
        }).catch(err => {
            console.error('Error al copiar: ', err);
            prompt("Copia este enlace manualmnete:", shareUrl);
        });
    }
}