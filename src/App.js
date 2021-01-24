// import logo from './logo.svg';
import _ from 'lodash';
import './App.css';
import React, { useEffect, useState } from 'react';

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

function OKCol(matrix, col, nb) {
  for(let r = 0; r < 9; r++) if(matrix[col][r] === nb) return false;
  return true;
};

function OKRow(matrix, row, nb) {
  for(let c = 0; c < 9; c++) if(matrix[c][row] === nb) return false;
  return true;
};

function OKMatrix(matrix, col, row, nb) {
  const startCol = Math.floor(col / 3) * 3, startRow = Math.floor(row / 3) * 3;
  for (let c = 0; c < 3; c++)
    for (let r = 0; r < 3; r++)
      if(nb === matrix[c + startCol][r + startRow]) return false;
  return true;
}

function checkNumberCell(matrix, col, row, nb) {
  return OKRow(matrix, row, nb) && OKCol(matrix, col, nb) && OKMatrix(matrix, col, row, nb);
}

function solveMatrix(matrix) {
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

function isMatrixValid(matrix, copy = true) {
  let res;
  if(copy) {
    const copied = _.cloneDeep(matrix);
    res = solveMatrix(copied);
    console.log(copied);
  }
  else res = solveMatrix(matrix);
  return res;
}

function compareCoordinates(coord1, coord2) {
  return coord1 !== null && coord2 !== null && coord1.c === coord2.c && coord1.r === coord2.r;
}


//TODO change to enums using Typescript
const CellType = {
  FIXED: 'fixed',
  EDITABLE: 'editable',
  VALID: 'valid',
  INVALID: 'invalid'
}

const Difficulty = {
  EASY: 5,
  MEDIUM: 6,
  HARD: 7
}

/* END OF UTILS */


class Box extends React.Component {
  class() {
    let classname = 'box ' + this.props.type;
    if(this.props.selected) classname += " selected";
    return classname;
  }

  render() {
    return (
      <div className={this.class()}
            onClick={() => { if(this.props.type !== CellType.FIXED) this.props.selectCell(this.props.coordinates) }}>
          {this.props.number ? this.props.number : ""}
      </div>
    );
  }
}


class Matrix3 extends React.Component {
  getNumberFromMatrice() {
    const tpCol = Math.floor(this.props.matrixNb % 3) * 3, // top left column index of the matrix
        tpRow = Math.floor(this.props.matrixNb / 3) * 3;
    const numbers = new Array(9).fill(0);
    const types = new Array(9).fill('');
    const coordinates = new Array(9).fill(null);
    for(let row = 0; row < 3; row++)
      for(let col = 0; col < 3; col++) {
        numbers[row*3 + col] = this.props.matrix[col+tpCol][row+tpRow];
        types[row*3 + col] = this.props.cellTypes[col+tpCol][row+tpRow];
        coordinates[row*3 + col] = { c: col+tpCol, r: row+tpRow };
      }

    return { numbers, types, coordinates };
  }

  makeBoxes() {
    const { numbers, types, coordinates } = this.getNumberFromMatrice();
    
    return new Array(9).fill(null).map((el, i) => {
      let box = <Box key={"box"+this.props.matrixNb+"-"+(i+1)}
                    type={types[i]}
                    number={numbers[i]}
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

    this.state = {
      sudokuMatrix: new Array(9).fill(null).map(() => new Array(9).fill(0)),
      cellTypes: new Array(9).fill(null).map(() => new Array(9).fill('')),
      cellSelected: null
    }

    this.setNumber = this.setNumber.bind(this);
    this.selectCell = this.selectCell.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.startGame = this.startGame.bind(this);

    // console.log(this.state.game.fixed);
    // this.solveMatrix();
  }

  startGame(difficulty = Difficulty.EASY) {
    const sudokuMatrix = randomStart();
    const cellTypes = new Array(9).fill(null).map(() => new Array(9).fill(0));

    solveMatrix(sudokuMatrix);

    // remove N numbers from each column, N depends on the difficulty
    const rows = new Array(9).fill(null).map((el, i) => i);
    for(let c = 0; c < 9; c++) {
      const toRemove = shuffle(rows);
      for(let i = 0; i < difficulty; i++) sudokuMatrix[c][toRemove[i]] = 0;
    }

    for(let c = 0; c < 9; c++)
      for(let r = 0; r < 9; r++)
        if(sudokuMatrix[c][r]) cellTypes[c][r] = CellType.FIXED;
        else cellTypes[c][r] = CellType.EDITABLE;

    this.setState({ sudokuMatrix: sudokuMatrix, cellTypes: cellTypes });
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
    // console.log(coordinates.c, coordinates.r, nb);
    const matrix = _.cloneDeep(this.state.sudokuMatrix);
    let types = _.cloneDeep(this.state.cellTypes);

    // reset cell in case a number is already present
    matrix[coordinates.c][coordinates.r] = 0;
    let valid = checkNumberCell(matrix, coordinates.c, coordinates.r, nb);
    matrix[coordinates.c][coordinates.r] = nb;
    if(valid) {
      // console.log("valid?")
      valid = isMatrixValid(matrix);
      // console.log(valid);
    }
    types[coordinates.c][coordinates.r] = valid ? CellType.VALID : CellType.INVALID;

    // const i = invalids.indexOf(coordinates);
    // if(valid && i !== -1) invalids = invalids.slice(i);
    // else if(!valid && i !== -1) invalids.push(coordinates);
    
    // this.setState({ edit: gameMatrix, invalidCoordinates: invalids });
    this.setState({ sudokuMatrix: matrix, cellTypes: types });
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
                      matrix={this.state.sudokuMatrix}
                      cellTypes={this.state.cellTypes}
                      cellSelected={this.state.cellSelected}
                      setNumber={this.setNumber}
                      selectCell={this.selectCell}/>
    });
  }

  componentDidMount() {
    this.startGame(this.props.difficulty);
  }

  render() {
    return (
        <div className="sudoku" tabIndex="0"
          onKeyDown={this.keyDown}
          onBlur={() => this.selectCell({c: -1, r: -1})}>
          {this.makeMatrice()}
        </div>
    )
  }
}


function formatTime(time) {
  const [ hour, minutes, seconds ] = [ Math.floor(time/3600), Math.floor(time/60), time%60 ];
  const text = [ hour < 10 ? "0"+hour : ""+hour,
                minutes < 10 ? "0"+minutes : ""+minutes,
                seconds < 10 ? "0"+seconds : ""+seconds];
  return text.join(":");
}

// simple timer to count time since start of the game
const Timer = (props) => {
  const [ time, setTime ] = useState(0);

  useEffect(() => {
    setTimeout( () => setTime(time+1),1000);
  });

  return (
      <div className="right-container">
        <span id="timer">
          {formatTime(time)}
        </span>
      </div>
  );
}

class Game extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      difficulty: 0
    }
  }

  playArea() {
    return (
        <div>
          <Timer />
          <Sudoku difficulty={this.state.difficulty}/>
        </div>
    )
  }

  render() {
    return (
        <div className="center-container">
          <div hidden={this.state.difficulty}>
            <h2>Choose your difficulty</h2>
            <div className="button-list">
              <button onClick={() => this.setState({difficulty: Difficulty.EASY})}>Easy</button>
              <button onClick={() => this.setState({difficulty: Difficulty.MEDIUM})}>Medium</button>
              <button onClick={() => this.setState({difficulty: Difficulty.HARD})}>Hard</button>
            </div>
          </div>
          {this.state.difficulty ? this.playArea() : <div/>}
        </div>
    )
  }
}

function App() {
  return (
    <div className="App">
      <Game />
    </div>
  );
}

export default App;
