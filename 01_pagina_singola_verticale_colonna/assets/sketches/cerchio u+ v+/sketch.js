const Csize =600;

function setup() {
  createCanvas(Csize,Csize);
}
function draw() {   
  const pix = 15;
  const soglia = pix * 0.5 / width * 2; 
  
  background(0); 

  stroke(255); 
  strokeWeight(0.5);
  
  const numPixX = floor(Csize / pix);
  const numPixY = floor(Csize / pix); 

  for (let j = 0; j < numPixX; j++) {    
    for (let i = 0; i < numPixY; i++) {   

        const u = i / (numPixX - 1) * 2 - 1;
        const v = j / (numPixY - 1) * 2 - 1;
      

        const c1 = cerchio(u+0.46, v-0.4, 0.5); 
        const c2 = cerchio(u+0.46, v-0.4, 0.05); 
        
      const bordoc1 = abs(c1) < soglia; 

      if ((abs(c1) < soglia) || (c2 < 0)) {
        fill(255);
      } else {
        fill(0);   
      }

      rect(j * pix, i * pix, pix, pix); 
    }
  }
}

function cerchio(x, y, r) {
    return sqrt(x ** 2 + y ** 2) - r;
  }
  
