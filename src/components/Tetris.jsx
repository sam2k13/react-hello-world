import { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20;

const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000'];

function Tetris() {
  const [board, setBoard] = useState(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  const getRandomPiece = useCallback(() => {
    const shapes = Object.keys(SHAPES);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    return {
      shape: SHAPES[randomShape],
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }, []);

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(getRandomPiece());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
  };

  const checkCollision = useCallback((piece, pos) => {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }
          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  const mergePiece = useCallback(() => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }
    return newBoard;
  }, [board, currentPiece, position]);

  const clearLines = useCallback((newBoard) => {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        y++;
      }
    }
    return linesCleared;
  }, []);

  const rotatePiece = useCallback(() => {
    if (!currentPiece) return;
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );
    const rotatedPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, position, checkCollision]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted && e.key.startsWith('Arrow')) {
        resetGame();
        return;
      }
      if (gameOver || !currentPiece) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (!checkCollision(currentPiece, { x: position.x - 1, y: position.y })) {
            setPosition(p => ({ ...p, x: p.x - 1 }));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!checkCollision(currentPiece, { x: position.x + 1, y: position.y })) {
            setPosition(p => ({ ...p, x: p.x + 1 }));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!checkCollision(currentPiece, { x: position.x, y: position.y + 1 })) {
            setPosition(p => ({ ...p, y: p.y + 1 }));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPiece, position, gameOver, checkCollision, rotatePiece, gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || !currentPiece) return;

    const gameLoop = setInterval(() => {
      const newPos = { x: position.x, y: position.y + 1 };
      if (checkCollision(currentPiece, newPos)) {
        const newBoard = mergePiece();
        const linesCleared = clearLines(newBoard);
        setScore(s => s + linesCleared * 100);
        setBoard(newBoard);

        const newPiece = getRandomPiece();
        const startPos = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
        
        if (checkCollision(newPiece, startPos)) {
          setGameOver(true);
        } else {
          setCurrentPiece(newPiece);
          setPosition(startPos);
        }
      } else {
        setPosition(newPos);
      }
    }, 500);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, currentPiece, position, checkCollision, mergePiece, clearLines, getRandomPiece]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }
    return displayBoard;
  };

  return (
    <div className="game-content">
      <h1>Tetris</h1>
      <p className="score">Score: {score}</p>
      <div className="game-container">
        <div 
          className="game-board tetris-board"
          style={{
            width: BOARD_WIDTH * CELL_SIZE,
            height: BOARD_HEIGHT * CELL_SIZE,
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
          }}
        >
          {renderBoard().flat().map((cell, i) => (
            <div
              key={i}
              className="tetris-cell"
              style={{
                backgroundColor: cell || '#1a1a1a',
                border: '1px solid #333',
              }}
            />
          ))}
        </div>
        {!gameStarted && !gameOver && (
          <div className="game-message">
            <p>Press any arrow key to start</p>
            <p style={{ fontSize: '0.8em' }}>↑ Rotate | ← → Move | ↓ Drop</p>
          </div>
        )}
        {gameOver && (
          <div className="game-message">
            <p>Game Over!</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tetris;
