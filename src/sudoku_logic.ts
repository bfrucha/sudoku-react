import _ from "lodash"


// check whether number is already present in column
function OKCol(matrix: number[][], col: number, nb: number) {
    for(let r = 0; r < 9; r++) if(matrix[col][r] === nb) return false
    return true
}

// check whether number is already present in row
function OKRow(matrix: number[][], row: number, nb: number) {
    for(let c = 0; c < 9; c++) if(matrix[c][row] === nb) return false
    return true
}

// check whether number is already present in 3x3 matrix
function OKMatrix(matrix: number[][], col: number, row: number, nb: number) {
    const startCol = Math.floor(col / 3) * 3, startRow = Math.floor(row / 3) * 3;
    for (let c = 0; c < 3; c++)
        for (let r = 0; r < 3; r++)
            if(nb === matrix[c + startCol][r + startRow]) return false;
    return true;
}

// check whether number is present in column, row, or 3x3 matrix
function checkNumberCell(matrix: number[][], col: number, row: number, nb: number) {
    return OKRow(matrix, row, nb) && OKCol(matrix, col, nb) && OKMatrix(matrix, col, row, nb);
}

// solve the given matrix, or return false if there is no solution
export default function solveMatrix(matrix: number[][]) {
    let rem = 0;
    for(let column = 0; column < 9; column++)
        for(let row = 0; row < 9; row++) {
            if (matrix[column][row]) continue;

            rem = 1;
            for (let nb = 1; nb <= 9; nb++) {
                if(OKRow(matrix, row, nb) && OKCol(matrix, column, nb) && OKMatrix(matrix, column, row, nb)) {
                    matrix[column][row] = nb;
                    if(solveMatrix(matrix)) return true;
                    matrix[column][row] = 0;
                }
            }
            return false;
        }
    if(rem === 0) return true;
    return false;
};

// check whether given matrix has a solution, and solve the matrix if not copied
function isMatrixValid(matrix: number[][], copy = true) {
    let res;
    if(copy) {
        const copied = _.cloneDeep(matrix);
        res = solveMatrix(copied);
        console.log(copied);
    }
    else res = solveMatrix(matrix);
    return res;
}


export { checkNumberCell, solveMatrix, isMatrixValid };
