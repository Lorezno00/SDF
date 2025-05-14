// js/sketchDemo2.js
window.sketch2Code = function(p) {
  const fiss = 0.4; // Raggio del cerchio SDF fisso (nello spazio SDF)
  let pixelStep;    // Dimensione dei "super-pixel" per il rendering, calcolata dinamicamente

  // --- Variabili per la gestione del ridisegno ottimizzato ---
  let lastMouseX = -1;
  let lastMouseY = -1;
  let lastCanvasWidth = -1;
  let lastCanvasHeight = -1;
  let needsFullRedraw = true; // Flag per forzare il ridisegno quando necessario

  // Funzione SDF per un cerchio. Restituisce la distanza con segno dal bordo del cerchio.
  function cerchioSDF_instance(x, y, r) {
    return p.sqrt(x*x + y*y) - r;
  }

  // Calcola le dimensioni del canvas in base alle richieste
  function calculateCanvasDimensions() {
    let canvasWidth = window.innerWidth;
    let canvasHeight = (window.innerHeight * 0.70) + 150; // Finestra più alta di 150px
    canvasWidth = p.max(canvasWidth, 300);
    canvasHeight = p.max(canvasHeight, 350); // Altezza minima aggiornata
    return { width: canvasWidth, height: canvasHeight };
  }

  // Aggiorna la dimensione del pixelStep per il rendering SDF e segnala la necessità di ridisegnare
  function updatePixelStepAndTriggerRedraw() {
    let oldPixelStep = pixelStep;
    let basePixelStepCalculation = p.floor(p.width / 150);
    let newCalculatedPixelStep = basePixelStepCalculation / 1.5; // Risoluzione aumentata
    pixelStep = p.max(1, p.floor(newCalculatedPixelStep));

    if (pixelStep !== oldPixelStep) {
        needsFullRedraw = true;
    }
  }

  p.setup = function() {
    p.pixelDensity(1); // Per manipolazione diretta di p.pixels

    let dims = calculateCanvasDimensions();
    let canvas = p.createCanvas(dims.width, dims.height);
    lastCanvasWidth = dims.width;
    lastCanvasHeight = dims.height;

    let holder = document.getElementById('canvas-holder-2');
    if (holder) {
        canvas.parent('canvas-holder-2');
    } else {
        console.error("#canvas-holder-2 not found for parenting canvas!");
    }
    updatePixelStepAndTriggerRedraw();
    needsFullRedraw = true;
  };

  p.windowResized = function() {
    let dims = calculateCanvasDimensions();
    p.resizeCanvas(dims.width, dims.height);
    lastCanvasWidth = dims.width;
    lastCanvasHeight = dims.height;
    updatePixelStepAndTriggerRedraw();
    needsFullRedraw = true;
  };

  p.draw = function() {
    if (p.mouseX !== lastMouseX || p.mouseY !== lastMouseY) {
        needsFullRedraw = true;
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
    }
    if (p.width !== lastCanvasWidth || p.height !== lastCanvasHeight) {
        needsFullRedraw = true;
    }

    if (!needsFullRedraw) {
        return;
    }

    p.background(0);
    p.loadPixels();

    const mx_screen_norm = p.map(p.mouseX, 0, p.width, -1, 1, true);
    const my_screen_norm = p.map(p.mouseY, 0, p.height, -1, 1, true);
    const mouse_x_sdf = mx_screen_norm * (p.width / p.height);
    const mouse_y_sdf = my_screen_norm;
    const distanzaMouseCentroSDF = p.sqrt(mouse_x_sdf*mouse_x_sdf + mouse_y_sdf*mouse_y_sdf);
    const r2_sdf = p.abs(distanzaMouseCentroSDF - fiss);
    const sdf_soglia_bordi = 0.015 / (pixelStep < 3 ? 1.5 : 1.0);

    // 1. Raggio per le piccole sfere centrali SDF
    const raggioSferaCentrale = 0.02;

    for (let j_logical = 0; j_logical < p.height; j_logical += pixelStep) {
      for (let i_logical = 0; i_logical < p.width; i_logical += pixelStep) {
        const Px_center_logical = i_logical + pixelStep / 2;
        const Py_center_logical = j_logical + pixelStep / 2;
        const u_norm_for_sdf = (2.0 * Px_center_logical - p.width) / p.height;
        const v_norm_for_sdf = (2.0 * Py_center_logical - p.height) / p.height;
        let r_col = 0, g_col = 0, b_col = 0;
        
        const sdf_c1_bordo = cerchioSDF_instance(u_norm_for_sdf, v_norm_for_sdf, fiss);
        const sdf_c2_bordo = cerchioSDF_instance(u_norm_for_sdf - mouse_x_sdf, v_norm_for_sdf - mouse_y_sdf, r2_sdf);

        // 1. Calcola SDF per le piccole sfere centrali
        const sdf_sfera_centro_c1 = cerchioSDF_instance(u_norm_for_sdf, v_norm_for_sdf, raggioSferaCentrale);
        const sdf_sfera_centro_c2 = cerchioSDF_instance(u_norm_for_sdf - mouse_x_sdf, v_norm_for_sdf - mouse_y_sdf, raggioSferaCentrale);

        // Logica di colorazione aggiornata: le sfere centrali (piene) hanno priorità sui bordi dei cerchi grandi
        if (sdf_sfera_centro_c2 < 0) { // Dentro la sfera al centro del cerchio mobile
          r_col = 255; g_col = 255; b_col = 0; // Giallo (colore del cerchio mobile)
        } else if (sdf_sfera_centro_c1 < 0) { // Dentro la sfera al centro del cerchio fisso
          r_col = g_col = b_col = 255; // Bianco (colore del cerchio fisso)
        } else if (p.abs(sdf_c2_bordo) < sdf_soglia_bordi) { // Bordo del cerchio mobile
          r_col = 255; g_col = 255; b_col = 0; // Giallo
        } else if (p.abs(sdf_c1_bordo) < sdf_soglia_bordi) { // Bordo del cerchio fisso
          r_col = g_col = b_col = 255; // Bianco
        }

        for (let y_offset = 0; y_offset < pixelStep; y_offset++) {
          let actual_y = j_logical + y_offset;
          if (actual_y >= p.height) continue;
          for (let x_offset = 0; x_offset < pixelStep; x_offset++) {
            let actual_x = i_logical + x_offset;
            if (actual_x >= p.width) continue;
            let index = (actual_x + actual_y * p.width) * 4;
            p.pixels[index]     = r_col;
            p.pixels[index + 1] = g_col;
            p.pixels[index + 2] = b_col;
            p.pixels[index + 3] = 255;
          }
        }
      }
    }
    p.updatePixels();

    // --- Elementi diagnostici (linee, punti) ---
    p.strokeWeight(p.max(1, p.round(p.width / 350)));
    const steps_linea_diagnostica = 200;
    for (let t = 0; t <= 1; t += 1 / steps_linea_diagnostica) {
      const x_lerp_sdf = p.lerp(mouse_x_sdf, 0, t);
      const y_lerp_sdf = p.lerp(mouse_y_sdf, 0, t);
      const d_sdf_cerchio_fisso = cerchioSDF_instance(x_lerp_sdf, y_lerp_sdf, fiss);
      const px_screen = p.map(x_lerp_sdf, -p.width/p.height, p.width/p.height, 0, p.width);
      const py_screen = p.map(y_lerp_sdf, -1, 1, 0, p.height);
      if (d_sdf_cerchio_fisso < 0) { p.stroke(255, 0, 0); }
      else { p.stroke(0, 255, 0); }
      p.point(px_screen, py_screen);
    }

    const puntatoreDentroC1_sdf = cerchioSDF_instance(mouse_x_sdf, mouse_y_sdf, fiss) < 0;
    if (puntatoreDentroC1_sdf) {
      const angolo_sdf = p.atan2(mouse_y_sdf, mouse_x_sdf);
      const puntoBordoX_sdf = fiss * p.cos(angolo_sdf);
      const puntoBordoY_sdf = fiss * p.sin(angolo_sdf);
      const puntatoreX_screen = p.map(mouse_x_sdf, -p.width/p.height, p.width/p.height, 0, p.width);
      const puntatoreY_screen = p.map(mouse_y_sdf, -1, 1, 0, p.height);
      const bordoX_screen = p.map(puntoBordoX_sdf, -p.width/p.height, p.width/p.height, 0, p.width);
      const bordoY_screen = p.map(puntoBordoY_sdf, -1, 1, 0, p.height);
      p.stroke(0, 255, 0);
      p.line(puntatoreX_screen, puntatoreY_screen, bordoX_screen, bordoY_screen);
    }

    // --- Barra di misurazione in basso ---
    p.strokeWeight(0);
    const barraY_pos = p.height - p.max(30, p.height * 0.08);
    // 2. Barra spessa la metà
    const barraAltezzaPx = p.max(4, (p.height * 0.015) / 2); // Minimo 4px, spessore dimezzato

    let referenceWidthForScale = p.width * 0.70;
    let calculatedScale = (referenceWidthForScale > 0 && fiss > 0.0001) ? (referenceWidthForScale / 2) / fiss : 250;
    const scalaPixelPerUnitaSDF = calculatedScale / 2; // Barra cresce a metà velocità

    let lunghezzaRossaPx, lunghezzaVerdePx;

    if (puntatoreDentroC1_sdf) {
      lunghezzaRossaPx = distanzaMouseCentroSDF * scalaPixelPerUnitaSDF;
      lunghezzaVerdePx = (fiss - distanzaMouseCentroSDF) * scalaPixelPerUnitaSDF;
    } else {
      lunghezzaRossaPx = fiss * scalaPixelPerUnitaSDF;
      lunghezzaVerdePx = r2_sdf * scalaPixelPerUnitaSDF;
    }

    lunghezzaRossaPx = p.max(0, lunghezzaRossaPx);
    lunghezzaVerdePx = p.max(0, lunghezzaVerdePx);

    let actualBarContentWidth = lunghezzaRossaPx + lunghezzaVerdePx;
    let barraX_start_pos = p.width / 2 - actualBarContentWidth / 2;

    p.fill(100);
    p.rect(barraX_start_pos, barraY_pos, actualBarContentWidth, barraAltezzaPx);

    p.fill(255, 0, 0);
    p.rect(barraX_start_pos, barraY_pos, lunghezzaRossaPx, barraAltezzaPx);

    p.fill(0, 255, 0);
    p.rect(barraX_start_pos + lunghezzaRossaPx, barraY_pos, lunghezzaVerdePx, barraAltezzaPx);

    let textSizeVal = p.max(10, p.width / 45);
    p.textSize(textSizeVal);
    p.textAlign(p.CENTER, p.BOTTOM);
    const testoY_pos = barraY_pos - p.max(3, barraAltezzaPx * 0.3 + 2);
    const valoreScalaDisplay = 250;

    if (puntatoreDentroC1_sdf) {
      p.fill(255, 0, 0);
      if(lunghezzaRossaPx > textSizeVal * 0.5) p.text(p.floor(distanzaMouseCentroSDF * valoreScalaDisplay), barraX_start_pos + lunghezzaRossaPx/2, testoY_pos);
      p.fill(0, 255, 0);
      if(lunghezzaVerdePx > textSizeVal * 0.5) p.text(p.floor((fiss - distanzaMouseCentroSDF) * valoreScalaDisplay), barraX_start_pos + lunghezzaRossaPx + lunghezzaVerdePx/2, testoY_pos);
    } else {
      p.fill(255, 0, 0);
      if(lunghezzaRossaPx > textSizeVal * 0.5) p.text(p.floor(fiss * valoreScalaDisplay), barraX_start_pos + lunghezzaRossaPx/2, testoY_pos);
      p.fill(0, 255, 0);
      if(lunghezzaVerdePx > textSizeVal * 0.5) p.text(p.floor(r2_sdf * valoreScalaDisplay), barraX_start_pos + lunghezzaRossaPx + lunghezzaVerdePx/2, testoY_pos);
    }
    // --- Fine Barra di misurazione ---

    needsFullRedraw = false;
    lastCanvasWidth = p.width;
    lastCanvasHeight = p.height;
  }; // Fine p.draw
}; // Fine window.sketch2Code