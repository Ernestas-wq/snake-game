import React, { useEffect, useState } from "react"
import {
  randomIntFromInterval,
  reverseLinkedList,
  useInterval,
} from "../lib/utils.js"
import { CellValue } from "../types/CellValue"
import { LinkedListNode } from "../types/LinkedListNode"
import { LinkedList } from "../types/LinkedList"
import { Direction } from "../types/Direction"
import "./Board.css"
import { Coordinate } from "../types/Coordinate"
import { ArrowKey } from "../types/ArrowKey.js"

/**
 * TODO: add a more elegant UX for before a game starts and after a game ends.
 * A game probably shouldn't start until the user presses an arrow key, and
 * once a game is over, the board state should likely freeze until the user
 * intentionally restarts the game.
 */

const BOARD_SIZE = 10
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.3

const getStartingSnakeLLValue = (board: number[][]): CellValue => {
  const rowSize = board.length
  const colSize = board[0].length
  const startingRow = Math.round(rowSize / 3)
  const startingCol = Math.round(colSize / 3)
  const startingCell = board[startingRow][startingCol]
  return {
    row: startingRow,
    col: startingCol,
    cell: startingCell,
  }
}

const Board = () => {
  const [score, setScore] = useState(0)
  const [board, setBoard] = useState(createBoard(BOARD_SIZE))
  const [snake, setSnake] = useState(
    new LinkedList(getStartingSnakeLLValue(board))
  )
  const [snakeCells, setSnakeCells] = useState(
    new Set([snake.getHead().getValue().cell])
  )
  // Naively set the starting food cell 5 cells away from the starting snake cell.
  const [foodCell, setFoodCell] = useState(snake.getHead().getValue().cell + 5)
  const [direction, setDirection] = useState(Direction.RIGHT)
  const [foodShouldReverseDirection, setFoodShouldReverseDirection] =
    useState(false)

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      handleKeydown(e)
    })
  }, [])

  // `useInterval` is needed; you can't naively do `setInterval` in the
  // `useEffect` above. See the article linked above the `useInterval`
  // definition for details.
  useInterval(() => {
    moveSnake()
  }, 150)

  const handleKeydown = (e: KeyboardEvent): void => {
    const newDirection = getDirectionFromKey(e.key as ArrowKey)
    const isValidDirection = newDirection !== null
    if (!isValidDirection) return
    const snakeWillRunIntoItself =
      getOppositeDirection(newDirection) === direction && snakeCells.size > 1
    // Note: this functionality is currently broken, for the same reason that
    // `useInterval` is needed. Specifically, the `direction` and `snakeCells`
    // will currently never reflect their "latest version" when `handleKeydown`
    // is called. I leave it as an exercise to the viewer to fix this :P
    if (snakeWillRunIntoItself) return
    setDirection(newDirection)
  }

  const moveSnake = () => {
    const currentHeadCoords = {
      row: snake.getHead().getValue().row,
      col: snake.getHead().getValue().col,
    } as Coordinate

    const nextHeadCoords = getCoordsInDirection(currentHeadCoords, direction)
    if (isOutOfBounds(nextHeadCoords, board)) {
      handleGameOver()
      return
    }
    const nextHeadCell = board[nextHeadCoords.row][nextHeadCoords.col]
    if (snakeCells.has(nextHeadCell)) {
      handleGameOver()
      return
    }

    const newHead = new LinkedListNode({
      row: nextHeadCoords.row,
      col: nextHeadCoords.col,
      cell: nextHeadCell,
    })
    const currentHead = snake.getHead()
    snake.setHead(newHead)
    currentHead.setNext(newHead)

    const newSnakeCells = new Set(snakeCells)
    newSnakeCells.delete(snake.getTail().getValue().cell)
    newSnakeCells.add(nextHeadCell)

    snake.setTail(snake.getTail().getNext()!)

    if (snake.getTail() === null) snake.setTail(snake.getHead())

    const foodConsumed = nextHeadCell === foodCell
    if (foodConsumed) {
      // This function mutates newSnakeCells.
      growSnake(newSnakeCells)
      if (foodShouldReverseDirection) reverseSnake()
      handleFoodConsumption(newSnakeCells)
    }

    setSnakeCells(newSnakeCells)
  }

  // This function mutates newSnakeCells.
  const growSnake = (newSnakeCells: Set<number>) => {
    const growthNodeCoords = getGrowthNodeCoords(snake.getTail(), direction)
    if (isOutOfBounds(growthNodeCoords, board)) {
      // Snake is positioned such that it can't grow; don't do anything.
      return
    }
    const newTailCell = board[growthNodeCoords.row][growthNodeCoords.col]
    const newTail = new LinkedListNode({
      row: growthNodeCoords.row,
      col: growthNodeCoords.col,
      cell: newTailCell,
    })
    const currentTail = snake.getTail()
    snake.setTail(newTail)
    snake.getTail().setNext(currentTail)
    // snake.tail.next = currentTail

    newSnakeCells.add(newTailCell)
  }

  const reverseSnake = () => {
    const tailNextNodeDirection = getNextNodeDirection(
      snake.getTail(),
      direction
    )
    const newDirection = getOppositeDirection(tailNextNodeDirection)
    setDirection(newDirection)

    // The tail of the snake is really the head of the linked list, which
    // is why we have to pass the snake's tail to `reverseLinkedList`.
    reverseLinkedList(snake.getTail())
    const snakeHead = snake.getHead()
    snake.setHead(snake.getTail())
    snake.setTail(snakeHead)
  }

  const handleFoodConsumption = (newSnakeCells: Set<number>) => {
    const maxPossibleCellValue = BOARD_SIZE * BOARD_SIZE
    let nextFoodCell
    // In practice, this will never be a time-consuming operation. Even
    // in the extreme scenario where a snake is so big that it takes up 90%
    // of the board (nearly impossible), there would be a 10% chance of generating
    // a valid new food cell--so an average of 10 operations: trivial.
    while (true) {
      nextFoodCell = randomIntFromInterval(1, maxPossibleCellValue)
      if (newSnakeCells.has(nextFoodCell) || foodCell === nextFoodCell) continue
      break
    }

    const nextFoodShouldReverseDirection =
      Math.random() < PROBABILITY_OF_DIRECTION_REVERSAL_FOOD

    setFoodCell(nextFoodCell)
    setFoodShouldReverseDirection(nextFoodShouldReverseDirection)
    setScore(score + 1)
  }

  const handleGameOver = () => {
    setScore(0)
    const snakeLLStartingValue = getStartingSnakeLLValue(board)
    setSnake(new LinkedList(snakeLLStartingValue))
    setFoodCell(snakeLLStartingValue.cell + 5)
    setSnakeCells(new Set([snakeLLStartingValue.cell]))
    setDirection(Direction.RIGHT)
  }

  return (
    <>
      <h1>Score: {score}</h1>
      <div className="board">
        {board.map((row, rowIdx) => (
          <div key={rowIdx} className="row">
            {row.map((cellValue, cellIdx) => {
              const className = getCellClassName(
                cellValue,
                foodCell,
                foodShouldReverseDirection,
                snakeCells
              )
              return <div key={cellIdx} className={className}></div>
            })}
          </div>
        ))}
      </div>
    </>
  )
}

