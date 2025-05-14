// js/sketchDemo1.js
window.sketchDemo1Code = function(p) {
  p.demo = 1;
  p.pixelSize = 20;

  // Funzioni helper (SDF e utility) specifiche per questa demo
  function cerchioSDF(x, y, r) { return Math.sqrt(x ** 2 + y ** 2) - r; }
  function rettangoloSDF(px, py, halfWidth, halfHeight) { 
    const dx = Math.abs(px) - halfWidth; 
    const dy = Math.abs(py) - halfHeight; 
    return Math.sqrt(Math.max(dx, 0)**2 + Math.max(dy, 0)**2) + Math.min(Math.max(dx, dy), 0); 
  }
  function sdEquilateralTriangle(p_obj, r) { 
    const k = Math.sqrt(3); 
    p_obj.x = Math.abs(p_obj.x) - r; 
    p_obj.y = p_obj.y + r / k; 
    if (p_obj.x + k * p_obj.y > 0) { 
      const x_temp = (p_obj.x - k * p_obj.y) / 2; 
      const y_temp = (-k * p_obj.x - p_obj.y) / 2; 
      p_obj.x = x_temp; p_obj.y = y_temp; 
    } 
    p_obj.x -= p.clamp(p_obj.x, -2 * r, 0); // Usa p.clamp
    return -Math.hypot(p_obj.x, p_obj.y) * Math.sign(p_obj.y); 
  }
  // p.clamp è globale di p5, ma se lo definisci qui non c'è problema
  // function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }


  p.getCanvasSizeDemo1 = function() {
    const holder = document.getElementById('canvas-holder');
    let holderClientWidth = holder ? holder.clientWidth : (window.innerWidth * 0.9);
    let availableWidth;
    if (window.innerWidth < 768) {
      availableWidth = window.innerWidth * 0.85;
    } else {
      availableWidth = Math.min(holderClientWidth, window.innerWidth * 0.55);
    }
    let canvasDim = p.constrain(availableWidth, 360, 720);
    return canvasDim;
  }

  p.setup = function() {
    const slider = document.getElementById('pixel-slider-demo1'); // ID Aggiornato
    const sliderValueDisplay = document.getElementById('slider-value-demo1'); // ID Aggiornato

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
    
    p.stroke(200);
    p.strokeWeight(1);
    p.noLoop();

    slider.addEventListener('input', function() {
      p.pixelSize = getInvertedSliderValue();
      if (sliderValueDisplay) sliderValueDisplay.textContent = p.pixelSize;
      p.redraw();
    });

    // Aggiungi event listener ai pulsanti della Demo 1
    document.getElementById('btnDemo1Shape1').onclick = () => p.changeDemoAndUpdate(1);
    document.getElementById('btnDemo1Shape2').onclick = () => p.changeDemoAndUpdate(2);
    document.getElementById('btnDemo1Shape3').onclick = () => p.changeDemoAndUpdate(3);
    
    p.changeDemoAndUpdate(p.demo); // Applica stato iniziale pulsante
    p.redraw();
  };

  p.draw = function() {
    p.background(255);
    let numPixelsForSDFThickness = Math.floor(p.width / p.pixelSize);
    numPixelsForSDFThickness = Math.max(1, numPixelsForSDFThickness);
    const soglia = (numPixelsForSDFThickness > 0) ? (0.53 * 2) / numPixelsForSDFThickness : 0.01;

    if (p.demo === 1) p.demo1SDF(soglia);
    else if (p.demo === 2) p.demo2SDF(soglia);
    else if (p.demo === 3) p.demo3SDF(soglia);
  };
  
  p.windowResized = function() {
      let currentCanvasSize = p.getCanvasSizeDemo1();
      p.resizeCanvas(currentCanvasSize, currentCanvasSize);
      p.redraw();
  };

  p.changeDemoAndUpdate = function(num) {
    p.demo = num;
    p.redraw();
    for (let i = 1; i <= 3; i++) {
      const btn = document.getElementById('btnDemo1Shape' + i);
      if (btn) btn.classList.remove('active');
    }
    const activeBtn = document.getElementById('btnDemo1Shape' + num);
    if (activeBtn) activeBtn.classList.add('active');
  };

  p.demo1SDF = function(soglia) {
    p.stroke(0); p.strokeWeight(2);
    for (let j_coord = 0; j_coord < p.height; j_coord += p.pixelSize) {
      for (let i_coord = 0; i_coord < p.width; i_coord += p.pixelSize) {
        const u = p.map(i_coord + p.pixelSize / 2, 0, p.width, -1, 1);
        const v = p.map(j_coord + p.pixelSize / 2, 0, p.height, -1, 1);
        const c1 = cerchioSDF(u, v, 0.8); // usa helper
        const bordoc1 = Math.abs(c1) < soglia;
        p.fill(bordoc1 ? 0 : 255);
        p.rect(i_coord, j_coord, p.pixelSize, p.pixelSize);
      }
    }
  };

  p.demo2SDF = function(soglia) {
    p.stroke(0); p.strokeWeight(2);
    for (let j_coord = 0; j_coord < p.height; j_coord += p.pixelSize) {
      for (let i_coord = 0; i_coord < p.width; i_coord += p.pixelSize) {
        const u = p.map(i_coord + p.pixelSize / 2, 0, p.width, -1, 1);
        const v = p.map(j_coord + p.pixelSize / 2, 0, p.height, -1, 1);
        const r1 = sdEquilateralTriangle({ x: u, y: -v + 0.25 }, 0.8); // usa helper
        const bordor1 = Math.abs(r1) < soglia;
        p.fill(bordor1 ? 0 : 255);
        p.rect(i_coord, j_coord, p.pixelSize, p.pixelSize);
      }
    }
  };

  p.demo3SDF = function(soglia) {
    p.stroke(0); p.strokeWeight(2);
    for (let j_coord = 0; j_coord < p.height; j_coord += p.pixelSize) {
      for (let i_coord = 0; i_coord < p.width; i_coord += p.pixelSize) {
        const u = p.map(i_coord + p.pixelSize / 2, 0, p.width, -1, 1);
        const v = p.map(j_coord + p.pixelSize / 2, 0, p.height, -1, 1);
        const r1 = rettangoloSDF(u, v, 0.4, 0.7); // usa helper
        const bordor1 = Math.abs(r1) < soglia;
        p.fill(bordor1 ? 0 : 255);
        p.rect(i_coord, j_coord, p.pixelSize, p.pixelSize);
      }
    }
  };
};