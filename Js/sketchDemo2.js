// js/sketchDemo2.js
window.sketch2Code = function(p) {
  const fiss = 0.4;
  let pixelStep = 5;

  function cerchioSDF_instance(x, y, r) {
    return p.sqrt(x*x + y*y) - r;
  }

  function calculateCanvasDimensions() {
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight * 0.70; // Altezza come percentuale della finestra
    canvasWidth = p.max(canvasWidth, 300);    // Larghezza minima
    canvasHeight = p.max(canvasHeight, 200);  // Altezza minima
    return { width: canvasWidth, height: canvasHeight };
  }

  p.setup = function() {
    let dims = calculateCanvasDimensions();
    let canvas = p.createCanvas(dims.width, dims.height);
    let holder = document.getElementById('canvas-holder-2');
    if (holder) {
        canvas.parent('canvas-holder-2');
    } else {
        console.error("#canvas-holder-2 not found for parenting canvas!");
    }
    pixelStep = p.max(2, p.floor(p.width / 150)); // Adatta pixelStep alla larghezza
  };

  p.windowResized = function() {
    let dims = calculateCanvasDimensions();
    p.resizeCanvas(dims.width, dims.height);
    pixelStep = p.max(2, p.floor(p.width / 150)); // Ri-adatta pixelStep
  }

  p.draw = function() {
    p.background(0);
    p.noStroke();

    // Coordinate mouse normalizzate per lo spazio SDF di questo sketch
    // Questo sketch usa un sistema di coordinate SDF un po' diverso (scala con aspect ratio)
    const mx_screen_norm = p.map(p.mouseX, 0, p.width, -1, 1, true);
    const my_screen_norm = p.map(p.mouseY, 0, p.height, -1, 1, true);

    let mouse_x_sdf, mouse_y_sdf;
    // Adatta le coordinate x del mouse per l'aspect ratio del canvas
    // se lo spazio SDF è inteso come [-1,1] su y e [-asp, asp] su x
    mouse_x_sdf = mx_screen_norm * (p.width / p.height); 
    mouse_y_sdf = my_screen_norm;

    let distanzaMouseCentroSDF = p.sqrt(mouse_x_sdf*mouse_x_sdf + mouse_y_sdf*mouse_y_sdf);
    let r2_sdf = p.abs(distanzaMouseCentroSDF - fiss);

    for(let j_px = 0; j_px < p.height; j_px += pixelStep){
      for(let i_px = 0; i_px < p.width; i_px += pixelStep){
        const Px = i_px + pixelStep / 2; // Centro del "pixel"
        const Py = j_px + pixelStep / 2;

        // Mappa le coordinate del pixel (Px,Py) allo spazio SDF
        // Lo spazio SDF qui è [-width/height, width/height] per u, e [-1,1] per v
        const u_norm_for_sdf = (2.0 * Px - p.width) / p.height; 
        const v_norm_for_sdf = (2.0 * Py - p.height) / p.height;

        let r_col = 0, g_col = 0, b_col = 0;

        const sdf_c1 = cerchioSDF_instance(u_norm_for_sdf, v_norm_for_sdf, fiss);
        const sdf_c2 = cerchioSDF_instance(u_norm_for_sdf - mouse_x_sdf, v_norm_for_sdf - mouse_y_sdf, r2_sdf);
        const sdf_mouse_marker = cerchioSDF_instance(u_norm_for_sdf - mouse_x_sdf, v_norm_for_sdf - mouse_y_sdf, 0.02);
        const sdf_center_marker = cerchioSDF_instance(u_norm_for_sdf, v_norm_for_sdf, 0.02);
        
        const sdf_soglia_bordi = 0.025; // Soglia per disegnare i bordi

        if (p.abs(sdf_c1) < sdf_soglia_bordi || p.abs(sdf_center_marker) < 0.015) {
          r_col = g_col = b_col = 255; // Cerchio fisso e suo centro: bianco
        } else if (p.abs(sdf_c2) < sdf_soglia_bordi || p.abs(sdf_mouse_marker) < 0.015) {
          r_col = 255; g_col = 255; b_col = 0; // Cerchio mobile e cursore mouse: giallo
        }
        p.fill(r_col, g_col, b_col);
        p.rect(i_px, j_px, pixelStep, pixelStep);
      }
    }

    // Disegna linee e punti diagnostici
    p.strokeWeight(p.max(1, p.round(p.width / 350)));
    const steps = 200; // Numero di punti per la linea diagnostica
    for (let t = 0; t <= 1; t += 1 / steps) {
      const x_lerp_sdf = p.lerp(mouse_x_sdf, 0, t); // Interpola tra mouse e centro
      const y_lerp_sdf = p.lerp(mouse_y_sdf, 0, t);
      const d_sdf = cerchioSDF_instance(x_lerp_sdf, y_lerp_sdf, fiss);

      // Converte da spazio SDF a coordinate schermo
      const px_screen = p.map(x_lerp_sdf, -p.width/p.height, p.width/p.height, 0, p.width);
      const py_screen = p.map(y_lerp_sdf, -1, 1, 0, p.height);

      if (d_sdf < 0) { p.stroke(255, 0, 0); } // Rosso se dentro il cerchio fisso
      else { p.stroke(0, 255, 0); } // Verde se fuori
      p.point(px_screen, py_screen);
    }

    // Linea dal cursore al bordo del cerchio fisso (se il cursore è dentro)
    const puntatoreDentroC1_sdf = cerchioSDF_instance(mouse_x_sdf, mouse_y_sdf, fiss) < 0;
    if (puntatoreDentroC1_sdf) {
      const angolo_sdf = p.atan2(mouse_y_sdf, mouse_x_sdf);
      const puntoBordoX_sdf = fiss * p.cos(angolo_sdf);
      const puntoBordoY_sdf = fiss * p.sin(angolo_sdf);

      const puntatoreX_screen = p.map(mouse_x_sdf, -p.width/p.height, p.width/p.height, 0, p.width);
      const puntatoreY_screen = p.map(mouse_y_sdf, -1, 1, 0, p.height);
      const bordoX_screen = p.map(puntoBordoX_sdf, -p.width/p.height, p.width/p.height, 0, p.width);
      const bordoY_screen = p.map(puntoBordoY_sdf, -1, 1, 0, p.height);
      
      p.stroke(0, 255, 0); // Linea verde
      p.line(puntatoreX_screen, puntatoreY_screen, bordoX_screen, bordoY_screen);
    }

    // Barra di misurazione in basso
    p.strokeWeight(0); // Nessun bordo per le barre
    const barraPaddingLaterale = p.width * 0.15;
    const barraLarghezzaMaxPx = p.width - 2 * barraPaddingLaterale;
    const barraY_pos = p.height - p.max(30, p.height * 0.08); // Posizione Y della barra
    const barraAltezzaPx = p.max(8, p.height * 0.015);      // Altezza della barra
    
    // Scala per convertire le unità SDF in pixel per la barra
    const scalaBarraPxPerUnitaNorm = (barraLarghezzaMaxPx > 0 && fiss > 0.0001) ? (barraLarghezzaMaxPx / 2) / fiss : 100;

    let lunghezzaTotaleBarraPx;
    if (puntatoreDentroC1_sdf) {
        lunghezzaTotaleBarraPx = fiss * scalaBarraPxPerUnitaNorm * 2; // La barra rappresenta il diametro del cerchio fisso
    } else {
        // La barra rappresenta la distanza dal centro al mouse + il raggio del cerchio mobile
        lunghezzaTotaleBarraPx = (fiss + r2_sdf) * scalaBarraPxPerUnitaNorm * 2;
    }
    lunghezzaTotaleBarraPx = p.min(lunghezzaTotaleBarraPx, barraLarghezzaMaxPx); // Limita alla larghezza massima

    let barraX_pos = p.width / 2 - lunghezzaTotaleBarraPx / 2; // Centra la barra

    let lunghezzaRossaPx, lunghezzaVerdePx;
    if (puntatoreDentroC1_sdf) {
      lunghezzaRossaPx = distanzaMouseCentroSDF * scalaBarraPxPerUnitaNorm;
      lunghezzaVerdePx = (fiss - distanzaMouseCentroSDF) * scalaBarraPxPerUnitaNorm;
    } else {
      lunghezzaRossaPx = fiss * scalaBarraPxPerUnitaNorm; // Raggio del cerchio fisso
      lunghezzaVerdePx = r2_sdf * scalaBarraPxPerUnitaNorm;    // Raggio del cerchio mobile
    }
    
    // Assicura che la somma delle parti non superi la lunghezza totale (dovuto a scaling e clamping)
    let sommaParti = lunghezzaRossaPx + lunghezzaVerdePx;
    if (sommaParti > lunghezzaTotaleBarraPx && sommaParti > 0.0001) {
        let fattoreRidimensionamento = lunghezzaTotaleBarraPx / sommaParti;
        lunghezzaRossaPx *= fattoreRidimensionamento;
        lunghezzaVerdePx *= fattoreRidimensionamento;
    } else if (sommaParti <= 0.0001 && lunghezzaTotaleBarraPx > 0) {
        // Caso degenere, non disegnare parti colorate se la loro somma è zero
        lunghezzaRossaPx = 0;
        lunghezzaVerdePx = 0;
    }
    lunghezzaRossaPx = p.max(0, lunghezzaRossaPx); // Non può essere negativo
    lunghezzaVerdePx = p.max(0, lunghezzaVerdePx);
    
    // Ricalcola la posizione X per centrare le parti effettive
    barraX_pos = p.width / 2 - (lunghezzaRossaPx + lunghezzaVerdePx)/2;


    p.fill(100); // Sfondo grigio per la barra se le parti non la riempiono
    p.rect(barraX_pos, barraY_pos, lunghezzaRossaPx + lunghezzaVerdePx, barraAltezzaPx);
    
    p.fill(255, 0, 0); // Parte rossa
    p.rect(barraX_pos, barraY_pos, lunghezzaRossaPx, barraAltezzaPx);
    
    p.fill(0, 255, 0); // Parte verde
    p.rect(barraX_pos + lunghezzaRossaPx, barraY_pos, lunghezzaVerdePx, barraAltezzaPx);

    // Testo sopra le barre
    let textSizeVal = p.max(10, p.width / 45); // Dimensione testo responsiva
    p.textSize(textSizeVal);
    p.textAlign(p.CENTER, p.BOTTOM);
    const testoY_pos = barraY_pos - p.max(3, barraAltezzaPx * 0.3 + 2); // Posizione Y del testo
    const valoreScalaDisplay = 250; // Fattore di scala per visualizzare i valori

    if (puntatoreDentroC1_sdf) {
      p.fill(255, 0, 0);
      if(lunghezzaRossaPx > textSizeVal*0.5) p.text(p.floor(distanzaMouseCentroSDF * valoreScalaDisplay), barraX_pos + lunghezzaRossaPx/2, testoY_pos);
      p.fill(0, 255, 0);
      if(lunghezzaVerdePx > textSizeVal*0.5) p.text(p.floor((fiss - distanzaMouseCentroSDF) * valoreScalaDisplay), barraX_pos + lunghezzaRossaPx + lunghezzaVerdePx/2, testoY_pos);
    } else {
      p.fill(255, 0, 0);
      if(lunghezzaRossaPx > textSizeVal*0.5) p.text(p.floor(fiss * valoreScalaDisplay), barraX_pos + lunghezzaRossaPx/2, testoY_pos);
      p.fill(0, 255, 0);
      if(lunghezzaVerdePx > textSizeVal*0.5) p.text(p.floor(r2_sdf * valoreScalaDisplay), barraX_pos + lunghezzaRossaPx + lunghezzaVerdePx/2, testoY_pos);
    }
    
    // Marcatori per centro e mouse
    p.noStroke();
    let centroX_screen = p.map(0, -p.width/p.height, p.width/p.height, 0, p.width);
    let centroY_screen = p.map(0, -1, 1, 0, p.height);
    let markerSize = p.max(4, p.width/120); // Dimensione marker responsiva
    
    p.fill(255); // Centro: bianco
    p.ellipse(centroX_screen, centroY_screen, markerSize, markerSize);
    
    p.fill(255, 255, 0); // Mouse: giallo
    p.ellipse(p.map(mouse_x_sdf, -p.width/p.height, p.width/p.height, 0, p.width), 
              p.map(mouse_y_sdf, -1, 1, 0, p.height), 
              markerSize, markerSize);
  };
  // Contenuto temporaneo per Js/sketchDemo2.js per test
const sketchDemo2Code = function(p) {
    p.setup = function() {
        p.createCanvas(200, 100);
        console.log("SKETCHDEMO2 MINIMAL: setup() eseguito! Canvas creato.");
    };
    p.draw = function() {
        p.background(0, 255, 0); // Sfondo verde brillante
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Demo 2 Minimal Test OK", p.width / 2, p.height / 2);
        p.noLoop(); // Ferma dopo il primo draw per il test
    };
};
console.log("File Js/sketchDemo2.js PARSATO CORRETTAMENTE, sketchDemo2Code dovrebbe essere definito.");
};