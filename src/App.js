// import logo from './logo.svg';
import _ from 'lodash';
import './App.css';
import React, { useEffect } from 'react';

/* UTILS */

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}


function hardcodedStart() {
  return [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ];
}

function randomStart() {
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

function solveMatrix(matrix) {
  const OKCol = (matrix, col, nb) => {
    for(let r = 0; r < 9; r++) if(matrix[col][r] === nb) return false;
    return true;
  };

  const OKRow = (matrix, row, nb) => {
    for(let c = 0; c < 9; c++) if(matrix[c][row] === nb) return false;
    return true;
  };

  const OKMatrix = (matrix, col, row, nb) => {
    const startCol = Math.floor(col / 3) * 3, startRow = Math.floor(row / 3) * 3;
    for (let c = 0; c < 3; c++)
      for (let r = 0; r < 3; r++)
        if(nb === matrix[c + startCol][r + startRow]) return false;
    return true;
  }

  const solve = (matrix) => {
    let rem = 0;
    for(let column = 0; column < 9; column++)
      for(let row = 0; row < 9; row++) {
        if (matrix[column][row]) continue;

        rem = 1;
        for (let nb = 1; nb <= 9; nb++) {
          if(OKRow(matrix, row, nb) && OKCol(matrix, column, nb) && OKMatrix(matrix, column, row, nb)) {
            matrix[column][row] = nb;
            if(solve(matrix)) return true;
            matrix[column][row] = 0;
          }
        }
        return false;
      }
    if(rem === 0) return true;
    return false;
  };

  console.log(matrix);
}


function compareCoordinates(coord1, coord2) {
  return coord1 !== null && coord2 !== null && coord1.c === coord2.c && coord1.r === coord2.r;
}

/* END OF UTILS */


class Box extends React.Component {
  class() {
    let classname = 'box';
    if(!this.props.fixed) classname += " editable";
    if(this.props.selected) classname += " selected";
    return classname;
  }

  render() {
    return (
      <div className={this.class()}
            onClick={() => { if(!this.props.fixed) this.props.selectCell(this.props.coordinates) }}>
          {this.props.number ? this.props.number : ""}
      </div>
    );
  }
}


class Matrix3 extends React.Component {
  getNumberFromMatrice() {
    const tpCol = Math.floor(this.props.matrixNb % 3) * 3, // top left column index of the matrix
        tpRow = Math.floor(this.props.matrixNb / 3) * 3;
    const fixed = new Array(9).fill(0);
    const edit = new Array(9).fill(0);
    const coordinates = new Array(9).fill(null);
    for(let row = 0; row < 3; row++)
      for(let col = 0; col < 3; col++) {
        fixed[row*3 + col] = this.props.fixedMatrix[col+tpCol][row+tpRow];
        edit[row*3 + col] = this.props.editMatrix[col+tpCol][row+tpRow];
        coordinates[row*3 + col] = { c: col+tpCol, r: row+tpRow };
      }

    return { fixed, edit, coordinates };
  }

  makeBoxes() {
    const { fixed, edit, coordinates } = this.getNumberFromMatrice();
    
    return new Array(9).fill(null).map((el, i) => {
      let box = <Box key={"box"+this.props.matrixNb+"-"+(i+1)}
                    fixed={fixed[i]}
                    number={fixed[i] ? fixed[i] : edit[i]}
                    coordinates={coordinates[i]}
                    selected={compareCoordinates(this.props.cellSelected, coordinates[i])}
                    setNumber={this.props.setNumber}
                    selectCell={this.props.selectCell}/>
      return box;
    });
  }

  render() {
    return (
        <div className="matrix">
          {this.makeBoxes()}
        </div>
    )
  }
}



class Sudoku extends React.Component {
  constructor(props) {
    super(props);

    const mat = randomStart();
    solveMatrix(mat);
    for(let rep = 0; rep < 70; rep++) { mat[Math.floor(Math.random()*9)][Math.floor(Math.random()*9)] = 0; }
    // const mat = new Array(9).fill(null).map((el, i) => new Array(9).fill(0));
    this.state = {
      fixed: mat,
      edit: new Array(9).fill(null).map(() => new Array(9).fill(0)),
      cellSelected: null
    }

    this.setNumber = this.setNumber.bind(this);
    this.selectCell = this.selectCell.bind(this);
    this.keyDown = this.keyDown .bind(this);

    // console.log(this.state.game.fixed);
    // this.solveMatrix();
  }

  // select the cell at the given coordinates
  selectCell(coordinates) {
    // console.log("selected (" + coordinates.c + ", " + coordinates.r + ")");
    if(coordinates.c < 0 || 8 < coordinates.c || coordinates.r < 0 || 8 < coordinates.r) {
      // no need to re-render if no cell was selected
      if(this.state.cellSelected) this.setState({ cellSelected: null });
      return;
    }

    this.setState({ cellSelected: coordinates });
  }

  // set a new number at the given cell
  setNumber(coordinates, nb) {
    console.log(coordinates.c, coordinates.r, nb);
    const gameMatrix = _.cloneDeep(this.state.edit);
    gameMatrix[coordinates.c][coordinates.r] = nb;
    this.setState({ edit: gameMatrix });
  }

  keyDown(e) {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const charCode = e.keyCode || e.which;
    let character = String.fromCharCode(charCode);
    if(this.state.cellSelected) {
      // erase number in case of delete of backspace press
      if(charCode === 46 || charCode === 8) character = '0';
      // input new number in the cell
      if (-1 < numbers.indexOf(character)) this.setNumber(this.state.cellSelected, +character);
      this.setState({ cellSelected: null });
    }
  }


  // create a matrix of 9 cells
  makeMatrice() {
    return new Array(9).fill(null).map((el, i) => {
      return <Matrix3 key={"matrix"+(i+1)}
                      matrixNb={i}
                      fixedMatrix={this.state.fixed}
                      editMatrix={this.state.edit}
                      cellSelected={this.state.cellSelected}
                      setNumber={this.setNumber}
                      selectCell={this.selectCell}/>
    });
  }

  render() {
    return (
        <div className="sudoku" tabIndex="0"
          onKeyDown={this.keyDown}>
          {this.makeMatrice()}
        </div>
    )
  }
}


function App() {
  return (
    <div className="App">
      <Sudoku />
    </div>
  );
}

export default App;
