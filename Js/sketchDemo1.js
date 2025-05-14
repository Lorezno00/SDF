// js/sketchDemo1.js
window.sketchDemo1Code = function(p) {
  p.demo = 1; // Demo iniziale (1: Cerchio, 2: Triangolo, 3: Rettangolo)
  p.pixelSize = 30; // Valore di default, verrà sovrascritto da setup() in base allo slider

  // Funzioni helper (SDF e utility) specifiche per questa demo
  function cerchioSDF(x, y, r) {
    return Math.sqrt(x ** 2 + y ** 2) - r;
  }

  function rettangoloSDF(px, py, halfWidth, halfHeight) {
    const dx = Math.abs(px) - halfWidth;
    const dy = Math.abs(py) - halfHeight;
    return Math.sqrt(Math.max(dx, 0)**2 + Math.max(dy, 0)**2) + Math.min(Math.max(dx, dy), 0);
  }

  function sdEquilateralTriangle(p_obj_coords, r) {
    // Lavora su una copia delle coordinate per evitare effetti collaterali sull'oggetto originale,
    // sebbene in questo script venga passato un nuovo oggetto ad ogni chiamata.
    let current_x = p_obj_coords.x;
    let current_y = p_obj_coords.y;

    const k = Math.sqrt(3);
    current_x = Math.abs(current_x) - r;
    current_y = current_y + r / k;

    if (current_x + k * current_y > 0) {
      const x_temp = (current_x - k * current_y) / 2;
      const y_temp = (-k * current_x - current_y) / 2;
      current_x = x_temp;
      current_y = y_temp;
    }
    // CORREZIONE CRITICA:
    // p5.js usa p.constrain(valore, min, max), non p.clamp.
    // Se p.clamp non è una funzione definita, questo causerebbe NaN e il quadrato bianco.
    current_x -= p.constrain(current_x, -2 * r, 0);

    return -Math.hypot(current_x, current_y) * Math.sign(current_y);
  }

  p.getCanvasSizeDemo1 = function() {
    const holder = document.getElementById('canvas-holder');
    let holderClientWidth = holder ? holder.clientWidth : (window.innerWidth * 0.9);
    let availableWidth;
    if (window.innerWidth < 768) { // Modalità mobile/piccolo schermo
      availableWidth = window.innerWidth * 0.85;
    } else { // Modalità desktop/grande schermo
      availableWidth = Math.min(holderClientWidth, window.innerWidth * 0.55);
    }
    // Usa p.constrain per limitare la dimensione del canvas
    let canvasDim = p.constrain(availableWidth, 360, 720);
    return canvasDim;
  };

  p.setup = function() {
    const slider = document.getElementById('pixel-slider-demo1');
    const sliderValueDisplay = document.getElementById('slider-value-demo1');

    const minSliderVal = parseInt(slider.min);
    const maxSliderVal = parseInt(slider.max);

    function getInvertedSliderValue() {
      let currentValue = parseInt(slider.value);
      return minSliderVal + maxSliderVal - currentValue;
    }

    p.pixelSize = getInvertedSliderValue();
    if (sliderValueDisplay) sliderValueDisplay.textContent = p.pixelSize;

    let currentCanvasSize = p.getCanvasSizeDemo1();
    const canvas = p.createCanvas(currentCanvasSize, currentCanvasSize);
    canvas.parent('canvas-holder');
    
    p.stroke(200); // Colore di default per la griglia (impostato qui ma sovrascritto in demoXSDF)
    p.strokeWeight(1); // Spessore di default (impostato qui ma sovrascritto in demoXSDF)
    p.noLoop(); // Il ridisegno avviene solo su richiesta (es. interazione slider/pulsanti)

    slider.addEventListener('input', function() {
      p.pixelSize = getInvertedSliderValue();
      if (sliderValueDisplay) sliderValueDisplay.textContent = p.pixelSize;
      p.redraw();
    });

    document.getElementById('btnDemo1Shape1').onclick = () => p.changeDemoAndUpdate(1);
    document.getElementById('btnDemo1Shape2').onclick = () => p.changeDemoAndUpdate(2);
    document.getElementById('btnDemo1Shape3').onclick = () => p.changeDemoAndUpdate(3);
    
    p.changeDemoAndUpdate(p.demo); // Applica stato iniziale e disegna la prima demo
  };

  p.draw = function() {
    p.background(255); // Sfondo bianco per ogni frame

    // Calcola la soglia per il disegno del bordo della SDF.
    // Questo aiuta a mantenere uno spessore visivo del bordo relativamente costante
    // al variare di p.pixelSize.
    let numPixelsForSDFThickness = Math.floor(p.width / p.pixelSize);
    numPixelsForSDFThickness = Math.max(1, numPixelsForSDFThickness); // Evita divisione per zero
    const soglia = (numPixelsForSDFThickness > 0) ? (0.53 * 2) / numPixelsForSDFThickness : 0.01;

    if (p.demo === 1) p.demo1SDF(soglia);
    else if (p.demo === 2) p.demo2SDF(soglia);
    else if (p.demo === 3) p.demo3SDF(soglia);
  };
  
  p.windowResized = function() {
    let currentCanvasSize = p.getCanvasSizeDemo1();
    p.resizeCanvas(currentCanvasSize, currentCanvasSize);
    p.redraw(); // Ridisegna con le nuove dimensioni
  };

  p.changeDemoAndUpdate = function(num) {
    p.demo = num;
    // Aggiorna la classe 'active' sui pulsanti di selezione forma
    for (let i = 1; i <= 3; i++) {
      const btn = document.getElementById('btnDemo1Shape' + i);
      if (btn) btn.classList.remove('active');
    }
    const activeBtn = document.getElementById('btnDemo1Shape' + num);
    if (activeBtn) activeBtn.classList.add('active');
    
    p.redraw(); // Ridisegna per mostrare la nuova forma
  };

  p.demo1SDF = function(soglia) { // Cerchio
    p.stroke(0); p.strokeWeight(2); // Stile originale per i bordi dei quadrati
    for (let j_coord = 0; j_coord < p.height; j_coord += p.pixelSize) {
      for (let i_coord = 0; i_coord < p.width; i_coord += p.pixelSize) {
        const u = p.map(i_coord + p.pixelSize / 2, 0, p.width, -1, 1);
        const v = p.map(j_coord + p.pixelSize / 2, 0, p.height, -1, 1);
        const c1 = cerchioSDF(u, v, 0.8);
        const isBorder = Math.abs(c1) < soglia;
        p.fill(isBorder ? 0 : 255);
        p.rect(i_coord, j_coord, p.pixelSize, p.pixelSize);
      }
    }
  };

  p.demo2SDF = function(soglia) { // Triangolo Equilatero
    p.stroke(0); p.strokeWeight(2); // Stile originale
    for (let j_coord = 0; j_coord < p.height; j_coord += p.pixelSize) {
      for (let i_coord = 0; i_coord < p.width; i_coord += p.pixelSize) {
        const u = p.map(i_coord + p.pixelSize / 2, 0, p.width, -1, 1);
        // Le SDF per forme non simmetriche come i triangoli sono sensibili all'orientamento dell'asse Y.
        // p5.js ha (0,0) in alto a sinistra, Y cresce verso il basso. Molte formule SDF assumono Y crescente verso l'alto.
        // La mappatura originale per 'v' era (-1, 1). Se la SDF si aspetta Y "standard" (crescente verso l'alto),
        // invertire la mappatura di v o negare v è comune.
        // L'originale: `y: -v_original_map + 0.25` dove `v_original_map` è `p.map(..., -1, 1)`.
        // Questo equivale a `p.map(..., 1, -1)` per la parte `-v` e poi si aggiunge 0.25.
        const v_mapped_for_sdf = p.map(j_coord + p.pixelSize / 2, 0, p.height, 1, -1); // Y va da 1 (alto) a -1 (basso)

        // La traslazione `+ 0.25` sposta il triangolo.
        const r1 = sdEquilateralTriangle({ x: u, y: v_mapped_for_sdf + 0.25 }, 0.8);
        const isBorder = Math.abs(r1) < soglia;
        p.fill(isBorder ? 0 : 255);
        p.rect(i_coord, j_coord, p.pixelSize, p.pixelSize);
      }
    }
  };

  p.demo3SDF = function(soglia) { // Rettangolo
    p.stroke(0); p.strokeWeight(2); // Stile originale
    for (let j_coord = 0; j_coord < p.height; j_coord += p.pixelSize) {
      for (let i_coord = 0; i_coord < p.width; i_coord += p.pixelSize) {
        const u = p.map(i_coord + p.pixelSize / 2, 0, p.width, -1, 1);
        const v = p.map(j_coord + p.pixelSize / 2, 0, p.height, -1, 1);
        const r1 = rettangoloSDF(u, v, 0.4, 0.7);
        const isBorder = Math.abs(r1) < soglia;
        p.fill(isBorder ? 0 : 255);
        p.rect(i_coord, j_coord, p.pixelSize, p.pixelSize);
      }
    }
  };
}; // Fine di window.sketchDemo1Code