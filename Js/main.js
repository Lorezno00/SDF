// js/main.js
// Le istanze verranno memorizzate qui, inizializzate a null
window.myp5_sketch1 = null;
window.myp5_sketch2 = null;
window.myp5_sketch3 = null;
window.myp5_sketch4 = null;

window.addEventListener('DOMContentLoaded', (event) => {
    // Handler di ridimensionamento globale
    window.globalWindowResizedHandler = function() {
        if (window.myp5_sketch1 && typeof window.myp5_sketch1.windowResized === 'function') {
            window.myp5_sketch1.windowResized();
        }
        if (window.myp5_sketch2 && typeof window.myp5_sketch2.windowResized === 'function') {
            window.myp5_sketch2.windowResized();
        }
        if (window.myp5_sketch3 && typeof window.myp5_sketch3.windowResized === 'function') {
            window.myp5_sketch3.windowResized();
        }
        if (window.myp5_sketch4 && typeof window.myp5_sketch4.windowResized === 'function') {
            window.myp5_sketch4.windowResized();
        }
    }
    window.addEventListener('resize', window.globalWindowResizedHandler);

    // Configurazione per ogni demo
    const demoConfigurations = [
        {
            instanceName: 'myp5_sketch1', // Nome della variabile globale per l'istanza
            sketchCodeVar: 'sketchDemo1Code', // Nome della variabile globale per il codice dello sketch
            scrollContainerId: 'demo1-scroll-container', // ID del contenitore che triggera la visibilità
            canvasHolderId: 'canvas-holder', // ID del div che conterrà il canvas
            controlsHolderId: null // ID del div per i controlli (se creati da p5)
        },
        {
            instanceName: 'myp5_sketch2',
            sketchCodeVar: 'sketch2Code',
            scrollContainerId: 'demo2-scroll-container',
            canvasHolderId: 'canvas-holder-2',
            controlsHolderId: null
        },
        {
            instanceName: 'myp5_sketch3',
            sketchCodeVar: 'sketchDemo3Code',
            scrollContainerId: 'demo-container-3',
            canvasHolderId: 'canvas-holder-3',
            controlsHolderId: 'buttons-holder-3' // Contenitore per i bottoni della Demo 3
        },
        {
            instanceName: 'myp5_sketch4',
            sketchCodeVar: 'sketchDemo4Code',
            scrollContainerId: 'demo-container-4',
            canvasHolderId: 'canvas-holder-4',
            controlsHolderId: 'controls-holder-4' // Contenitore per i controlli della Demo 4
        }
    ];

    const observerOptions = {
        root: null,
        rootMargin: '0px', // Puoi aumentare questo margine se vuoi caricare/scaricare un po' prima/dopo
        threshold: 0.05 // Triggera quando anche solo una piccola parte è visibile/invisibile
                       // Valori più bassi per un unload/reload più "aggressivo"
    };

    const sketchLifecycleManager = (entries, observer) => {
        entries.forEach(entry => {
            const config = demoConfigurations.find(dc => dc.scrollContainerId === entry.target.id);
            if (!config) return;

            const sketchInstance = window[config.instanceName];

            if (entry.isIntersecting) {
                // L'elemento è entrato nella vista
                if (!sketchInstance) {
                    console.log(`${config.instanceName} è visibile. Inizializzazione...`);
                    if (typeof window[config.sketchCodeVar] !== 'undefined' && document.getElementById(config.canvasHolderId)) {
                        // Pulisci il contenitore dei controlli (se esiste) prima di ricreare lo sketch
                        if (config.controlsHolderId) {
                            const controlsHolder = document.getElementById(config.controlsHolderId);
                            if (controlsHolder) {
                                controlsHolder.innerHTML = ''; // Rimuove vecchi controlli p5
                            }
                        }
                        // Crea la nuova istanza p5
                        window[config.instanceName] = new p5(window[config.sketchCodeVar], config.canvasHolderId);
                    } else {
                        console.error(`Errore: ${config.sketchCodeVar} non definito o #${config.canvasHolderId} non trovato per ${config.instanceName}.`);
                    }
                } else {
                     // Se l'istanza esiste già e potrebbe essere stata messa in noLoop(), riattivala.
                     // (Questa parte è più rilevante se si implementa un "pausa" invece di "remove")
                    if (sketchInstance && typeof sketchInstance.loop === 'function' && !sketchInstance.isLooping()) {
                        console.log(`${config.instanceName} riattivato.`);
                        sketchInstance.loop();
                    }
                }
            } else {
                // L'elemento è uscito dalla vista
                if (sketchInstance) {
                    console.log(`${config.instanceName} non è più visibile. Rimozione...`);
                    sketchInstance.remove(); // Rimuove lo sketch p5 (canvas, event listeners, etc.)
                    window[config.instanceName] = null; // Resetta la variabile dell'istanza

                    // Opzionale: Pulisci esplicitamente il contenitore dei controlli,
                    // anche se `sketch.remove()` e la successiva ricreazione dovrebbero gestirlo.
                    // Utile se gli elementi p5 non sono figli del canvas principale.
                    if (config.controlsHolderId) {
                        const controlsHolder = document.getElementById(config.controlsHolderId);
                        if (controlsHolder) {
                           // controlsHolder.innerHTML = ''; // Già fatto prima della re-inizializzazione
                        }
                    }
                }
            }
        });
    };

    const sketchObserver = new IntersectionObserver(sketchLifecycleManager, observerOptions);

    demoConfigurations.forEach(config => {
        const elementToObserve = document.getElementById(config.scrollContainerId);
        if (elementToObserve) {
            sketchObserver.observe(elementToObserve);
        } else {
            console.error(`Contenitore di scroll #${config.scrollContainerId} per ${config.instanceName} non trovato.`);
        }
    });
});