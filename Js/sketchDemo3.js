window.sketchDemo3Code = function(s) {
  s.currentCursorShape = 'circle'; // Default shape
  s.currentCombinationMode = 'xor'; // Default mode

  s.actualCanvasWidth = 400;
  s.actualCanvasHeight = 400;
  s.pixelBlockSize = 4;
  s.gridResolutionW = 100;
  s.gridResolutionH = 100;

  const staticCircleCenterX = 0.6, staticCircleCenterY = -0.6, staticCircleRadius = 0.25;
  const squareCenterX = -0.6, squareCenterY = 0.0, squareHalfSize = 0.2;
  const triangleCenterX = 0.6, triangleCenterY = 0.5, triangleSizeParam = 0.2;

  const mouseCircleRadius = 0.1;
  const mouseSquareHalfSize = 0.08;
  const mouseTriangleSizeParam = 0.1;

  const colorBlackArr = [0, 0, 0, 255];
  const colorWhiteArr = [255, 255, 255, 255];

  const K_SQRT3_TRI_S3 = Math.sqrt(3.0);

  let btnCircle, btnSquare, btnTriangle;
  let btnModeXOR, btnModeUnion; // btnModeUnion è il pulsante '+'
  let shapeButtonsGroup = [];
  let modeButtonsGroup = [];

  function sdfBoxS3(px, py, halfWidth, halfHeight) {
    const dx = Math.abs(px) - halfWidth;
    const dy = Math.abs(py) - halfHeight;
    return Math.sqrt(Math.pow(Math.max(dx, 0), 2) + Math.pow(Math.max(dy, 0), 2)) + Math.min(Math.max(dx, dy), 0);
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
    const clamped_val = Math.min(Math.max(val_to_clamp, min_bound), max_bound);
    px = px - clamped_val;
    return -Math.sqrt(px * px + py * py) * Math.sign(py);
  }

  function sdfXorS3(sdfA, sdfB) {
    const sdfUnionOp = Math.min(sdfA, sdfB);
    const sdfIntersectionOp = Math.max(sdfA, sdfB);
    return Math.max(sdfUnionOp, -sdfIntersectionOp);
  }

  // L'unione di due SDF è il minimo dei loro valori
  function sdfUnionS3(sdfA, sdfB) {
    return Math.min(sdfA, sdfB);
  }

  // L'intersezione di due SDF è il massimo dei loro valori
  function sdfIntersectionS3(sdfA, sdfB) {
    return Math.max(sdfA, sdfB);
  }

  function updateActiveButtonStates() {
    shapeButtonsGroup.forEach(btn => btn.removeClass('active'));
    if (s.currentCursorShape === 'circle') btnCircle.addClass('active');
    else if (s.currentCursorShape === 'square') btnSquare.addClass('active');
    else if (s.currentCursorShape === 'triangle') btnTriangle.addClass('active');

    modeButtonsGroup.forEach(btn => btn.removeClass('active'));
    if (s.currentCombinationMode === 'xor') btnModeXOR.addClass('active');
    else if (s.currentCombinationMode === 'intersection') btnModeUnion.addClass('active');
  }

  s.setup = function() {
    let holder3 = document.getElementById('canvas-holder-3');
    let availableWidth = holder3 ? holder3.offsetWidth : 400;
    availableWidth = Math.max(300, availableWidth);
    s.actualCanvasWidth = Math.min(availableWidth, 600);
    s.actualCanvasHeight = s.actualCanvasWidth;

    s.gridResolutionW = Math.floor(s.actualCanvasWidth / s.pixelBlockSize);
    s.gridResolutionH = Math.floor(s.actualCanvasHeight / s.pixelBlockSize);
    s.actualCanvasWidth = s.gridResolutionW * s.pixelBlockSize;
    s.actualCanvasHeight = s.gridResolutionH * s.pixelBlockSize;

    let cnv = s.createCanvas(s.actualCanvasWidth, s.actualCanvasHeight);
    cnv.parent('canvas-holder-3');
    s.pixelDensity(1);

    let buttonsDiv = document.getElementById('buttons-holder-3');
    if (!buttonsDiv) {
        buttonsDiv = s.createDiv();
        buttonsDiv.id('buttons-holder-3');
        let demoContainer3 = document.getElementById('demo-container-3');
        if(demoContainer3) buttonsDiv.parent(demoContainer3);
        else document.body.appendChild(buttonsDiv.elt);
    }

    while (buttonsDiv.firstChild) {
        buttonsDiv.removeChild(buttonsDiv.firstChild);
    }

    let cursorShapeButtonsDiv = s.createDiv();
    cursorShapeButtonsDiv.parent(buttonsDiv);
    cursorShapeButtonsDiv.addClass('demo3-button-row');

    btnCircle = s.createButton('');
    btnCircle.parent(cursorShapeButtonsDiv);
    btnCircle.addClass('shape-btn');
    btnCircle.addClass('circle-shape');
    btnCircle.mousePressed(() => { s.currentCursorShape = 'circle'; updateActiveButtonStates(); });
    shapeButtonsGroup.push(btnCircle);

    btnSquare = s.createButton('');
    btnSquare.parent(cursorShapeButtonsDiv);
    btnSquare.addClass('shape-btn');
    btnSquare.addClass('square-shape');
    btnSquare.mousePressed(() => { s.currentCursorShape = 'square'; updateActiveButtonStates(); });
    shapeButtonsGroup.push(btnSquare);

    btnTriangle = s.createButton('');
    btnTriangle.parent(cursorShapeButtonsDiv);
    btnTriangle.addClass('shape-btn');
    btnTriangle.addClass('triangle-shape');
    btnTriangle.mousePressed(() => { s.currentCursorShape = 'triangle'; updateActiveButtonStates(); });
    shapeButtonsGroup.push(btnTriangle);

    let combinationModeButtonsDiv = s.createDiv();
    combinationModeButtonsDiv.parent(buttonsDiv);
    combinationModeButtonsDiv.addClass('demo3-button-row');

    btnModeXOR = s.createButton('-');
    btnModeXOR.parent(combinationModeButtonsDiv);
    btnModeXOR.addClass('shape-btn');
    btnModeXOR.addClass('operation-text');
    btnModeXOR.mousePressed(() => { s.currentCombinationMode = 'xor'; updateActiveButtonStates(); });
    modeButtonsGroup.push(btnModeXOR);

    btnModeUnion = s.createButton('+');
    btnModeUnion.parent(combinationModeButtonsDiv);
    btnModeUnion.addClass('shape-btn');
    btnModeUnion.addClass('operation-text');
    btnModeUnion.mousePressed(() => { s.currentCombinationMode = 'intersection'; updateActiveButtonStates(); });
    modeButtonsGroup.push(btnModeUnion);

    updateActiveButtonStates();
  };

  s.windowResized = function() {
    let holder3 = document.getElementById('canvas-holder-3');
    let availableWidth = holder3 ? holder3.offsetWidth : 400;
    availableWidth = Math.max(300, availableWidth);
    s.actualCanvasWidth = Math.min(availableWidth, 600);
    s.actualCanvasHeight = s.actualCanvasWidth;

    s.gridResolutionW = Math.floor(s.actualCanvasWidth / s.pixelBlockSize);
    s.gridResolutionH = Math.floor(s.actualCanvasHeight / s.pixelBlockSize);
    s.actualCanvasWidth = s.gridResolutionW * s.pixelBlockSize;
    s.actualCanvasHeight = s.gridResolutionH * s.pixelBlockSize;

    s.resizeCanvas(s.actualCanvasWidth, s.actualCanvasHeight);
  };

  s.draw = function() {
    const mouseU = s.map(s.mouseX, 0, s.width, -1, 1, true);
    const mouseV = s.map(s.mouseY, 0, s.height, -1, 1, true);

    s.loadPixels();
    for (let gy = 0; gy < s.gridResolutionH; gy++) {
      for (let gx = 0; gx < s.gridResolutionW; gx++) {
        const u = s.map(gx + 0.5, 0, s.gridResolutionW, -1, 1);
        const v = s.map(gy + 0.5, 0, s.gridResolutionH, -1, 1);

        let r_c = colorBlackArr[0], g_c = colorBlackArr[1], b_c = colorBlackArr[2];

        let sdfCursor;
        if (s.currentCursorShape === 'circle') {
          sdfCursor = s.dist(u, v, mouseU, mouseV) - mouseCircleRadius;
        } else if (s.currentCursorShape === 'square') {
          sdfCursor = sdfBoxS3(u - mouseU, v - mouseV, mouseSquareHalfSize, mouseSquareHalfSize);
        } else { // triangle
          sdfCursor = sdfEquilateralTriangleCorrectedS3(u - mouseU, -(v - mouseV), mouseTriangleSizeParam);
        }

        const sdfSC = s.dist(u, v, staticCircleCenterX, staticCircleCenterY) - staticCircleRadius;
        const sdfSQ = sdfBoxS3(u - squareCenterX, v - squareCenterY, squareHalfSize, squareHalfSize);
        const sdfTR = sdfEquilateralTriangleCorrectedS3(u - triangleCenterX, -(v - triangleCenterY), triangleSizeParam);

        let sdfFinal;
        if (s.currentCombinationMode === 'xor') {
          sdfFinal = sdfCursor;
          sdfFinal = sdfXorS3(sdfFinal, sdfSC);
          sdfFinal = sdfXorS3(sdfFinal, sdfSQ);
          sdfFinal = sdfXorS3(sdfFinal, sdfTR);
        } else if (s.currentCombinationMode === 'intersection') {
          // MODIFICATO: Logica per l'intersezione desiderata
          // 1. Calcola l'unione di tutte le forme statiche
          let sdfStaticUnion = sdfUnionS3(sdfSC, sdfSQ); // Unione del cerchio e del quadrato statici
          sdfStaticUnion = sdfUnionS3(sdfStaticUnion, sdfTR); // Unione del risultato precedente con il triangolo statico
                                                              // Ora sdfStaticUnion rappresenta (Statica1 ∪ Statica2 ∪ Statica3)

          // 2. Calcola l'intersezione della forma del cursore con l'unione delle forme statiche
          sdfFinal = sdfIntersectionS3(sdfCursor, sdfStaticUnion); // Cursore ∩ (Statica1 ∪ Statica2 ∪ Statica3)
        }

        if (sdfFinal < 0) {
          r_c = colorWhiteArr[0]; g_c = colorWhiteArr[1]; b_c = colorWhiteArr[2];
        }

        for (let dy = 0; dy < s.pixelBlockSize; dy++) {
          for (let dx = 0; dx < s.pixelBlockSize; dx++) {
            const canvasX = gx * s.pixelBlockSize + dx;
            const canvasY = gy * s.pixelBlockSize + dy;
            if (canvasX < s.actualCanvasWidth && canvasY < s.actualCanvasHeight) {
              const idx = (canvasX + canvasY * s.actualCanvasWidth) * 4;
              s.pixels[idx] = r_c;
              s.pixels[idx + 1] = g_c;
              s.pixels[idx + 2] = b_c;
              s.pixels[idx + 3] = 255;
            }
          }
        }
      }
    }
    s.updatePixels();
  };
};