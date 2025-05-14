// js/sketchDemo3.js
window.sketchDemo3Code = function(s) {
  s.currentCursorShape = 'circle'; // Forma predefinita del cursore
  s.currentCombinationMode = 'xor'; // Modalità di combinazione predefinita

  s.actualCanvasWidth = 400; // Valori iniziali, verranno ricalcolati in setup
  s.actualCanvasHeight = 400;
  // MODIFICA: Risoluzione ulteriormente ridotta (pixelBlockSize più grande)
  s.pixelBlockSize = 8; // Originale era 6, prima ancora 4. 
                         // Un valore maggiore riduce la risoluzione e i calcoli.
  
  // Le risoluzioni della griglia verranno calcolate in setup basandosi su actualCanvasWidth e pixelBlockSize
  s.gridResolutionW = Math.floor(s.actualCanvasWidth / s.pixelBlockSize);
  s.gridResolutionH = Math.floor(s.actualCanvasHeight / s.pixelBlockSize);

  // --- Definizioni Costanti per le Forme Statiche (spazio normalizzato [-1,1]) ---
  const staticCircleCenterX = 0.6, staticCircleCenterY = -0.6, staticCircleRadius = 0.25;
  const squareCenterX = -0.6, squareCenterY = 0.0, squareHalfSize = 0.2;
  const triangleCenterX = 0.6, triangleCenterY = 0.5, triangleSizeParam = 0.2;

  const newStaticCircle2X = squareCenterX - 0.35; 
  const newStaticCircle2Y = squareCenterY - 0.45; 
  const newStaticCircle2Radius = 0.18;

  const newStaticRectX = 0.8; 
  const newStaticRectY = 0.0;
  const newStaticRectHalfWidth = 0.15;
  const newStaticRectHalfHeight = 0.25;

  const triangle2CenterX = -0.5;       
  const triangle2CenterY = 0.7;        
  const triangle2SizeParam = 0.22;

  const circle3CenterX = 0.0;          
  const circle3CenterY = -0.75;        
  const circle3Radius = 0.15;

  const square2CenterX = 0.0;          
  const square2CenterY = 0.75;         
  const square2HalfSize = 0.18;

  const centralCircleX = 0.0;
  const centralCircleY = 0.0;
  const centralCircleRadius = 0.2;

  // Dimensioni delle forme del cursore
  const mouseCircleRadius = 0.2;
  const mouseSquareHalfSize = 0.16;
  const mouseTriangleSizeParam = 0.2;

  // Colori
  const colorBlackArr = [0, 0, 0, 255];
  const colorWhiteArr = [255, 255, 255, 255];

  const K_SQRT3_TRI_S3 = Math.sqrt(3.0); // Costante per SDF triangolo

  // Variabili per i bottoni dell'interfaccia
  let btnCircle, btnSquare, btnTriangle;
  let btnModeXOR, btnModeUnion;
  let shapeButtonsGroup = [];
  let modeButtonsGroup = [];

  // --- Funzioni Helper SDF ---
  function sdfBoxS3(px, py, halfWidth, halfHeight) {
    const dx = Math.abs(px) - halfWidth;
    const dy = Math.abs(py) - halfHeight;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  }

  function sdfEquilateralTriangleCorrectedS3(px_initial, py_initial, r_param) {
    let px = px_initial;
    let py = py_initial;
    px = Math.abs(px) - r_param;
    py = py + r_param / K_SQRT3_TRI_S3;
    const px_bc = px;
    const py_bc = py;
    if (px_bc + K_SQRT3_TRI_S3 * py_bc > 0.0) {
      px = (px_bc - K_SQRT3_TRI_S3 * py_bc) / 2.0;
      py = (-K_SQRT3_TRI_S3 * px_bc - py_bc) / 2.0;
    }
    const val_to_clamp = px;
    const min_bound = -2.0 * r_param;
    const max_bound = 0.0;
    const clamped_val = Math.min(Math.max(val_to_clamp, min_bound), max_bound); // Clamp manuale
    px = px - clamped_val;
    return -Math.hypot(px, py) * Math.sign(py);
  }

  // --- Funzioni di Combinazione SDF ---
  function sdfXorS3(sdfA, sdfB) {
    return Math.max(Math.min(sdfA, sdfB), -Math.max(sdfA, sdfB));
  }

  function sdfUnionS3(sdfA, sdfB) {
    return Math.min(sdfA, sdfB);
  }

  function sdfIntersectionS3(sdfA, sdfB) {
    return Math.max(sdfA, sdfB);
  }

  // Aggiorna lo stato 'active' dei bottoni
  function updateActiveButtonStates() {
    shapeButtonsGroup.forEach(btn => btn.removeClass('active'));
    if (s.currentCursorShape === 'circle') btnCircle.addClass('active');
    else if (s.currentCursorShape === 'square') btnSquare.addClass('active');
    else if (s.currentCursorShape === 'triangle') btnTriangle.addClass('active');

    modeButtonsGroup.forEach(btn => btn.removeClass('active'));
    if (s.currentCombinationMode === 'xor') btnModeXOR.addClass('active');
    else if (s.currentCombinationMode === 'intersection') btnModeUnion.addClass('active');
  }
  
  // Funzione per calcolare e impostare le dimensioni del canvas e della griglia
  function calculateAndSetCanvasSize() {
    let holder3 = document.getElementById('canvas-holder-3');
    let targetWidth = holder3 ? holder3.offsetWidth : window.innerWidth; // Usa larghezza del contenitore o finestra
    targetWidth = Math.max(300, targetWidth); // Larghezza minima
    s.actualCanvasWidth = targetWidth;
    s.actualCanvasHeight = s.actualCanvasWidth; // Mantiene il canvas quadrato

    // Adatta la risoluzione della griglia e le dimensioni effettive del canvas per essere multipli di pixelBlockSize
    s.gridResolutionW = Math.floor(s.actualCanvasWidth / s.pixelBlockSize);
    s.gridResolutionH = Math.floor(s.actualCanvasHeight / s.pixelBlockSize);
    s.actualCanvasWidth = s.gridResolutionW * s.pixelBlockSize; 
    s.actualCanvasHeight = s.gridResolutionH * s.pixelBlockSize;
  }

  s.setup = function() {
    calculateAndSetCanvasSize(); // Calcola le dimensioni prima di creare il canvas

    let cnv = s.createCanvas(s.actualCanvasWidth, s.actualCanvasHeight);
    cnv.parent('canvas-holder-3');
    s.pixelDensity(1); // Per manipolazione diretta e prevedibile di s.pixels

    // Gestione dinamica dei bottoni (creazione o pulizia)
    let buttonsDiv = document.getElementById('buttons-holder-3');
    if (!buttonsDiv) { 
        console.warn('#buttons-holder-3 non trovato, creazione dinamica dei bottoni.');
        buttonsDiv = s.createDiv();
        buttonsDiv.id('buttons-holder-3');
        let demoContainer3 = document.getElementById('demo-container-3'); // Tenta di appenderlo al contenitore corretto
        if(demoContainer3) buttonsDiv.parent(demoContainer3);
        else document.body.appendChild(buttonsDiv.elt); // Fallback al body
    }

    while (buttonsDiv.firstChild) { // Pulisci bottoni esistenti se setup è richiamato
        buttonsDiv.removeChild(buttonsDiv.firstChild);
    }
    shapeButtonsGroup = []; // Resetta array
    modeButtonsGroup = [];  // Resetta array

    // Riga per i bottoni della forma del cursore
    let cursorShapeButtonsRow = s.createDiv();
    cursorShapeButtonsRow.parent(buttonsDiv);
    cursorShapeButtonsRow.addClass('demo3-button-row'); 

    btnCircle = s.createButton('');
    btnCircle.parent(cursorShapeButtonsRow);
    btnCircle.addClass('shape-btn circle-shape'); 
    btnCircle.mousePressed(() => { s.currentCursorShape = 'circle'; updateActiveButtonStates(); });
    shapeButtonsGroup.push(btnCircle);

    btnSquare = s.createButton('');
    btnSquare.parent(cursorShapeButtonsRow);
    btnSquare.addClass('shape-btn square-shape');
    btnSquare.mousePressed(() => { s.currentCursorShape = 'square'; updateActiveButtonStates(); });
    shapeButtonsGroup.push(btnSquare);

    btnTriangle = s.createButton('');
    btnTriangle.parent(cursorShapeButtonsRow);
    btnTriangle.addClass('shape-btn triangle-shape');
    btnTriangle.mousePressed(() => { s.currentCursorShape = 'triangle'; updateActiveButtonStates(); });
    shapeButtonsGroup.push(btnTriangle);

    // Riga per i bottoni della modalità di combinazione
    let combinationModeButtonsRow = s.createDiv();
    combinationModeButtonsRow.parent(buttonsDiv);
    combinationModeButtonsRow.addClass('demo3-button-row');

    btnModeXOR = s.createButton('-'); 
    btnModeXOR.parent(combinationModeButtonsRow);
    btnModeXOR.addClass('shape-btn operation-text'); 
    btnModeXOR.mousePressed(() => { s.currentCombinationMode = 'xor'; updateActiveButtonStates(); });
    modeButtonsGroup.push(btnModeXOR);

    btnModeUnion = s.createButton('+'); 
    btnModeUnion.parent(combinationModeButtonsRow);
    btnModeUnion.addClass('shape-btn operation-text');
    btnModeUnion.mousePressed(() => { s.currentCombinationMode = 'intersection'; updateActiveButtonStates(); });
    modeButtonsGroup.push(btnModeUnion);

    updateActiveButtonStates(); // Imposta lo stato attivo iniziale dei bottoni
  };

  s.windowResized = function() {
    calculateAndSetCanvasSize(); // Ricalcola le dimensioni
    s.resizeCanvas(s.actualCanvasWidth, s.actualCanvasHeight); // Ridimensiona il canvas p5
  };

  s.draw = function() {
    // Converte le coordinate del mouse nello spazio normalizzato [-1,1]
    const mouseU = s.map(s.mouseX, 0, s.width, -1, 1, true); // Clamp a true
    const mouseV = s.map(s.mouseY, 0, s.height, -1, 1, true); // Clamp a true

    s.loadPixels(); // Prepara l'array s.pixels per la scrittura diretta
    for (let gy = 0; gy < s.gridResolutionH; gy++) { // Loop sui blocchi della griglia Y
      for (let gx = 0; gx < s.gridResolutionW; gx++) { // Loop sui blocchi della griglia X
        // Calcola le coordinate (u,v) del centro del blocco corrente nello spazio [-1,1]
        const u = s.map(gx + 0.5, 0, s.gridResolutionW, -1, 1);
        const v = s.map(gy + 0.5, 0, s.gridResolutionH, -1, 1); 

        let r_c = colorBlackArr[0], g_c = colorBlackArr[1], b_c = colorBlackArr[2]; // Colore di default (nero)

        // Calcola SDF per la forma del cursore
        let sdfCursor;
        if (s.currentCursorShape === 'circle') {
          sdfCursor = s.dist(u, v, mouseU, mouseV) - mouseCircleRadius;
        } else if (s.currentCursorShape === 'square') {
          sdfCursor = sdfBoxS3(u - mouseU, v - mouseV, mouseSquareHalfSize, mouseSquareHalfSize);
        } else { // triangle
          sdfCursor = sdfEquilateralTriangleCorrectedS3(u - mouseU, -(v - mouseV), mouseTriangleSizeParam);
        }

        // SDF per le forme statiche (originali e aggiunte)
        const sdfSC = s.dist(u, v, staticCircleCenterX, staticCircleCenterY) - staticCircleRadius;
        const sdfSQ = sdfBoxS3(u - squareCenterX, v - squareCenterY, squareHalfSize, squareHalfSize);
        const sdfTR = sdfEquilateralTriangleCorrectedS3(u - triangleCenterX, -(v - triangleCenterY), triangleSizeParam);
        const sdfNSC2 = s.dist(u,v, newStaticCircle2X, newStaticCircle2Y) - newStaticCircle2Radius;
        const sdfNSR = sdfBoxS3(u- newStaticRectX, v - newStaticRectY, newStaticRectHalfWidth, newStaticRectHalfHeight);
        const sdfTriangle2 = sdfEquilateralTriangleCorrectedS3(u - triangle2CenterX, -(v - triangle2CenterY), triangle2SizeParam);
        const sdfCircle3 = s.dist(u, v, circle3CenterX, circle3CenterY) - circle3Radius;
        const sdfSquare2 = sdfBoxS3(u - square2CenterX, v - square2CenterY, square2HalfSize, square2HalfSize);
        const sdfCentralCircle = s.dist(u, v, centralCircleX, centralCircleY) - centralCircleRadius;

        // Combina le SDF in base alla modalità selezionata
        let sdfFinal;
        if (s.currentCombinationMode === 'xor') {
          sdfFinal = sdfCursor;
          sdfFinal = sdfXorS3(sdfFinal, sdfSC);
          sdfFinal = sdfXorS3(sdfFinal, sdfSQ);
          sdfFinal = sdfXorS3(sdfFinal, sdfTR);
          sdfFinal = sdfXorS3(sdfFinal, sdfNSC2);
          sdfFinal = sdfXorS3(sdfFinal, sdfNSR);
          sdfFinal = sdfXorS3(sdfFinal, sdfTriangle2);
          sdfFinal = sdfXorS3(sdfFinal, sdfCircle3);
          sdfFinal = sdfXorS3(sdfFinal, sdfSquare2);
          sdfFinal = sdfXorS3(sdfFinal, sdfCentralCircle);

        } else if (s.currentCombinationMode === 'intersection') { 
          let sdfStaticUnion = sdfUnionS3(sdfSC, sdfSQ);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfTR);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfNSC2);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfNSR);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfTriangle2);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfCircle3);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfSquare2);
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfCentralCircle);
                                                              
          sdfFinal = sdfIntersectionS3(sdfCursor, sdfStaticUnion); 
        }

        // Determina il colore del blocco: bianco se dentro la forma finale (SDF < 0)
        if (sdfFinal < 0) {
          r_c = colorWhiteArr[0]; g_c = colorWhiteArr[1]; b_c = colorWhiteArr[2];
        }

        // Riempie i pixel reali del blocco corrente con il colore calcolato
        for (let dy = 0; dy < s.pixelBlockSize; dy++) {
          for (let dx = 0; dx < s.pixelBlockSize; dx++) {
            const canvasX = gx * s.pixelBlockSize + dx;
            const canvasY = gy * s.pixelBlockSize + dy;
            // Controllo dei limiti (anche se le dimensioni del canvas dovrebbero essere multiple di pixelBlockSize)
            if (canvasX < s.actualCanvasWidth && canvasY < s.actualCanvasHeight) {
              const idx = (canvasX + canvasY * s.actualCanvasWidth) * 4; // Indice per l'array pixels
              s.pixels[idx] = r_c;
              s.pixels[idx + 1] = g_c;
              s.pixels[idx + 2] = b_c;
              s.pixels[idx + 3] = 255; // Alpha (opaco)
            }
          }
        }
      }
    }
    s.updatePixels(); // Applica le modifiche all'array s.pixels per visualizzarle
  }; // Fine s.draw
}; // Fine window.sketchDemo3Code
