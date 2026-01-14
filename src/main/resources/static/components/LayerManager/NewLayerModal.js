import { SessionManager } from '../../js/SessionManager.js';

export class NewLayerModal {
    constructor() {
        this.isVisible = false;
    }

    getHtml() {
        return `
            <div id="newLayerModal" class="modal-overlay" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Nueva Capa</h3>
                        <button id="btnCloseModal" class="close-btn">&times;</button>
                    </div>
                    <form id="formNewLayer">
                        <div class="form-group">
                            <label>Nombre de la Capa:</label>
                            <input type="text" id="layerName" required placeholder="Ej. Zonas de Riesgo">
                        </div>
                        <div class="form-group">
                            <label>Color de Representación:</label>
                            <input type="color" id="layerColor" value="#ff0000">
                        </div>
                        <div class="form-group">
                            <label>Archivo Shapefile (.zip):</label>
                            <div class="file-upload-wrapper">
                                <input type="file" id="layerFile" accept=".zip" required>
                                <small>El ZIP debe contener .shp, .shx, .dbf y .prj</small>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button type="button" id="btnCancelModal" class="btn-secondary">Cancelar</button>
                            <button type="submit" class="btn-primary">Subir Capa</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Evitamos duplicar el modal si ya existe
        if (!document.getElementById('newLayerModal')) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.getHtml();
            container.appendChild(tempDiv.firstElementChild);
            this.addListeners();
        }
    }

    addListeners() {
        const modal = document.getElementById('newLayerModal');
        const closeBtn = document.getElementById('btnCloseModal');
        const cancelBtn = document.getElementById('btnCancelModal');
        const form = document.getElementById('formNewLayer');

        // Cerrar modal
        const closeModal = () => {
            modal.style.display = 'none';
            form.reset();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Escuchar evento para abrir modal (desde Sidebar o Botón flotante)
        document.addEventListener('openNewLayerModal', () => {
            modal.style.display = 'flex';
        });

        // Enviar Formulario (Upload)
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.uploadLayer(closeModal);
        });
    }

    async uploadLayer(callbackClose) {
        const name = document.getElementById('layerName').value;
        const color = document.getElementById('layerColor').value;
        const fileInput = document.getElementById('layerFile');
        const file = fileInput.files[0];

        if (!file) {
            alert("Por favor selecciona un archivo ZIP.");
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('color', color);
        formData.append('file', file);

        const submitBtn = document.querySelector('#formNewLayer button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Subiendo...";
        submitBtn.disabled = true;

        try {
            const token = SessionManager.getToken();
            const response = await fetch('/api/v1/layers/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Nota: No poner 'Content-Type' manualmente con FormData, 
                    // el navegador lo pone automático con el boundary correcto.
                },
                body: formData
            });

            if (response.ok) {
                alert("¡Capa subida correctamente!");
                callbackClose();
                // Avisar al LayerList para que recargue la lista
                document.dispatchEvent(new CustomEvent('toggleLayerPanel', { 
                    detail: { forceRefresh: true } 
                }));
            } else {
                const errorText = await response.text();
                alert("Error al subir: " + errorText);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor.");
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    }
}