import { MapSingleton } from './MapSingleton.js';
import { TopBar } from '../components/TopBar/TopBar.js';
import { Sidebar } from '../components/Sidebar/Sidebar.js';
import { MapControls } from '../components/MapControls/MapControls.js';
import { BottomBar } from '../components/BottomBar/BottomBar.js';
import { NewLayerModal } from '../components/LayerManager/NewLayerModal.js';
import { LayerList } from '../components/LayerManager/LayerList.js';
import { MeasureTool } from '../components/MeasureTool/MeasureTool.js';
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Iniciando Sistema SIGDS...");

    // 1. Instancia del Mapa (Núcleo de OpenLayers)
    // Se asegura de que el mapa exista antes de cargar herramientas
    const mapInstance = new MapSingleton();
    const measureTool = new MeasureTool();
    measureTool.init();
    // 2. Renderizar Componentes de la Interfaz
    // Cada uno va a su propio DIV definido en index.html
    
    // A. Barra Superior (Logo, Ayuda, Menú Documentación)
    const topBar = new TopBar();
    topBar.render('topbar-container');

    // B. Barra Lateral (Herramientas: Lupa, Regla, etc.)
    const sidebar = new Sidebar();
    sidebar.render('sidebar-container');

    // C. Panel de Capas (Flotante, oculto por defecto)
    // Sidebar.js se encarga de mostrarlo/ocultarlo
    const layerList = new LayerList();
    layerList.render('layer-list-container');

    // D. Controles de Mapa (Zoom +, Zoom -, Casa)
    // Se ubican abajo al centro
    const mapControls = new MapControls();
    mapControls.render('map-controls-container');

    // E. Barra Inferior (Coordenadas y Escala)
    const bottomBar = new BottomBar();
    bottomBar.render('bottom-bar-container');
    
    // 3. Inicializar Modales y Utilidades
    // Modal para "Agregar Capa" (escucha eventos globales)
    const layerLoader = new NewLayerModal();
    layerLoader.init('modals-container');

    console.log("✅ Interfaz cargada correctamente.");
    console.log("✅ Herramientas cargadas.");
});