const Csize =600;

function setup() {
  createCanvas(Csize,Csize);
}
function draw() {   
  const pix = 20;
  const soglia = pix * 0.5 / width * 2; 
  
  background(0); 

  stroke(255); 
  strokeWeight(2);
  
  const numPixX = floor(Csize / pix);
  const numPixY = floor(Csize / pix); 

  for (let j = 0; j < numPixX; j++) {    
    for (let i = 0; i < numPixY; i++) {   

        const u = i / (numPixX - 1) * 2 - 1;
        const v = j / (numPixY - 1) * 2 - 1;
      

        const r1 = rettangolo(u, v, 0.8, 0.6); 
        
      const bordor1 = abs(r1) < soglia; 

      if (abs(bordor1)) {
        fill(255);
      } else {
        fill(0);   
      }

      rect(j * pix, i * pix, pix, pix); 
    }
  }
}

function rettangolo(px, py, halfWidth, halfHeight) {
	const dx = abs(px) - halfWidth;
	const dy = abs(py) - halfHeight;
	if (dx <= 0 && dy <= 0) return max(dx, dy); // punto interno, SDF should be negative
	const ox = max(dx, 0);
	const oy = max(dy, 0);
	return sqrt(ox * ox + oy * oy); // distanza esterna
  }
  
