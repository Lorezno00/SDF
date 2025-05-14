// Parametri modificabili globali (rinominati e commentati)
const canvasSize = 700; // Dimensione del canvas in pixel
const fixedCircleRadius = 0.4; // Raggio del cerchio fisso al centro (in coordinate normalizzate [-1, 1])
// Spessore dei bordi delle forme in coordinate normalizzate.
// Dipendono dalla dimensione del canvas per mantenere una larghezza visiva costante.
const fixedCircleBorderThickness = 1 / canvasSize * 2; // 2 pixel di spessore bordo cerchio fisso
const movingCircleBorderThickness = 1 / canvasSize * 2; // 2 pixel di spessore bordo cerchio mobile
const patternThickness = 0.2; // Soglia per la funzione sin() che determina la larghezza delle bande del pattern concentrico
const patternFrequency = 30.0; // Frequenza del pattern concentrico (quante bande in un intervallo di raggio)
const patternFadeStartRadius = 0.5; // Raggio normalizzato dove inizia la dissolvenza del pattern esterno
const patternFadeEndRadius = 1.0; // Raggio normalizzato dove il pattern esterno diventa completamente nero

// Definizione dei colori usando la funzione helper (similmente a Codice 1)
const canvasBackgroundColor = setColor(0, 0, 0); // Nero
const fixedCircleColor = setColor(255, 255, 255); // Bianco
const movingCircleColor = setColor(255, 255, 0);   // Giallo
const patternInsideColor = setColor(255, 0, 0); // Rosso (pattern interno al cerchio fisso)
const patternOutsideColor = setColor(0, 255, 0); // Verde (pattern esterno al cerchio fisso)
const pixelBackgroundColor = setColor(0, 0, 0);   // Nero (colore di default per i pixel non occupati da forme/pattern)

const centerDotColor = setColor(255, 255, 255); // Bianco per il cerchietto centrale
const centerDotSize = 5; // Dimensione del cerchietto centrale in pixel
const mouseDotColor = setColor(255, 255, 0);   // Giallo per il cerchietto del mouse
const mouseDotSize = 5; // Dimensione del cerchietto del mouse in pixel


function setup() {
  // Crea una finestra di disegno con la dimensione specificata
  createCanvas(canvasSize, canvasSize);
  // Imposta lo sfondo iniziale del canvas (verrà sovrascritto dalla logica dei pixel)
  background(canvasBackgroundColor[0], canvasBackgroundColor[1], canvasBackgroundColor[2]);
  // Assicura una mappatura 1:1 tra unità del codice e pixel dello schermo
  pixelDensity(1);
}

