
/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a: any[]): any[] {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

/**
 * Create a random matrix by filling the 3 3x3 matrice in the top-left bottom-right diagonal
 */
function randomStart(): number[][] {
    const gameMatrix = new Array(9).fill(null).map((el, i) => new Array(9).fill(0));
    const numbers = new Array(9).fill(null).map((el, i) => i+1);

    for(let skip = 0; skip < 3; skip++) {
        const tmp = shuffle([...numbers]);
        // console.log(tmp);
        for(let c = 0; c < 3; c++) {
            for(let r = 0; r < 3; r++) {
                gameMatrix[c+skip*3][r+skip*3] = tmp[c*3+r];
            }
        }
    }

    return gameMatrix;
}

// simple coordinate with column and row attributes
export interface Coordinate {
    c: number,
    r: number
}

/**
 * Compare the two coordinates
 */
function compareCoordinates(coord1: Coordinate | null, coord2: Coordinate | null) {
    return coord1 !== null && coord2 !== null && coord1.c === coord2.c && coord1.r === coord2.r;
}


export { shuffle, randomStart, compareCoordinates }
