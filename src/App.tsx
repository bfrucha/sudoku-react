import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { checkNumberCell, solveMatrix, isMatrixValid } from './sudoku_logic'
import { Coordinate, shuffle, randomStart, compareCoordinates } from './utils'

// type of the sudoku grid cell
enum CellType {
  FIXED= 'fixed',
  EDITABLE= 'editable',
  VALID= 'valid',
  INVALID= 'invalid'
}

// game difficulty, numerical values are used to remove cells from initial matrix
enum Difficulty {
  EASY= 5,
  MEDIUM= 6,
  HARD= 7
}

interface SelectCell { (coord: Coordinate): void }

interface CellProps {
  type: CellType,
  selected: boolean,
  number: number,
  coordinates: Coordinate,
  selectCell: SelectCell
}

//
class Cell extends React.Component<CellProps> {
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


interface MatrixProps {
  matrixNb: number,
  matrix: number[][],
  cellTypes: CellType[][],
  cellSelected: Coordinate | null
  selectCell: SelectCell
}

class Matrix extends React.Component<MatrixProps> {
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
      return <Cell key={"box"+this.props.matrixNb+"-"+(i+1)}
                    type={types[i]}
                    number={numbers[i]}
                    coordinates={coordinates[i]}
                    selected={compareCoordinates(this.props.cellSelected, coordinates[i])}
                    selectCell={this.props.selectCell}/>
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



interface SudokuState {
  sudokuMatrix: number[][],
  cellTypes: CellType[][],
  cellSelected: Coordinate | null
}

class Sudoku extends React.Component<any, SudokuState> {
  constructor(props: any) {
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
  selectCell(coordinates: Coordinate) {
    // console.log("selected (" + coordinates.c + ", " + coordinates.r + ")");
    if(coordinates.c < 0 || 8 < coordinates.c || coordinates.r < 0 || 8 < coordinates.r) {
      // no need to re-render if no cell was selected
      if(this.state.cellSelected) this.setState({ cellSelected: null });
      return;
    }

    this.setState({ cellSelected: coordinates });
  }

  // set a new number at the given cell
  setNumber(coordinates: Coordinate, nb: number): void {
    // console.log(coordinates.c, coordinates.r, nb);
    const matrix: number[][] = _.cloneDeep(this.state.sudokuMatrix);
    let types: CellType[][] = _.cloneDeep<CellType[][]>(this.state.cellTypes);

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

    this.setState({ sudokuMatrix: matrix, cellTypes: types });
  }

  keyDown(e: any) {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let key = e.key;// | e.code;
    // let character = String.fromCharCode(charCode);
    if(this.state.cellSelected) {
      // erase number in case of delete of backspace press
      // if(charCode === 46 || charCode === 8) character = '0';
      if(-1 < ['Backspace', 'Delete'].indexOf(key)) key = '0';
      // input new number in the cell
      console.log(key);
      if (-1 < numbers.indexOf(key)) this.setNumber(this.state.cellSelected, +key);
      this.setState({ cellSelected: null });
    }
  }

  // create a matrix of 9 cells
  makeMatrice() {
    return new Array(9).fill(null).map((el, i) => {
      return <Matrix key={"matrix"+(i+1)}
                      matrixNb={i}
                      matrix={this.state.sudokuMatrix}
                      cellTypes={this.state.cellTypes}
                      cellSelected={this.state.cellSelected}
                      selectCell={this.selectCell}/>
    });
  }

  componentDidMount() {
    this.startGame(this.props.difficulty);
  }

  render() {
    return (
        <div className="sudoku" tabIndex={0}
          onKeyDown={this.keyDown}
          onBlur={() => this.selectCell({c: -1, r: -1})}>
          {this.makeMatrice()}
        </div>
    )
  }
}


function formatTime(time: number) {
  const [ hour, minutes, seconds ] = [ Math.floor(time/3600), Math.floor(time/60), time%60 ];
  const text = [ hour < 10 ? "0"+hour : ""+hour,
                minutes < 10 ? "0"+minutes : ""+minutes,
                seconds < 10 ? "0"+seconds : ""+seconds];
  return text.join(":");
}

// simple timer to count time since start of the game
const Timer = () => {
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


interface GameState { difficulty: Difficulty }

// react component that encapsulates the rest
class Game extends React.Component<any, GameState> {
  constructor(props: any) {
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
          <div id="instructions">
            <h2>How to play?</h2>
            <p>Click on a cell to select it (it will be highlighted in blue), and press a number on your keyboard to input it.
            If the number is at the right position it will appear in blue, otherwise in red.</p>
          </div>
        </div>
    )
  }

  render() {
    return (
        <div className="center-container">
          <div hidden={+this.state.difficulty > 0}>
            <h2 className="centered">Choose your difficulty</h2>
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
