// CONTROLS
IS_PLAYING = true;

// GRID SETTINGS    
PADDING = 50;
GRID_X = 5;
GRID_Y = 5;

// VISUAL SETTINGS
LINE_COLORS = [
    "rgba(255, 0, 0, 1)",
    "rgba(255, 255, 255, 1)",
    "rgba(0, 128, 128, 1)"
]
LINE_WIDTH = 10

// SIMULATION SETTINGS
NO_PARTICLES = 1000
MAX_AGE = 200
SPEED = 1;
DECAY = .02; // higher numbers make a shorter tail

// VISUAL GUIDES
ARROW_LENTH = 30

// GLOBAL VARIABLES - CALCULATED LATER
CANVAS_WIDTH = undefined;
CANVAS_HEIGHT = undefined;
CELL_SIZE_X = undefined;
CELL_SIZE_Y = undefined;

// GLOBAL SIMULATION VARIABLES
PARTICLES = []
FIELD = []

// RNGs
const vRNG = new Math.seedrandom(0); // vector field direction
const pRNG = new Math.seedrandom(1); // position in grid
const cRNG = new Math.seedrandom(2); // colors
const aRNG = new Math.seedrandom(3); // age

/*
    Utility Functions
*/

class Particle {
    constructor (x, y, color, age) {
        this.x = x;
        this.y = y;
        this.dx = 0;
        this.dy = 0;
        this.age = age;
        this.color = color;
    }
}