function draw() {
  // Carica l'array di pixel del canvas per modificarlo direttamente
  loadPixels();

  // Mappa le coordinate del mouse dalla scala pixel a una scala normalizzata [-1, 1]
  // Il centro del canvas corrisponde a (0,0) in questo sistema.
  const normalizedMouseX = map(mouseX, 0, width, -1, 1);
  const normalizedMouseY = map(mouseY, 0, height, -1, 1);

  // Calcola la distanza del mouse dal centro (0,0) nel sistema normalizzato
  const mouseDistanceFromCenter = dist(normalizedMouseX, normalizedMouseY, 0, 0);

  // Calcola il raggio del cerchio mobile. È la distanza tra la posizione del mouse
  // e il bordo del cerchio fisso. Usiamo abs() per avere sempre un raggio positivo.
  const movingCircleRadius = abs(mouseDistanceFromCenter - fixedCircleRadius);

  // Cicla su ogni singolo pixel del canvas
  for (let i = 0; i < height; i++) { // Ciclo per le righe (coordinate Y)
    for (let j = 0; j < width; j++) { // Ciclo per le colonne (coordinate X)

      // Mappa le coordinate pixel (j, i) alla scala normalizzata [-1, 1]
      const u = map(j, 0, width - 1, -1, 1);
      const v = map(i, 0, height - 1, -1, 1);

      // Calcola la distanza del punto corrente (u, v) dal centro (0,0) nel sistema normalizzato
      const distanceFromCenterPixel = sqrt(u * u + v * v); // Equivalente a length(u, v)

      // Calcola il valore per il pattern concentrico basato sulla distanza dal centro
      // La funzione sin() crea bande periodiche. Moltiplicare per PI * frequency
      // controlla quante bande si formano per unità di raggio.
      const patternValue = sin(distanceFromCenterPixel * PI * patternFrequency);

      // Calcola le distanze firmate dai bordi dei cerchi (usando la funzione helper `sdfCircle`)
      // c1: SDF per il cerchio fisso centrato in (0,0) con raggio fixedCircleRadius
      const c1 = sdfCircle(u, v, fixedCircleRadius);
      // c2: SDF per il cerchio mobile centrato nella posizione del mouse (normalizedMouseX, normalizedMouseY)
      // con raggio movingCircleRadius. (u - mx, v - my) sposta il sistema di coordinate.
      const c2 = sdfCircle(u - normalizedMouseX, v - normalizedMouseY, movingCircleRadius);

      // Inizializza il colore del pixel con lo sfondo di default
      let r, g, b;
      let currentAlpha = 255; // Alpha (trasparenza) impostata a opaco

      // Logica per determinare il colore del pixel basata sulle distanze firmate e sul pattern
      // abs(sdf) < threshold: il punto è vicino al bordo (entro lo spessore definito)

      // Se il punto è vicino al bordo del cerchio fisso (bianco)
      if (abs(c1) < fixedCircleBorderThickness) {
        r = fixedCircleColor[0];
        g = fixedCircleColor[1];
        b = fixedCircleColor[2];
      }
      // Altrimenti, se il punto è vicino al bordo del cerchio mobile (giallo)
      else if (abs(c2) < movingCircleBorderThickness) {
        r = movingCircleColor[0];
        g = movingCircleColor[1];
        b = movingCircleColor[2];
      }
      // Altrimenti, se il punto è vicino ai "bordi" del pattern concentrico
      else if (abs(patternValue) < patternThickness) {
        // Controlla se il punto si trova all'interno o all'esterno del raggio del cerchio fisso
        if (distanceFromCenterPixel < fixedCircleRadius) {
          // Se è interno, usa il colore del pattern interno (rosso)
          r = patternInsideColor[0];
          g = patternInsideColor[1];
          b = patternInsideColor[2];
        } else {
          // Se è esterno, usa il colore del pattern esterno (verde)
          r = patternOutsideColor[0];
          g = patternOutsideColor[1];
          b = patternOutsideColor[2];

          // Applica la dissolvenza al pattern esterno basata sulla distanza dal centro
          // La dissolvenza avviene tra patternFadeStartRadius e patternFadeEndRadius
          if (distanceFromCenterPixel > patternFadeStartRadius) {
            // Calcola il fattore di dissolvenza: 1.0 (colore pieno) a 0.0 (sfondo nero)
            // man mano che la distanza va da patternFadeStartRadius a patternFadeEndRadius
            let fadeFactor = map(distanceFromCenterPixel,
              patternFadeStartRadius,
              patternFadeEndRadius,
              1.0, 0.0);
            // Limita il fattore tra 0 e 1 per evitare valori anomali
              fadeFactor = constrain(fadeFactor, 0.0, 1.0);

            // Applica il fattore di dissolvenza ai componenti RGB del colore del pattern esterno
            // (verde che dissolve nel nero)
              r = r * fadeFactor;
              g = g * fadeFactor;
              b = b * fadeFactor;
          }
        }
      }
      // Altrimenti, se nessuna delle condizioni sopra è vera, usa il colore di sfondo per i pixel
      else {
        r = pixelBackgroundColor[0];
        g = pixelBackgroundColor[1];
        b = pixelBackgroundColor[2];
      }

      // Calcola l'indice nell'array 1D `pixels` corrispondente alla posizione (j, i)
      const index = (j + i * width) * 4; // Ogni pixel occupa 4 posizioni (R, G, B, A)

      // Scrive i componenti del colore e dell'alpha nell'array di pixel
      pixels[index + 0] = r; // Rosso
      pixels[index + 1] = g; // Verde
      pixels[index + 2] = b; // Blu
      pixels[index + 3] = currentAlpha; // Alpha
    }
  }

  // Applica tutte le modifiche all'array di pixel sul canvas
  updatePixels();

  // --- Disegna gli elementi extra direttamente sul canvas (cerchietti) ---
  // Questi vengono disegnati sopra i pixel calcolati in precedenza.

  // Imposta stile per i cerchietti: nessun bordo
  noStroke();

  // Disegna un piccolo cerchietto al centro del canvas
  fill(centerDotColor[0], centerDotColor[1], centerDotColor[2], centerDotColor[3]); // Colore di riempimento
  ellipse(width / 2, height / 2, centerDotSize, centerDotSize); // Disegna l'ellisse (cerchio)

  // Disegna un piccolo cerchietto che segue il puntatore del mouse
  fill(mouseDotColor[0], mouseDotColor[1], mouseDotColor[2], mouseDotColor[3]); // Colore di riempimento
  ellipse(mouseX, mouseY, mouseDotSize, mouseDotSize); // Disegna l'ellisse (cerchio)
}


function sdfCircle(x, y, r) {
  // La distanza dal centro del cerchio (0,0) al punto (x, y) è sqrt(x*x + y*y).
  // La distanza dal bordo è la differenza tra questa distanza e il raggio.
  return sqrt(x * x + y * y) - r;
}

// Utility per creare un array colore in formato [r, g, b, a] (similmente a Codice 1)
function setColor(r, g, b, a) {
  // Assicura che l'alfa sia definito, altrimenti usa 255 (completamente opaco)
  return [r, g, b, a === undefined ? 255 : a];
}

// Nota: Questo codice utilizza funzioni p5.js integrate come map(), constrain(), dist(), sqrt(), sin(), PI(), abs(), noStroke(), fill(), ellipse().