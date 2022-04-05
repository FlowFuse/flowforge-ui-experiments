const unit = 50;

const pathComponents = {
    "LR": [ "h 50", "h 50", "h 50", "h 50", "h 50" ],
    "RL": [ "h -50", "h -50", "h -50", "h -50", "h -50" ],
    "TB": [ "v 50", "v 50", "v 50", "v 50", "v 50" ],
    "BT": [ "v -50", "v -50", "v -50", "v -50", "v -50" ],
    "LB": [ "a 45 45 0 0 1 45 45", "a 35 35 0 0 1 35 35", "a 25 25 0 0 1 25 25", "a 15 15 0 0 1 15 15", "a 5 5 0 0 1 5 5" ],
    "BL": [ "a 5 5 0 0 0 -5 -5", "a 15 15 0 0 0 -15 -15", "a 25 25 0 0 0 -25 -25", "a 35 35 0 0 0 -35 -35", "a 45 45 0 0 0 -45 -45" ],
    "LT": [ "a 5 5 0 0 0 5 -5", "a 15 15 0 0 0 15 -15", "a 25 25 0 0 0 25 -25", "a 35 35 0 0 0 35 -35", "a 45 45 0 0 0 45 -45" ],
    "TR": [ "a 5 5 0 0 0 5 5", "a 15 15 0 0 0 15 15", "a 25 25 0 0 0 25 25", "a 35 35 0 0 0 35 35", "a 45 45 0 0 0 45 45" ],
    "BR": [ "a 45 45 0 0 1 45 -45", "a 35 35 0 0 1 35 -35", "a 25 25 0 0 1 25 -25", "a 15 15 0 0 1 15 -15", "a 5 5 0 0 1 5 -5" ],
    "TL":  [ "a 45 45 0 0 1 -45 45", "a 35 35 0 0 1 -35 35", "a 25 25 0 0 1 -25 25", "a 15 15 0 0 1 -15 15", "a 5 5 0 0 1 -5 5" ],
    "RT": [ "a 45 45 0 0 1 -45 -45", "a 35 35 0 0 1 -35 -35", "a 25 25 0 0 1 -25 -25", "a 15 15 0 0 1 -15 -15", "a 5 5 0 0 1 -5 -5" ],
    "RB": [ "a 5 5 0 0 0  -5  5", "a 15 15 0 0 0 -15 15", "a 25 25 0 0 0 -25 25", "a 35 35 0 0 0 -35 35", "a 45 45 0 0 0 -45 45" ]
}


let numPaths = 10


function updateColor (color) {
    document.getElementById(color + 'prev').style.backgroundColor = document.getElementById(color).value
}

function updateNumPaths () {
    numPaths = parseInt(document.getElementById('numPaths').value) || 10
}

function generate (seed, colors) {
    const rng = new Math.seedrandom(seed);
    const cols = colors
    let colIndex = 0;
    let background = cols.splice(1+Math.floor(rng()*(cols.length-1)),1)
    let content = "";
    // let headings = [10,10,18,10,18,10,10,18,10,3,10,3,10]
    for (var i=0;i<numPaths;i++) {
        let x = Math.floor(rng()*2) === 0 ? 0 : 15;
        let y = Math.floor(rng()*8);
        // let heading = Math.floor(rng()*2)*2;
        let heading = (x === 0)?2:0
        let previousHeading = heading;
        let col = cols[colIndex]

        let ox = (x+(heading == 2?0:1))*unit
        let oy = y*unit
        let backgroundPath = [
            `M ${ox} ${oy+25}`
        ]
        let visited = new Set()
        let paths = [
            [`M ${ox} ${oy+5}`],
            [`M ${ox} ${oy+15}`],
            [`M ${ox} ${oy+25}`],
            [`M ${ox} ${oy+35}`],
            [`M ${ox} ${oy+45}`],
        ]
        if (heading === 0) {
            paths.reverse()
        }
        colIndex = (colIndex+1)%cols.length
        // let col = cols[Math.floor(rng()*cols.length)]

        let step = 0
        while (x > -1 && x < 17 && y > -1 && y < 9) {
            let tileType
            switch(heading) {
                case 0: tileType = "RL"; break;
                case 1: tileType = "BT"; break;
                case 2: tileType = "LR"; break;
                case 3: tileType = "TB"; break;
            }
            previousHeading = heading;

            let r = Math.floor(rng()*20);
            if (r < 4) {
                if (heading === 0) tileType = "RB";
                if (heading === 1) tileType = "BL";
                if (heading === 2) tileType = "LT";
                if (heading === 3) tileType = "TR";
                heading--
            } else if (r > 15) {
                if (heading === 0) tileType = "RT";
                if (heading === 1) tileType = "BR";
                if (heading === 2) tileType = "LB";
                if (heading === 3) tileType = "TL";
                heading++
            }
            if (heading === -1) { heading = 3 }
            if (heading === 4) { heading = 0 }

            // console.log(heading,tileType)

            if (visited.has(`${x},${y}`)) {
                console.log('collision at',x,y)
                break
            }


            backgroundPath.push(pathComponents[tileType][2])
            paths.forEach((p,idx) => {
                p.push(pathComponents[tileType][idx])
            })
            // content += drawTile(tileType,x,y,col,background)

            visited.add(`${x},${y}`)
            switch(heading) {
                case 0: x -= 1; break;
                case 1: y -= 1; break;
                case 2: x += 1; break;
                case 3: y += 1; break;
            }
        }

        content += `<path d="${backgroundPath.join(" ")}" stroke="${background}" stroke-width="50px" />`
        paths.forEach(p => {
            content += `<path d="${p.join(" ")}" stroke="${col}" stroke-width="5px" />`
        })


    }

    
    const container = document.getElementById('output');
    container.innerHTML = `<svg viewbox="0 0 800 400" class="h-auto w-full" style="background: ${background}"><g fill="none">${content}</g></svg>`
}

function update () {
    const colors = [
        document.getElementById("colorA").value,
        document.getElementById("colorB").value,
        document.getElementById("colorC").value,
        document.getElementById("colorD").value
    ]
    // get colors from input
    updateColor('colorA')
    updateColor('colorB')
    updateColor('colorC')
    updateColor('colorD')

    const seed = document.getElementById("seed").value
    generate(seed, colors)
}

// p5.js setup function
function setup() {
    update();
}