function drawArrow(x, y, vec, myColor) {
    push();
    stroke(myColor);
    strokeWeight(2);
    fill(myColor);
    translate(x, y);
    line(0, 0, vec.x, vec.y);
    rotate(vec.heading());
    let arrowSize = 5;
    translate(vec.mag() - arrowSize, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
}

function getRandomPosition() {
    return {
        x: (pRNG() * (CANVAS_WIDTH)),
        y: (pRNG() * (CANVAS_HEIGHT))
    }
}

function randomiseParticlePosition (particle) {
    pos = getRandomPosition()
    particle.x = pos.x
    particle.y = pos.y
    return particle
}

function generateParticles (no_particles) {
    let particles = []
    for (let i = 0; i < no_particles; i++) {
        pos = getRandomPosition()
        starting_age = aRNG() * MAX_AGE
        line_color = LINE_COLORS[Math.floor(cRNG() * LINE_COLORS.length)]
        
        p = new Particle(pos.x, pos.y, line_color, starting_age)
        // calculate initial velocity
        v = sampleField(p.x, p.y)
        p.dx = v.x;
        p.dy = v.y
        particles.push(p)
    }
    return particles
}

function calculateSizings (container) {
    CANVAS_WIDTH = container.clientWidth;
    CANVAS_HEIGHT = container.clientHeight;

    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

    CELL_SIZE_X = ((CANVAS_WIDTH - 2 * PADDING) / (GRID_X - 1))
    CELL_SIZE_Y = ((CANVAS_HEIGHT - 2 * PADDING) / (GRID_Y - 1))
}

/*
    Given an x/y cooridnate ,work out the interpolated vector at that position
*/
function sampleField (x, y) {
    // get the indices of the vectors in which we are sat
    let ix0 = 0;
    let ix1 = 0;
    let iy0 = 0;
    let iy1 = 0;

    // calculate the nearest x grid point to our left
    ix0 = Math.floor((x - PADDING)/CELL_SIZE_X);
    ix0 = ix0 < 0 ? 0 : ix0;
    ix0 = ix0 >= GRID_X ? GRID_X - 1 : ix0;
    // calculate the nearest y grid point above us
    iy0 = Math.floor((y - PADDING)/CELL_SIZE_Y);
    iy0 = iy0 < 0 ? 0 : iy0;
    iy0 = iy0 >= GRID_Y ? GRID_Y - 1 : iy0;
    
    ix1 = ix0 + 1;
    ix1 = ix1 >= GRID_X ? GRID_X - 1 : ix1;
    // calculate the nearest y grid point below us
    iy1 = iy0 + 1;
    iy1 = iy1 >= GRID_Y ? GRID_Y - 1 : iy1;

    let offsetX = ((x - PADDING)%CELL_SIZE_X)/CELL_SIZE_X
    let offsetY = ((y - PADDING)%CELL_SIZE_Y)/CELL_SIZE_Y

    let xLeft = lerp(FIELD[ix0][iy0].x, FIELD[ix0][iy1].x, offsetY);
    let xRight = lerp(FIELD[ix1][iy0].x, FIELD[ix1][iy1].x, offsetY);
    let vX = lerp(xLeft, xRight, offsetX);
    
    let yTop = lerp(FIELD[ix0][iy0].y, FIELD[ix1][iy0].y, offsetX);
    let yBottom = lerp(FIELD[ix0][iy1].y, FIELD[ix1][iy1].y, offsetX);
    let vY = lerp(yTop, yBottom, offsetY);
    
    return createVector(vX, vY)
}


function calculateVectorField (container) {

    calculateSizings(container)

    // GENERATE VECTOR FIELD

    let grid = []

    for (let x = 0; x < GRID_X; x++) {
        grid.push([])
        for (let y = 0; y < GRID_Y; y++) {
            const pos_x = (x * CELL_SIZE_X) + PADDING
            const pos_y = (y * CELL_SIZE_Y) + PADDING

            ellipse(pos_x, pos_y, 5, 5);

            let vector = createVector(vRNG() * 2 - 1, vRNG() * 2 - 1);
            grid[x].push(vector)

            drawArrow(pos_x, pos_y, vector.copy().mult(ARROW_LENTH), "white")
        }
    }

    return grid;
}

// p5.js setup function
function setup() {
    FIELD = calculateVectorField(document.getElementById("canvas-container"))
    PARTICLES = generateParticles(NO_PARTICLES)
    initControls();
}

// p5.js draw function
function draw() {

    if (IS_PLAYING) {
        const ctx = drawingContext;
        var prev = ctx.globalCompositeOperation;
        // console.log(prev);
        ctx.globalCompositeOperation = "multiply";
    
        // set the rect drawing settings
        fill(0, 0, 0, 255 * DECAY);
        noStroke();
        // Decay
        rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
        ctx.globalCompositeOperation = prev;
    
        // Update Particles
        PARTICLES.forEach((particle) => {
            ctx.beginPath();
    
            // is our particle old?
            // If so, relocate it (gives the illusion of more particles)
            if (particle.age > MAX_AGE) {
                randomiseParticlePosition(particle).age = 0;
            }
    
            // move our canvas "pen" to the particle's position
            ctx.moveTo(particle.x, particle.y);
            x0 = particle.x;
            y0 = particle.y;
    
            // calculate the new position of the particle given our velocity (dx)
            particle.x = particle.x + particle.dx * SPEED;
            particle.y = particle.y + particle.dy * SPEED;
    
            // move our pen to the new location
            ctx.lineTo(particle.x, particle.y);
    
            // render this movement as a line
            ctx.stroke();
    
            // get the new x/y velocity vector at this location
            let vector = sampleField(particle.x, particle.y);
            // console.log(vector);
            // store our new velocity for the next loop/frame
            particle.dx = vector.x;
            particle.dy = vector.y;
    
            // set our drawing settings
            stroke(particle.color);
            strokeWeight(LINE_WIDTH);
            // draw the line
            line(x0, y0, particle.x, particle.y)
            
            particle.age += 1
        })
    }
    
}

/*
    HTML Controls
*/

function initControls () {
    // NO_PARTICLES
    no_particles = document.getElementById("no_particles")
    no_particles.value = NO_PARTICLES;

    // SPEED
    speed = document.getElementById("speed")
    speed.value = SPEED;
    
    // DECAY
    decay = document.getElementById("decay")
    decay.value = DECAY;
    
    // MAX AGE
    sim_maxage = document.getElementById("sim_maxage")
    sim_maxage.value = MAX_AGE;

    // LINE WIDTH
    line_width = document.getElementById("line_width")
    line_width.value = LINE_WIDTH;
}

function update () {
    // NO_PARTICLES
    no_particles = document.getElementById("no_particles").value;
    NO_PARTICLES = no_particles;

    // SPEED
    speed = document.getElementById("speed").value;
    SPEED = speed;

    // DECAY
    decay = document.getElementById("decay").value;
    DECAY = decay;

    // MAX_AGE
    sim_maxage = document.getElementById("sim_maxage").value;
    MAX_AGE = sim_maxage;

    // Do we have the right number of particles now?
    PARTICLES = PARTICLES.slice(0, NO_PARTICLES)
    if (PARTICLES.length < NO_PARTICLES) {
        // need to add more
        new_particles = generateParticles(NO_PARTICLES - PARTICLES.length);
        PARTICLES = PARTICLES.concat(new_particles);
    }

    // randomise ages
    PARTICLES.forEach((particle) => {
        particle.age = aRNG() * MAX_AGE;
    })

    // LINE_WIDTH
    line_width = document.getElementById("line_width").value;
    LINE_WIDTH = line_width;

}

function pauseAnimation () {
    IS_PLAYING = false;
}

function playAnimation () {
    IS_PLAYING = true;
}

function resetCanvas () {
    const ctx = drawingContext;
    var prev = ctx.globalCompositeOperation;
    // console.log(prev);
    ctx.globalCompositeOperation = "multiply";

    // set the rect drawing settings
    fill(0, 0, 0);
    noStroke();
    // Decay
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.globalCompositeOperation = prev;
}