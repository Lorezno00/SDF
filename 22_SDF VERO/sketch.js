

function setup(){
    createCanvas(500,500)
   

}

function draw(){
    background(220)
    strokeWeight(1)
    const pix = 5
    const dimensione = 100
    noStroke()
    for(let j=0;j<dimensione;j++){
        for(let i=0;i<dimensione;i++){

            const u = i / (dimensione - 1) * 2 - 1 
            const v = j / (dimensione - 1) * 2 - 1 

            const distanza1 = cerchio(u + 0.6, v,       0.5)
            const distanza2 = cerchio(u - 0.4, v - 0.3, 0.01)
            const distanza3 = cerchio(u + 0.2, v - 0.5, 0.3)

            const d = opSmoothUnion(distanza1, distanza2,distanza3,0.5)
            const val = sin(d*20) * 0.5 + 0.5
            fill(val * 255)
        
        rect(i*pix,j*pix,pix,pix)
     }
    }
}


function cerchio(cx, cy, r){
    return sqrt(cx**2 + cy**2) - r
}

function opSmoothUnion(  d1, d2,d3, k )
{
    const h = constrain( 0.5 + 0.5*(d3-d2-d1)/k, 0.0, 1.0 )
    return lerp( d3,d2, d1, h ) - k*h*(1.0-h)
}