const createBoard = (boardSize: number): number[][] => {
  let counter = 1
  const board = []
  for (let row = 0; row < boardSize; row++) {
    const currentRow = []
    for (let col = 0; col < boardSize; col++) {
      currentRow.push(counter++)
    }
    board.push(currentRow)
  }
  return board
}

const getCoordsInDirection = (
  coords: Coordinate,
  direction: Direction
): Coordinate => {
  switch (direction) {
    case Direction.UP:
      return {
        row: coords.row - 1,
        col: coords.col,
      }
    case Direction.RIGHT:
      return {
        row: coords.row,
        col: coords.col + 1,
      }
    case Direction.DOWN:
      return {
        row: coords.row + 1,
        col: coords.col,
      }
    case Direction.LEFT:
      return {
        row: coords.row,
        col: coords.col - 1,
      }
    default:
      throw new Error(`Invalid direction: ${direction}`)
  }
}

const isOutOfBounds = (coords: Coordinate, board: number[][]) => {
  const { row, col } = coords
  if (row < 0 || col < 0) return true
  if (row >= board.length || col >= board[0].length) return true
  return false
}

const getDirectionFromKey = (key: ArrowKey): Direction | null => {
  switch (key) {
    case ArrowKey.ARROW_UP:
      return Direction.UP
    case ArrowKey.ARROW_RIGHT:
      return Direction.RIGHT

    case ArrowKey.ARROW_DOWN:
      return Direction.DOWN

    case ArrowKey.ARROW_LEFT:
      return Direction.LEFT
    default:
      return null
  }
}

const getNextNodeDirection = (
  node: LinkedListNode,
  currentDirection: Direction
): Direction => {
  if (node.getNext() === null) return currentDirection
  const { row: currentRow, col: currentCol } = node.getValue()
  const { row: nextRow, col: nextCol } = node.getNext()!.getValue()
  if (nextRow === currentRow && nextCol === currentCol + 1) {
    return Direction.RIGHT
  }
  if (nextRow === currentRow && nextCol === currentCol - 1) {
    return Direction.LEFT
  }
  if (nextCol === currentCol && nextRow === currentRow + 1) {
    return Direction.DOWN
  }
  if (nextCol === currentCol && nextRow === currentRow - 1) {
    return Direction.UP
  }
  return Direction.DOWN
}

const getGrowthNodeCoords = (
  snakeTail: LinkedListNode,
  currentDirection: Direction
) => {
  const tailNextNodeDirection = getNextNodeDirection(
    snakeTail,
    currentDirection
  )
  const growthDirection = getOppositeDirection(tailNextNodeDirection)
  const currentTailCoords = {
    row: snakeTail.getValue().row,
    col: snakeTail.getValue().col,
  }
  const growthNodeCoords = getCoordsInDirection(
    currentTailCoords,
    growthDirection
  )
  return growthNodeCoords
}

const getOppositeDirection = (direction: Direction) => {
  switch (direction) {
    case Direction.UP:
      return Direction.DOWN
    case Direction.RIGHT:
      return Direction.LEFT
    case Direction.DOWN:
      return Direction.UP
    case Direction.LEFT:
      return Direction.RIGHT
    default:
      throw new Error(`Invalid direction: ${direction}`)
  }
}

const getCellClassName = (
  cellValue: number,
  foodCell: number,
  foodShouldReverseDirection: boolean,
  snakeCells: Set<number>
) => {
  let className = "cell"
  if (cellValue === foodCell) {
    if (foodShouldReverseDirection) {
      className = "cell cell-purple"
    } else {
      className = "cell cell-red"
    }
  }
  if (snakeCells.has(cellValue)) className = "cell cell-green"

  return className
}

export default Board
